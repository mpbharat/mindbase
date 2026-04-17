import { neon } from "@neondatabase/serverless";

export interface Env {
  DATABASE_URL: string;
  BRAIN_API_KEY: string;
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
        const { content, category = "general", importance = 5, agent_name = "unknown", project_id, embedding } = body;

        const result = await sql`
          INSERT INTO memories (content, category, importance, agent_name, project_id, embedding)
          VALUES (${content}, ${category}, ${importance}, ${agent_name}, ${project_id || null}, ${embedding ? JSON.stringify(embedding) : null})
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
        const body = (await request.json()) as { status?: string; result?: string };
        const { status, result: taskResult } = body;

        await sql`
          UPDATE agent_tasks
          SET status = COALESCE(${status || null}, status),
              result = COALESCE(${taskResult || null}, result),
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
        const [projectRows, children, memories, sessions, tasks] = await Promise.all([
          sql`SELECT * FROM projects WHERE id = ${id}`,
          sql`SELECT * FROM projects WHERE parent_id = ${id} ORDER BY name`,
          sql`SELECT * FROM memories WHERE project_id = ${id} ORDER BY importance DESC, created_at DESC`,
          sql`SELECT id, agent_name, summary, created_at FROM sessions WHERE project_id = ${id} ORDER BY created_at DESC LIMIT 20`,
          sql`SELECT * FROM agent_tasks WHERE project_id = ${id} ORDER BY priority DESC, created_at DESC`,
        ]);
        if (projectRows.length === 0) return error("Not found", 404);
        return json({ project: projectRows[0], children, memories, sessions, tasks });
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
        const body = (await request.json()) as { title: string; priority?: number; tags?: string[] };
        const { title, priority = 5, tags = [] } = body;

        const result = await sql`
          INSERT INTO backlog_items (title, priority, tags, status)
          VALUES (${title}, ${priority}, ${JSON.stringify(tags)}, 'active')
          RETURNING id
        `;
        return json({ ok: true, id: (result[0] as Record<string, unknown>).id });
      }

      // ─── POST /session ─────────────────────────────────────────────────────
      if (path === "/session" && method === "POST") {
        const body = (await request.json()) as { agent_name: string; summary?: string; session_data?: unknown };
        const { agent_name, summary, session_data } = body;

        const result = await sql`
          INSERT INTO sessions (agent_name, summary, session_data)
          VALUES (${agent_name}, ${summary || null}, ${JSON.stringify(session_data || {})})
          RETURNING id, created_at
        `;
        return json({ ok: true, id: (result[0] as Record<string, unknown>).id });
      }

      // ─── GET /sessions ─────────────────────────────────────────────────────
      if (path === "/sessions" && method === "GET") {
        const agent = url.searchParams.get("agent");
        const limit = parseInt(url.searchParams.get("limit") || "10");

        const sessions = agent
          ? await sql`SELECT id, agent_name, summary, created_at FROM sessions WHERE agent_name = ${agent} ORDER BY created_at DESC LIMIT ${limit}`
          : await sql`SELECT id, agent_name, summary, created_at FROM sessions ORDER BY created_at DESC LIMIT ${limit}`;

        return json({ sessions });
      }

      return error("Not found", 404);
    } catch (err) {
      console.error("Worker error:", err);
      return error(`Internal error: ${(err as Error).message}`, 500);
    }
  },
};
