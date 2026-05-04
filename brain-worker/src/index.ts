import { neon } from "@neondatabase/serverless";

export interface Env {
  DATABASE_URL: string;
  BRAIN_API_KEY: string;
  BRAIN_AI: Ai;
  BRAIN_DRIVE: R2Bucket;
}

// Generate embedding via Workers AI (768 dimensions, free)
async function embed(env: Env, text: string): Promise<number[] | null> {
  try {
    const result = await env.BRAIN_AI.run("@cf/baai/bge-base-en-v1.5", { text: [text] }) as { data: number[][] };
    return result.data[0];
  } catch {
    return null;
  }
}

// Auth middleware
function authenticate(request: Request, env: Env): boolean {
  const auth = request.headers.get("Authorization");
  if (!auth) return false;
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : auth;
  return token === env.BRAIN_API_KEY;
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  });
}

function error(msg: string, status = 400) {
  return json({ error: msg }, status);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // CORS preflight
    if (method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      });
    }

    // Health check (no auth required)
    if (path === "/" || path === "/health") {
      return json({ status: "ok", service: "brain-worker" });
    }

    // ─── POST /admin/migrate-artifacts ────────────────────────────────────────
    // One-time: create artifacts table
    if (path === "/admin/migrate-artifacts" && method === "POST") {
      if (!authenticate(request, env)) return error("Unauthorized", 401);
      const sql = neon(env.DATABASE_URL);
      await sql`
        CREATE TABLE IF NOT EXISTS artifacts (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT,
          r2_key TEXT NOT NULL UNIQUE,
          content_type TEXT NOT NULL DEFAULT 'application/octet-stream',
          size_bytes BIGINT,
          project_id INTEGER REFERENCES projects(id),
          agent_name TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
      return json({ ok: true, message: "artifacts table created" });
    }

    // ─── POST /admin/migrate-vectors ──────────────────────────────────────────
    // One-time: enable pgvector + alter embedding column to vector(768)
    if (path === "/admin/migrate-vectors" && method === "POST") {
      if (!authenticate(request, env)) return error("Unauthorized", 401);
      const sql = neon(env.DATABASE_URL);
      await sql`CREATE EXTENSION IF NOT EXISTS vector`;
      await sql`ALTER TABLE memories ALTER COLUMN embedding TYPE vector(768) USING embedding::vector(768)`;
      return json({ ok: true, message: "pgvector enabled, embedding column converted to vector(768)" });
    }

    // ─── POST /admin/backfill-embeddings ──────────────────────────────────────
    // Generates embeddings for all memories that have null embedding
    if (path === "/admin/backfill-embeddings" && method === "POST") {
      if (!authenticate(request, env)) return error("Unauthorized", 401);
      try {
        const sql = neon(env.DATABASE_URL);
        const rows = await sql`SELECT id, content FROM memories WHERE embedding IS NULL LIMIT 50`;
        let count = 0;
        let errors: string[] = [];
        for (const row of rows as Array<{ id: number; content: string }>) {
          try {
            const vec = await embed(env, row.content);
            if (vec) {
              const vecStr = `[${vec.join(',')}]`;
              await sql`UPDATE memories SET embedding = ${vecStr}::vector WHERE id = ${row.id}`;
              count++;
            } else {
              errors.push(`id=${row.id}: embed returned null`);
            }
          } catch (e) {
            errors.push(`id=${row.id}: ${(e as Error).message}`);
          }
        }
        const remaining = await sql`SELECT COUNT(*)::int AS n FROM memories WHERE embedding IS NULL`;
        return json({ ok: true, backfilled: count, remaining: (remaining[0] as { n: number }).n, errors });
      } catch (e) {
        return json({ ok: false, error: (e as Error).message, stack: (e as Error).stack }, 500);
      }
    }

    // ─── GET /drive/:r2_key ───────────────────────────────────────────────────
    // Proxy R2 file to browser — no auth required (key is unguessable)
    if (path.startsWith("/drive/") && method === "GET") {
      const r2Key = path.slice(7);
      if (!r2Key) return error("Missing key", 400);
      const obj = await env.BRAIN_DRIVE.get(r2Key);
      if (!obj) return error("Not found", 404);
      const headers = new Headers();
      headers.set("Content-Type", obj.httpMetadata?.contentType || "application/octet-stream");
      headers.set("Access-Control-Allow-Origin", "*");
      if (obj.size) headers.set("Content-Length", String(obj.size));
      return new Response(obj.body, { headers });
    }

    // ─── PUT /drive/:r2_key ───────────────────────────────────────────────────
    // Direct upload — agent streams file body, auth required
    if (path.startsWith("/drive/") && method === "PUT") {
      if (!authenticate(request, env)) return error("Unauthorized", 401);
      const r2Key = path.slice(7);
      if (!r2Key) return error("Missing key", 400);
      const contentType = request.headers.get("Content-Type") || "application/octet-stream";
      await env.BRAIN_DRIVE.put(r2Key, request.body, {
        httpMetadata: { contentType },
      });
      return json({ ok: true, r2_key: r2Key });
    }

    // All other routes require auth
    if (!authenticate(request, env)) {
      return error("Unauthorized", 401);
    }

    const sql = neon(env.DATABASE_URL);

    try {
      // ─── GET /context ─────────────────────────────────────────────────────
      // Returns a <brain-context> block for Claude agents
      if (path === "/context" && method === "GET") {
        const agentName = url.searchParams.get("agent") || "unknown";

        const [projects, memories, tasks, backlog, cronJobs, activeSubagents] = await Promise.all([
          sql`SELECT name, description, status FROM projects WHERE status != 'archived' ORDER BY updated_at DESC LIMIT 10`,
          sql`SELECT content, category, importance FROM memories ORDER BY importance DESC, created_at DESC LIMIT 20`,
          sql`SELECT title, status, priority, agent_name FROM agent_tasks WHERE status IN ('pending','in_progress') ORDER BY priority DESC, created_at DESC LIMIT 15`,
          sql`SELECT title, priority, tags FROM backlog_items WHERE status = 'active' ORDER BY priority DESC LIMIT 10`,
          sql`SELECT name, agent_name, schedule, last_run, last_status FROM cron_jobs ORDER BY last_run DESC NULLS LAST LIMIT 20`,
          sql`SELECT parent_agent, name, task, status FROM subagents WHERE status = 'running' ORDER BY started_at DESC LIMIT 20`,
        ]);

        const context = `<brain-context>
<projects>
${projects.map((p: Record<string, unknown>) => `  <project name="${p.name}" status="${p.status}">${p.description || ""}</project>`).join("\n")}
</projects>
<memories>
${memories.map((m: Record<string, unknown>) => `  <memory category="${m.category}" importance="${m.importance}">${m.content}</memory>`).join("\n")}
</memories>
<active-tasks>
${tasks.map((t: Record<string, unknown>) => `  <task status="${t.status}" priority="${t.priority}" agent="${t.agent_name}">${t.title}</task>`).join("\n")}
</active-tasks>
<cron-jobs>
${(cronJobs as Record<string, unknown>[]).map(c => `  <cron name="${c.name}" agent="${c.agent_name}" schedule="${c.schedule}" last_status="${c.last_status}" last_run="${c.last_run || 'never'}"/>`).join("\n")}
</cron-jobs>
<active-subagents>
${(activeSubagents as Record<string, unknown>[]).map(s => `  <subagent parent="${s.parent_agent}" name="${s.name}" task="${s.task || ''}" status="${s.status}"/>`).join("\n")}
</active-subagents>
<backlog>
${backlog.map((b: Record<string, unknown>) => `  <item priority="${b.priority}" tags="${(b.tags as string[])?.join(",") || ""}">${b.title}</item>`).join("\n")}
</backlog>
</brain-context>`;

        // Update agent last_seen
        await sql`
          INSERT INTO agents (name, agent_type, last_seen)
          VALUES (${agentName}, 'claude-code', NOW())
          ON CONFLICT (name) DO UPDATE SET last_seen = NOW()
        `;

        return new Response(context, {
          headers: { "Content-Type": "text/plain", "Access-Control-Allow-Origin": "*" },
        });
      }

      // ─── GET /context/overview ────────────────────────────────────────────
      // Lightweight session-start context: project tree + urgent backlog only
      if (path === "/context/overview" && method === "GET") {
        const agentName = url.searchParams.get("agent") || "unknown";

        const [projects, backlog, recentSessions] = await Promise.all([
          sql`SELECT id, name, description, status, parent_id FROM projects WHERE status != 'archived' ORDER BY updated_at DESC`,
          sql`SELECT title, priority, tags FROM backlog_items WHERE status = 'active' AND priority >= 8 ORDER BY priority DESC LIMIT 10`,
          sql`SELECT agent_name, summary, created_at FROM sessions ORDER BY created_at DESC LIMIT 5`,
        ]);

        // Build project tree
        const roots = (projects as Record<string, unknown>[]).filter(p => !p.parent_id);
        const childrenOf = (id: number) => (projects as Record<string, unknown>[]).filter(p => p.parent_id === id);
        const renderProject = (p: Record<string, unknown>, depth = 0): string => {
          const indent = '  '.repeat(depth);
          const children = childrenOf(p.id as number);
          const childLines = children.map(c => renderProject(c, depth + 1)).join('\n');
          const line = `${indent}<project id="${p.id}" name="${p.name}" status="${p.status}">${p.description || ''}</project>`;
          return children.length ? `${line}\n${childLines}` : line;
        };

        const overview = `<brain-overview>
<projects>
${roots.map(p => renderProject(p)).join('\n')}
</projects>
<urgent-backlog>
${backlog.map((b: Record<string, unknown>) => `  <item priority="${b.priority}" tags="${(b.tags as string[])?.join(',') || ''}">${b.title}</item>`).join('\n')}
</urgent-backlog>
<recent-sessions>
${(recentSessions as Record<string, unknown>[]).map(s => `  <session agent="${s.agent_name}" when="${s.created_at}">${s.summary || ''}</session>`).join('\n')}
</recent-sessions>
</brain-overview>`;

        await sql`
          INSERT INTO agents (name, agent_type, last_seen)
          VALUES (${agentName}, 'claude-code', NOW())
          ON CONFLICT (name) DO UPDATE SET last_seen = NOW()
        `;

        return new Response(overview, {
          headers: { "Content-Type": "text/plain", "Access-Control-Allow-Origin": "*" },
        });
      }

      // ─── GET /context/project ──────────────────────────────────────────────
      // On-demand full context for a specific project (by name or id)
      if (path === "/context/project" && method === "GET") {
        const nameQuery = url.searchParams.get("name");
        const idQuery = url.searchParams.get("id");

        let projectRows;
        if (idQuery) {
          projectRows = await sql`SELECT * FROM projects WHERE id = ${parseInt(idQuery)}`;
        } else if (nameQuery) {
          const pattern = `%${nameQuery}%`;
          projectRows = await sql`SELECT * FROM projects WHERE name ILIKE ${pattern} ORDER BY updated_at DESC LIMIT 1`;
        } else {
          return error("Provide ?name= or ?id=");
        }

        if (projectRows.length === 0) return error("Project not found", 404);
        const project = projectRows[0] as Record<string, unknown>;
        const pid = project.id as number;

        const queryText = url.searchParams.get("q");
        const queryVec = queryText ? await embed(env, queryText) : null;

        const [children, memories, sessions, tasks, backlog] = await Promise.all([
          sql`SELECT id, name, description, status FROM projects WHERE parent_id = ${pid} ORDER BY name`,
          queryVec
            ? sql`SELECT content, category, importance, created_at FROM memories WHERE project_id = ${pid} AND embedding IS NOT NULL ORDER BY embedding <=> ${JSON.stringify(queryVec)}::vector LIMIT 12`
            : sql`SELECT content, category, importance, created_at FROM memories WHERE project_id = ${pid} ORDER BY importance DESC, created_at DESC LIMIT 20`,
          sql`SELECT agent_name, summary, created_at FROM sessions WHERE project_id = ${pid} ORDER BY created_at DESC LIMIT 10`,
          sql`SELECT title, status, priority FROM agent_tasks WHERE project_id = ${pid} ORDER BY priority DESC, created_at DESC`,
          sql`SELECT title, priority, tags FROM backlog_items WHERE status = 'active' ORDER BY priority DESC LIMIT 50`,
        ]);

        // Filter backlog by project tags (match project name)
        const projectName = (project.name as string).toLowerCase().replace(/[^a-z0-9]/g, '-');
        const filteredBacklog = (backlog as Record<string, unknown>[]).filter(b =>
          (b.tags as string[])?.some(t => t.toLowerCase().includes(projectName) || projectName.includes(t.toLowerCase()))
        );

        const ctx = `<project-context name="${project.name}" id="${pid}">
<description>${project.description || ''}</description>
${(children as Record<string, unknown>[]).length > 0 ? `<sub-projects>
${(children as Record<string, unknown>[]).map(c => `  <project id="${c.id}" name="${c.name}" status="${c.status}">${c.description || ''}</project>`).join('\n')}
</sub-projects>` : ''}
<memories>
${(memories as Record<string, unknown>[]).map(m => `  <memory category="${m.category}" importance="${m.importance}">${m.content}</memory>`).join('\n')}
</memories>
<sessions>
${(sessions as Record<string, unknown>[]).map(s => `  <session agent="${s.agent_name}" when="${s.created_at}">${s.summary || ''}</session>`).join('\n')}
</sessions>
<tasks>
${(tasks as Record<string, unknown>[]).map(t => `  <task status="${t.status}" priority="${t.priority}">${t.title}</task>`).join('\n')}
</tasks>
<backlog>
${filteredBacklog.map(b => `  <item priority="${b.priority}">${b.title}</item>`).join('\n')}
</backlog>
</project-context>`;

        return new Response(ctx, {
          headers: { "Content-Type": "text/plain", "Access-Control-Allow-Origin": "*" },
        });
      }

      // ─── PATCH /memory/:id ─────────────────────────────────────────────────
      if (path.match(/^\/memory\/\d+$/) && method === "PATCH") {
        const id = parseInt(path.split("/")[2]);
        const body = (await request.json()) as { project_id?: number | null; importance?: number; category?: string };
        const result = await sql`
          UPDATE memories SET
            project_id = COALESCE(${body.project_id !== undefined ? body.project_id : null}, project_id),
            importance = COALESCE(${body.importance || null}, importance),
            category = COALESCE(${body.category || null}, category)
          WHERE id = ${id}
          RETURNING id
        `;
        if (result.length === 0) return error("Not found", 404);
        return json({ ok: true });
      }

      // ─── POST /memory ──────────────────────────────────────────────────────
      if (path === "/memory" && method === "POST") {
        const body = (await request.json()) as {
          content: string;
          category?: string;
          importance?: number;
          agent_name?: string;
          project_id?: number;
          embedding?: number[];
        };
        const { content, category = "general", importance = 5, agent_name = "unknown", project_id } = body;

        const vec = await embed(env, content);

        const result = await sql`
          INSERT INTO memories (content, category, importance, agent_name, project_id, embedding)
          VALUES (${content}, ${category}, ${importance}, ${agent_name}, ${project_id || null}, ${vec ? JSON.stringify(vec) : null})
          RETURNING id, created_at
        `;
        return json({ ok: true, id: (result[0] as Record<string, unknown>).id });
      }

      // ─── DELETE /memory/:id ────────────────────────────────────────────────
      if (path.startsWith("/memory/") && method === "DELETE") {
        const id = parseInt(path.split("/")[2]);
        const result = await sql`DELETE FROM memories WHERE id = ${id} RETURNING id`;
        if (result.length === 0) return error("Not found", 404);
        return json({ ok: true });
      }

      // ─── DELETE /task/:id ──────────────────────────────────────────────────
      if (path.startsWith("/task/") && method === "DELETE") {
        const id = parseInt(path.split("/")[2]);
        const result = await sql`DELETE FROM agent_tasks WHERE id = ${id} RETURNING id`;
        if (result.length === 0) return error("Not found", 404);
        return json({ ok: true });
      }

      // ─── GET /memories ─────────────────────────────────────────────────────
      if (path === "/memories" && method === "GET") {
        const category = url.searchParams.get("category");
        const project_id = url.searchParams.get("project_id");
        const limit = parseInt(url.searchParams.get("limit") || "50");

        let memories;
        if (project_id) {
          memories = await sql`SELECT * FROM memories WHERE project_id = ${parseInt(project_id)} ORDER BY importance DESC, created_at DESC LIMIT ${limit}`;
        } else if (category) {
          memories = await sql`SELECT * FROM memories WHERE category = ${category} ORDER BY importance DESC, created_at DESC LIMIT ${limit}`;
        } else {
          memories = await sql`SELECT * FROM memories ORDER BY importance DESC, created_at DESC LIMIT ${limit}`;
        }

        return json({ memories });
      }

      // ─── POST /task ────────────────────────────────────────────────────────
      if (path === "/task" && method === "POST") {
        const body = (await request.json()) as {
          title: string;
          description?: string;
          priority?: number;
          agent_name?: string;
          project_id?: number;
        };
        const { title, description, priority = 5, agent_name = "unknown", project_id } = body;

        const result = await sql`
          INSERT INTO agent_tasks (title, description, priority, agent_name, project_id, status)
          VALUES (${title}, ${description || null}, ${priority}, ${agent_name}, ${project_id || null}, 'pending')
          RETURNING id, created_at
        `;
        return json({ ok: true, id: (result[0] as Record<string, unknown>).id });
      }

      // ─── PUT /task/:id ─────────────────────────────────────────────────────
      if (path.startsWith("/task/") && method === "PUT") {
        const id = parseInt(path.split("/")[2]);
        const body = (await request.json()) as { status?: string; result?: string; issue_id?: number | null };
        const { status, result: taskResult, issue_id } = body;

        await sql`
          UPDATE agent_tasks
          SET status = COALESCE(${status || null}, status),
              result = COALESCE(${taskResult || null}, result),
              issue_id = CASE WHEN ${issue_id !== undefined} THEN ${issue_id ?? null} ELSE issue_id END,
              updated_at = NOW()
          WHERE id = ${id}
        `;
        return json({ ok: true });
      }

      // ─── GET /tasks ────────────────────────────────────────────────────────
      if (path === "/tasks" && method === "GET") {
        const agent = url.searchParams.get("agent");
        const status = url.searchParams.get("status");

        let tasks;
        if (agent && status) {
          tasks = await sql`SELECT * FROM agent_tasks WHERE agent_name = ${agent} AND status = ${status} ORDER BY priority DESC, created_at DESC`;
        } else if (agent) {
          tasks = await sql`SELECT * FROM agent_tasks WHERE agent_name = ${agent} ORDER BY priority DESC, created_at DESC`;
        } else if (status) {
          tasks = await sql`SELECT * FROM agent_tasks WHERE status = ${status} ORDER BY priority DESC, created_at DESC LIMIT 50`;
        } else {
          tasks = await sql`SELECT * FROM agent_tasks ORDER BY priority DESC, created_at DESC LIMIT 50`;
        }

        return json({ tasks });
      }

      // ─── POST /agent-state ─────────────────────────────────────────────────
      if (path === "/agent-state" && method === "POST") {
        const body = (await request.json()) as { agent_name: string; state: unknown };
        const { agent_name, state } = body;

        await sql`
          INSERT INTO agent_states (agent_name, state, updated_at)
          VALUES (${agent_name}, ${JSON.stringify(state)}, NOW())
          ON CONFLICT (agent_name) DO UPDATE SET state = ${JSON.stringify(state)}, updated_at = NOW()
        `;
        return json({ ok: true });
      }

      // ─── GET /agent-state/:name ────────────────────────────────────────────
      if (path.startsWith("/agent-state/") && method === "GET") {
        const name = path.split("/")[2];
        const result = await sql`SELECT * FROM agent_states WHERE agent_name = ${name}`;
        return json({ state: result[0] || null });
      }

      // ─── GET /agents ──────────────────────────────────────────────────────
      if (path === "/agents" && method === "GET") {
        const agents = await sql`SELECT * FROM agents ORDER BY last_seen DESC NULLS LAST`;
        return json({ agents });
      }

      // ─── GET /agent-states ────────────────────────────────────────────────
      if (path === "/agent-states" && method === "GET") {
        const states = await sql`SELECT * FROM agent_states ORDER BY updated_at DESC`;
        return json({ states });
      }

      // ─── POST /cron ────────────────────────────────────────────────────────
      if (path === "/cron" && method === "POST") {
        const body = (await request.json()) as {
          name: string;
          agent_name: string;
          schedule?: string;
          last_status?: string;
          last_error?: string;
        };
        const { name, agent_name, schedule = "@session", last_status = "ok", last_error } = body;

        await sql`
          INSERT INTO cron_jobs (name, agent_name, schedule, last_run, last_status, last_error)
          VALUES (${name}, ${agent_name}, ${schedule}, NOW(), ${last_status}, ${last_error || null})
          ON CONFLICT (name, agent_name) DO UPDATE
            SET last_run = NOW(),
                last_status = ${last_status},
                last_error = ${last_error || null},
                schedule = ${schedule}
        `;
        return json({ ok: true });
      }

      // ─── GET /crons ────────────────────────────────────────────────────────
      if (path === "/crons" && method === "GET") {
        const cron_jobs = await sql`SELECT * FROM cron_jobs ORDER BY last_run DESC NULLS LAST`;
        return json({ cron_jobs });
      }

      // ─── POST /subagent ────────────────────────────────────────────────────
      if (path === "/subagent" && method === "POST") {
        const body = (await request.json()) as {
          parent_agent: string;
          name: string;
          task?: string;
          status?: string;
        };
        const { parent_agent, name, task, status = "running" } = body;

        if (status !== "running") {
          await sql`
            INSERT INTO subagents (parent_agent, name, task, status, completed_at)
            VALUES (${parent_agent}, ${name}, ${task || null}, ${status}, NOW())
          `;
        } else {
          await sql`
            INSERT INTO subagents (parent_agent, name, task, status)
            VALUES (${parent_agent}, ${name}, ${task || null}, ${status})
          `;
        }
        return json({ ok: true });
      }

      // ─── GET /subagents ────────────────────────────────────────────────────
      if (path === "/subagents" && method === "GET") {
        const parent = url.searchParams.get("parent");
        const status = url.searchParams.get("status");

        let subagents;
        if (parent && status) {
          subagents = await sql`SELECT * FROM subagents WHERE parent_agent = ${parent} AND status = ${status} ORDER BY started_at DESC LIMIT 50`;
        } else if (parent) {
          subagents = await sql`SELECT * FROM subagents WHERE parent_agent = ${parent} ORDER BY started_at DESC LIMIT 20`;
        } else if (status) {
          subagents = await sql`SELECT * FROM subagents WHERE status = ${status} ORDER BY started_at DESC LIMIT 50`;
        } else {
          subagents = await sql`SELECT * FROM subagents ORDER BY started_at DESC LIMIT 50`;
        }
        return json({ subagents });
      }

      // ─── POST /project ─────────────────────────────────────────────────────
      if (path === "/project" && method === "POST") {
        const body = (await request.json()) as { name: string; description?: string; status?: string; parent_id?: number };
        const { name, description, status = "active", parent_id } = body;

        const result = await sql`
          INSERT INTO projects (name, description, status, parent_id)
          VALUES (${name}, ${description || null}, ${status}, ${parent_id || null})
          ON CONFLICT (name) DO UPDATE SET
            description = EXCLUDED.description,
            status = EXCLUDED.status,
            parent_id = COALESCE(EXCLUDED.parent_id, projects.parent_id),
            updated_at = NOW()
          RETURNING id
        `;
        return json({ ok: true, id: (result[0] as Record<string, unknown>).id });
      }

      // ─── GET /projects ─────────────────────────────────────────────────────
      if (path === "/projects" && method === "GET") {
        const projects = await sql`SELECT * FROM projects ORDER BY updated_at DESC`;
        return json({ projects });
      }

      // ─── GET /project/:id ──────────────────────────────────────────────────
      if (path.match(/^\/project\/\d+$/) && method === "GET") {
        const id = parseInt(path.split("/")[2]);
        const [projectRows, children, memories, sessions, tasks, allBacklog, artifactRows] = await Promise.all([
          sql`SELECT * FROM projects WHERE id = ${id}`,
          sql`SELECT * FROM projects WHERE parent_id = ${id} ORDER BY name`,
          sql`SELECT * FROM memories WHERE project_id = ${id} ORDER BY importance DESC, created_at DESC`,
          sql`SELECT id, agent_name, summary, created_at FROM sessions WHERE project_id = ${id} ORDER BY created_at DESC LIMIT 20`,
          sql`SELECT * FROM agent_tasks WHERE project_id = ${id} ORDER BY priority DESC, created_at DESC`,
          sql`SELECT * FROM backlog_items ORDER BY priority DESC, created_at DESC`,
          sql`SELECT id, name, description, r2_key, content_type, size_bytes, agent_name, created_at FROM artifacts WHERE project_id = ${id} ORDER BY created_at DESC`,
        ]);
        if (projectRows.length === 0) return error("Not found", 404);

        const project = projectRows[0] as Record<string, unknown>;
        const keywords = (project.name as string).toLowerCase().split(/[^a-z0-9]+/).filter((w: string) => w.length >= 3);
        const filteredBacklog = (allBacklog as Array<Record<string, unknown>>).filter(item =>
          item.project_id === id ||
          (item.tags as string[] || []).some((tag: string) => keywords.some(kw => tag.toLowerCase().includes(kw)))
        );

        // Build epic→issue→task hierarchy in JS
        const agentTasks = tasks as Array<Record<string, unknown>>;
        const epics = filteredBacklog.filter(item => item.type === 'epic');
        const allIssues = filteredBacklog.filter(item => item.type === 'issue');
        const epicIds = new Set(epics.map(e => e.id as number));

        const structuredEpics = epics.map(epic => {
          const issues = allIssues.filter(issue => issue.parent_id === epic.id).map(issue => ({
            ...issue,
            tasks: agentTasks.filter(t => t.issue_id === issue.id),
          }));
          return { ...epic, issues };
        });

        const unlinkedIssues = allIssues
          .filter(issue => issue.parent_id === null || !epicIds.has(issue.parent_id as number))
          .map(issue => ({ ...issue, tasks: agentTasks.filter(t => t.issue_id === issue.id) }));

        const backlog = {
          epics: structuredEpics,
          unlinked_issues: unlinkedIssues,
        };

        // Agents: from sessions + any agent whose name contains a project keyword
        const sessionAgentNames = [...new Set((sessions as Array<{ agent_name: string }>).map(s => s.agent_name))];
        const nameKeyword = `%${keywords[keywords.length - 1] || keywords[0] || ''}%`;
        let agents: unknown[] = [];
        let agentStates: unknown[] = [];
        let cronJobs: unknown[] = [];
        if (sessionAgentNames.length > 0) {
          [agents, agentStates, cronJobs] = await Promise.all([
            sql`SELECT * FROM agents WHERE name = ANY(${sessionAgentNames}) OR name ILIKE ${nameKeyword}`,
            sql`SELECT * FROM agent_states WHERE agent_name = ANY(${sessionAgentNames}) OR agent_name ILIKE ${nameKeyword}`,
            sql`SELECT * FROM cron_jobs WHERE agent_name = ANY(${sessionAgentNames}) OR agent_name ILIKE ${nameKeyword}`,
          ]);
        } else {
          [agents, agentStates, cronJobs] = await Promise.all([
            sql`SELECT * FROM agents WHERE name ILIKE ${nameKeyword}`,
            sql`SELECT * FROM agent_states WHERE agent_name ILIKE ${nameKeyword}`,
            sql`SELECT * FROM cron_jobs WHERE agent_name ILIKE ${nameKeyword}`,
          ]);
        }

        const artifacts = (artifactRows as Array<Record<string, unknown>>).map(a => ({
          ...a,
          url: `https://brain-worker.YOUR_SUBDOMAIN.workers.dev/drive/${a.r2_key}`,
        }));
        return json({ project, children, memories, sessions, tasks, backlog, agents, agentStates, cronJobs, artifacts });
      }

      // ─── PUT /project/:id ──────────────────────────────────────────────────
      if (path.match(/^\/project\/\d+$/) && method === "PUT") {
        const id = parseInt(path.split("/")[2]);
        const body = (await request.json()) as { parent_id?: number | null; description?: string; status?: string };
        await sql`
          UPDATE projects SET
            parent_id = COALESCE(${body.parent_id !== undefined ? body.parent_id : null}, parent_id),
            description = COALESCE(${body.description || null}, description),
            status = COALESCE(${body.status || null}, status),
            updated_at = NOW()
          WHERE id = ${id}
        `;
        return json({ ok: true });
      }

      // ─── POST /backlog ─────────────────────────────────────────────────────
      if (path === "/backlog" && method === "POST") {
        const body = (await request.json()) as { title: string; priority?: number; tags?: string[]; type?: string; parent_id?: number | null; project_id?: number | null };
        const { title, priority = 5, tags = [], type = 'issue', parent_id = null, project_id = null } = body;

        const result = await sql`
          INSERT INTO backlog_items (title, priority, tags, status, type, parent_id, project_id)
          VALUES (${title}, ${priority}, ${JSON.stringify(tags)}, 'active', ${type}, ${parent_id}, ${project_id})
          RETURNING id
        `;
        return json({ ok: true, id: (result[0] as Record<string, unknown>).id });
      }

      // ─── GET /projects/summary ────────────────────────────────────────────
      // Single endpoint for dashboard: projects enriched with counts + last session
      if (path === "/projects/summary" && method === "GET") {
        const [summaries, unlinkedRows, agents, agentStates, cronJobs, subagents] = await Promise.all([
          sql`
            SELECT
              p.id, p.name, p.description, p.status, p.parent_id, p.updated_at,
              COUNT(DISTINCT m.id)::int AS memory_count,
              COUNT(DISTINCT t.id) FILTER (WHERE t.status IN ('pending','in_progress'))::int AS task_count,
              (SELECT s.summary   FROM sessions s WHERE s.project_id = p.id ORDER BY s.created_at DESC LIMIT 1) AS last_session_summary,
              (SELECT s.agent_name FROM sessions s WHERE s.project_id = p.id ORDER BY s.created_at DESC LIMIT 1) AS last_session_agent,
              (SELECT s.created_at FROM sessions s WHERE s.project_id = p.id ORDER BY s.created_at DESC LIMIT 1) AS last_session_at
            FROM projects p
            LEFT JOIN memories m ON m.project_id = p.id
            LEFT JOIN agent_tasks t ON t.project_id = p.id
            WHERE p.status != 'archived'
            GROUP BY p.id
            ORDER BY p.updated_at DESC
          `,
          sql`
            SELECT
              (SELECT COUNT(*)::int FROM memories WHERE project_id IS NULL) AS memory_count,
              (SELECT COUNT(*)::int FROM agent_tasks WHERE project_id IS NULL AND status IN ('pending','in_progress')) AS task_count
          `,
          sql`SELECT * FROM agents ORDER BY last_seen DESC NULLS LAST`,
          sql`SELECT * FROM agent_states ORDER BY updated_at DESC`,
          sql`SELECT * FROM cron_jobs ORDER BY last_run DESC NULLS LAST`,
          sql`SELECT * FROM subagents WHERE status = 'running' ORDER BY started_at DESC LIMIT 20`,
        ]);

        return json({
          projects: summaries,
          unlinked: unlinkedRows[0] ?? { memory_count: 0, task_count: 0 },
          agents,
          agentStates,
          cronJobs,
          subagents,
        });
      }

      // ─── GET /backlog ──────────────────────────────────────────────────────
      if (path === "/backlog" && method === "GET") {
        const status = url.searchParams.get("status") || "active";
        const items = await sql`SELECT * FROM backlog_items WHERE status = ${status} ORDER BY priority DESC, created_at DESC`;
        return json({ items });
      }

      // ─── POST /artifact/upload-url ─────────────────────────────────────────
      // Returns a pre-signed URL for direct agent upload to R2
      if (path === "/artifact/upload-url" && method === "POST") {
        const body = (await request.json()) as { name: string; content_type?: string; project_id?: number; agent_name?: string; description?: string };
        const { name, content_type = "application/octet-stream", project_id, agent_name, description } = body;
        const r2Key = `${Date.now()}-${name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
        const uploadUrl = await env.BRAIN_DRIVE.createMultipartUpload(r2Key);
        // Store pending artifact metadata
        const result = await sql`
          INSERT INTO artifacts (name, description, r2_key, content_type, project_id, agent_name)
          VALUES (${name}, ${description || null}, ${r2Key}, ${content_type}, ${project_id || null}, ${agent_name || null})
          RETURNING id
        `;
        const artifactId = (result[0] as Record<string, unknown>).id;
        return json({ ok: true, artifact_id: artifactId, r2_key: r2Key, upload: uploadUrl });
      }

      // ─── PUT /artifact/:id/complete ────────────────────────────────────────
      // Called after upload finishes — updates size
      if (path.match(/^\/artifact\/\d+\/complete$/) && method === "PUT") {
        const id = parseInt(path.split("/")[2]);
        const body = (await request.json()) as { size_bytes?: number };
        await sql`UPDATE artifacts SET size_bytes = ${body.size_bytes || null}, updated_at = NOW() WHERE id = ${id}`;
        return json({ ok: true });
      }

      // ─── POST /artifact ────────────────────────────────────────────────────
      // Save artifact metadata when agent has already uploaded file to R2
      if (path === "/artifact" && method === "POST") {
        const body = (await request.json()) as { name: string; r2_key: string; content_type?: string; size_bytes?: number; project_id?: number; agent_name?: string; description?: string };
        const { name, r2_key, content_type = "application/octet-stream", size_bytes, project_id, agent_name, description } = body;
        const result = await sql`
          INSERT INTO artifacts (name, description, r2_key, content_type, size_bytes, project_id, agent_name)
          VALUES (${name}, ${description || null}, ${r2_key}, ${content_type}, ${size_bytes || null}, ${project_id || null}, ${agent_name || null})
          RETURNING id, created_at
        `;
        return json({ ok: true, id: (result[0] as Record<string, unknown>).id });
      }

      // ─── GET /artifacts ────────────────────────────────────────────────────
      if (path === "/artifacts" && method === "GET") {
        const project_id = url.searchParams.get("project_id");
        const limit = parseInt(url.searchParams.get("limit") || "50");
        const rows = project_id
          ? await sql`SELECT id, name, description, r2_key, content_type, size_bytes, project_id, agent_name, created_at FROM artifacts WHERE project_id = ${parseInt(project_id)} ORDER BY created_at DESC`
          : await sql`SELECT id, name, description, r2_key, content_type, size_bytes, project_id, agent_name, created_at FROM artifacts ORDER BY created_at DESC LIMIT ${limit}`;
        // Attach public URL to each artifact
        const artifacts = (rows as Array<Record<string, unknown>>).map(a => ({
          ...a,
          url: `https://brain-worker.YOUR_SUBDOMAIN.workers.dev/drive/${a.r2_key}`,
        }));
        return json({ artifacts });
      }

      // ─── PATCH /artifact/:id ──────────────────────────────────────────────
      if (path.match(/^\/artifact\/\d+$/) && method === "PATCH") {
        const id = parseInt(path.split("/")[2]);
        const body = (await request.json()) as { project_id?: number | null; description?: string; name?: string };
        await sql`
          UPDATE artifacts SET
            project_id = CASE WHEN ${body.project_id !== undefined} THEN ${body.project_id ?? null} ELSE project_id END,
            description = COALESCE(${body.description || null}, description),
            name = COALESCE(${body.name || null}, name),
            updated_at = NOW()
          WHERE id = ${id}
        `;
        return json({ ok: true });
      }

      // ─── DELETE /artifact/:id ──────────────────────────────────────────────
      if (path.match(/^\/artifact\/\d+$/) && method === "DELETE") {
        const id = parseInt(path.split("/")[2]);
        const rows = await sql`DELETE FROM artifacts WHERE id = ${id} RETURNING r2_key`;
        if (rows.length > 0) {
          const r2Key = (rows[0] as Record<string, unknown>).r2_key as string;
          await env.BRAIN_DRIVE.delete(r2Key);
        }
        return json({ ok: true });
      }

      // ─── PATCH /backlog/:id ────────────────────────────────────────────────
      if (path.match(/^\/backlog\/\d+$/) && method === "PATCH") {
        const id = parseInt(path.split("/")[2]);
        const body = (await request.json()) as { status?: string; priority?: number; type?: string; parent_id?: number | null; project_id?: number | null; title?: string };
        await sql`
          UPDATE backlog_items SET
            title = COALESCE(${body.title || null}, title),
            status = COALESCE(${body.status || null}, status),
            priority = COALESCE(${body.priority || null}, priority),
            type = COALESCE(${body.type || null}, type),
            parent_id = CASE WHEN ${body.parent_id !== undefined} THEN ${body.parent_id ?? null} ELSE parent_id END,
            project_id = CASE WHEN ${body.project_id !== undefined} THEN ${body.project_id ?? null} ELSE project_id END
          WHERE id = ${id}
        `;
        return json({ ok: true });
      }

      // ─── POST /session ─────────────────────────────────────────────────────
      if (path === "/session" && method === "POST") {
        const body = (await request.json()) as { agent_name: string; summary?: string; session_data?: unknown; project_id?: number };
        const { agent_name, summary, session_data, project_id } = body;

        const result = await sql`
          INSERT INTO sessions (agent_name, summary, session_data, project_id)
          VALUES (${agent_name}, ${summary || null}, ${JSON.stringify(session_data || {})}, ${project_id || null})
          RETURNING id, created_at
        `;
        return json({ ok: true, id: (result[0] as Record<string, unknown>).id });
      }

      // ─── GET /sessions ─────────────────────────────────────────────────────
      if (path === "/sessions" && method === "GET") {
        const agent = url.searchParams.get("agent");
        const days = parseInt(url.searchParams.get("days") || "0");
        const limit = parseInt(url.searchParams.get("limit") || "50");

        let sessions;
        if (days > 0 && agent) {
          sessions = await sql`SELECT s.id, s.agent_name, s.summary, s.project_id, s.created_at, p.name AS project_name FROM sessions s LEFT JOIN projects p ON p.id = s.project_id WHERE s.agent_name = ${agent} AND s.created_at >= NOW() - INTERVAL '1 day' * ${days} ORDER BY s.created_at DESC LIMIT ${limit}`;
        } else if (days > 0) {
          sessions = await sql`SELECT s.id, s.agent_name, s.summary, s.project_id, s.created_at, p.name AS project_name FROM sessions s LEFT JOIN projects p ON p.id = s.project_id WHERE s.created_at >= NOW() - INTERVAL '1 day' * ${days} ORDER BY s.created_at DESC LIMIT ${limit}`;
        } else if (agent) {
          sessions = await sql`SELECT s.id, s.agent_name, s.summary, s.project_id, s.created_at, p.name AS project_name FROM sessions s LEFT JOIN projects p ON p.id = s.project_id WHERE s.agent_name = ${agent} ORDER BY s.created_at DESC LIMIT ${limit}`;
        } else {
          sessions = await sql`SELECT s.id, s.agent_name, s.summary, s.project_id, s.created_at, p.name AS project_name FROM sessions s LEFT JOIN projects p ON p.id = s.project_id ORDER BY s.created_at DESC LIMIT ${limit}`;
        }

        return json({ sessions });
      }

      return error("Not found", 404);
    } catch (err) {
      console.error("Worker error:", err);
      return error(`Internal error: ${(err as Error).message}`, 500);
    }
  },
};
