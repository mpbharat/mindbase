import { useEffect, useState } from 'react';
import { fetchProjectDetail, createBacklogItem, updateBacklogItem, updateTask } from '../api';
import type { ProjectDetail as PD, BacklogEpic, BacklogIssue, Artifact } from '../types';

function relativeTime(ts: string) {
  const diff = Date.now() - new Date(ts).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 2) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function formatBytes(n: number | null) {
  if (!n) return '';
  if (n < 1024) return `${n}B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)}KB`;
  return `${(n / 1024 / 1024).toFixed(1)}MB`;
}

const categoryColor: Record<string, string> = {
  decision: '#60a5fa', fact: '#f59e0b', project: '#34d399',
  person: '#a78bfa', general: '#71717a',
};

// ─── Backlog Tab ──────────────────────────────────────────────────────────────

type InlineForm = { type: 'epic' } | { type: 'issue'; epicId: number } | { type: 'edit-issue'; issue: BacklogIssue; epicId: number | null };

function pColor(p: number) {
  if (p >= 9) return '#f59e0b';
  if (p >= 7) return '#71717a';
  return '#3f3f46';
}

function StatusChip({ status, onToggle }: { status: string; onToggle: () => void }) {
  const done = status === 'done';
  return (
    <button
      onClick={e => { e.stopPropagation(); onToggle(); }}
      className={done ? 'pill pill-green' : 'pill'}
      style={{ cursor: 'pointer', border: 'none', flexShrink: 0 }}
    >
      {done ? 'done' : 'active'}
    </button>
  );
}

function BacklogTab({ projectId, backlog, reload }: { projectId: number; backlog: PD['backlog']; reload: () => void }) {
  const [form, setForm] = useState<InlineForm | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formPriority, setFormPriority] = useState(7);
  const [formEpicId, setFormEpicId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  const total = backlog.epics.length + backlog.unlinked_issues.length;

  function openForm(f: InlineForm) {
    setForm(f);
    if (f.type === 'edit-issue') { setFormTitle(f.issue.title); setFormPriority(f.issue.priority); setFormEpicId(f.epicId); }
    else { setFormTitle(''); setFormPriority(7); setFormEpicId(f.type === 'issue' ? f.epicId : null); }
  }

  async function handleSave() {
    if (!formTitle.trim() || !form) return;
    setSaving(true);
    try {
      if (form.type === 'epic') await createBacklogItem({ title: formTitle.trim(), priority: formPriority, type: 'epic', project_id: projectId });
      else if (form.type === 'issue') await createBacklogItem({ title: formTitle.trim(), priority: formPriority, type: 'issue', parent_id: form.epicId, project_id: projectId });
      else if (form.type === 'edit-issue') await updateBacklogItem(form.issue.id, { title: formTitle.trim(), priority: formPriority, parent_id: formEpicId });
      setForm(null); reload();
    } catch (e) { alert(String(e)); }
    finally { setSaving(false); }
  }

  async function toggleStatus(id: number, current: string) {
    await updateBacklogItem(id, { status: current === 'done' ? 'active' : 'done' });
    reload();
  }

  function InlineFormRow({ label }: { label: string }) {
    return (
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '10px 14px', margin: '6px 0', background: 'var(--card)', border: '1px solid var(--border-hover)', borderRadius: 10 }}>
        <span style={{ fontSize: 11, color: 'var(--muted)', flexShrink: 0, width: 32 }}>{label}</span>
        <input
          autoFocus
          value={formTitle}
          onChange={e => setFormTitle(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setForm(null); }}
          placeholder="Title…"
          className="minput"
          style={{ flex: 1, border: 'none', background: 'transparent', padding: 0 }}
        />
        <input
          type="number"
          value={formPriority}
          onChange={e => setFormPriority(Number(e.target.value))}
          min={1}
          max={10}
          className="minput"
          style={{ width: 48, textAlign: 'center', padding: '4px 6px' }}
        />
        {form?.type === 'edit-issue' && (
          <select
            value={formEpicId ?? ''}
            onChange={e => setFormEpicId(e.target.value === '' ? null : Number(e.target.value))}
            className="minput"
            style={{ padding: '4px 8px', fontSize: 12 }}
          >
            <option value="">No epic</option>
            {backlog.epics.map(ep => <option key={ep.id} value={ep.id}>{ep.title.slice(0, 24)}</option>)}
          </select>
        )}
        <button
          onClick={handleSave}
          disabled={saving}
          style={{ fontSize: 12, padding: '4px 12px', background: 'var(--blue)', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}
        >
          Save
        </button>
        <button
          onClick={() => setForm(null)}
          style={{ fontSize: 12, padding: '4px 8px', background: 'transparent', color: 'var(--muted)', border: 'none', cursor: 'pointer' }}
        >
          ✕
        </button>
      </div>
    );
  }

  function ItemRow({ id, title, priority, status, isEpic, epicId, tasks, indent }: {
    id: number; title: string; priority: number; status: string;
    isEpic?: boolean; epicId?: number | null; tasks?: PD['tasks']; indent?: boolean;
  }) {
    const done = status === 'done';
    const isOpen = expanded.has(id);
    const hasTasks = (tasks?.length ?? 0) > 0;
    const issueCount = isEpic ? (backlog.epics.find(e => e.id === id)?.issues.length ?? 0) : 0;

    return (
      <div>
        <div
          onClick={() => hasTasks && setExpanded(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; })}
          className={isEpic ? `epic-row${done ? ' done' : ''}` : 'mrow'}
          style={{
            marginLeft: indent ? 24 : 0,
            cursor: hasTasks ? 'pointer' : 'default',
            opacity: !isEpic && done ? 0.4 : 1,
          }}
        >
          {/* Priority dot */}
          <div style={{ paddingTop: 3, flexShrink: 0 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: pColor(priority) }} />
          </div>

          {/* Title block */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: isEpic ? 14 : 13,
              fontWeight: isEpic ? 500 : 400,
              color: done ? 'var(--dim)' : isEpic ? 'var(--text)' : 'var(--muted)',
              textDecoration: done ? 'line-through' : 'none',
              lineHeight: 1.4,
            }}>
              {title}
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 4, alignItems: 'center' }}>
              <span style={{ fontSize: 11, fontFamily: 'monospace', color: pColor(priority) }}>P{priority}</span>
              {hasTasks && <span style={{ fontSize: 11, color: 'var(--dim)' }}>{tasks!.length} tasks</span>}
              {isEpic && issueCount > 0 && <span style={{ fontSize: 11, color: 'var(--dim)' }}>{issueCount} issues</span>}
            </div>
          </div>

          {/* Status + actions */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
            <StatusChip status={status} onToggle={() => toggleStatus(id, status)} />
            {isEpic && (
              <button
                onClick={e => { e.stopPropagation(); openForm({ type: 'issue', epicId: id }); }}
                style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, border: '1px solid var(--border-hover)', color: 'var(--muted)', background: 'transparent', cursor: 'pointer' }}
              >
                + Issue
              </button>
            )}
            {!isEpic && (
              <button
                onClick={e => {
                  e.stopPropagation();
                  const issue = [...backlog.unlinked_issues, ...backlog.epics.flatMap(e => e.issues)].find(i => i.id === id);
                  if (issue) openForm({ type: 'edit-issue', issue, epicId: epicId ?? null });
                }}
                style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, border: '1px solid var(--border)', color: 'var(--dim)', background: 'transparent', cursor: 'pointer' }}
              >
                edit
              </button>
            )}
          </div>
        </div>

        {/* Subtasks */}
        {isOpen && tasks?.map(t => {
          const c = t.status === 'completed' || t.status === 'done' ? '#4ade80' : t.status === 'in-progress' ? '#60a5fa' : '#f59e0b';
          return (
            <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 16px', opacity: 0.5, marginLeft: indent ? 24 : 0 }}>
              <span style={{ width: 32, flexShrink: 0 }} />
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: c, flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: 'var(--muted)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</span>
              <span style={{ fontSize: 12, fontFamily: 'monospace', color: c }}>{t.status}</span>
            </div>
          );
        })}

        {/* Inline form for new issue under this epic */}
        {isEpic && form?.type === 'issue' && form.epicId === id && (
          <div style={{ marginLeft: 24, marginTop: 4 }}><InlineFormRow label="Issue" /></div>
        )}
        {!isEpic && form?.type === 'edit-issue' && form.issue.id === id && (
          <InlineFormRow label="Edit" />
        )}
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <span style={{ fontSize: 13, color: 'var(--muted)' }}>{total} items</span>
        <button
          onClick={() => openForm({ type: 'epic' })}
          style={{ fontSize: 12, padding: '5px 12px', borderRadius: 8, border: '1px solid var(--border-hover)', color: 'var(--muted)', background: 'transparent', cursor: 'pointer' }}
        >
          + Epic
        </button>
      </div>

      {total === 0 && !form && (
        <p style={{ fontSize: 13, color: 'var(--dim)', fontStyle: 'italic', textAlign: 'center', padding: '32px 0' }}>No backlog items yet</p>
      )}
      {form?.type === 'epic' && <InlineFormRow label="Epic" />}

      {/* Epics */}
      {backlog.epics.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
          {backlog.epics.map(epic => (
            <div key={epic.id} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <ItemRow id={epic.id} title={epic.title} priority={epic.priority} status={epic.status} isEpic />
              {epic.issues.map(issue => (
                <ItemRow key={issue.id} id={issue.id} title={issue.title} priority={issue.priority}
                  status={issue.status} epicId={epic.id} tasks={issue.tasks} indent />
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Unlinked issues */}
      {backlog.unlinked_issues.length > 0 && (
        <div>
          {backlog.epics.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
              <span style={{ fontSize: 11, color: 'var(--dim)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', flexShrink: 0 }}>Unlinked</span>
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {backlog.unlinked_issues.map(issue => (
              <ItemRow key={issue.id} id={issue.id} title={issue.title} priority={issue.priority}
                status={issue.status} epicId={null} tasks={issue.tasks} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Memories Tab ────────────────────────────────────────────────────────────

function MemoriesTab({ data }: { data: PD }) {
  const [search, setSearch] = useState('');
  const q = search.toLowerCase();
  const memories = data.memories.filter(m => !q || m.content.toLowerCase().includes(q));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Filter memories…"
        className="minput"
        style={{ width: '100%', boxSizing: 'border-box' }}
      />
      {memories.length === 0 && <p style={{ fontSize: 13, color: 'var(--dim)', fontStyle: 'italic', textAlign: 'center', padding: '32px 0' }}>No memories yet</p>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {memories.map(m => {
          const col = categoryColor[m.category] ?? '#71717a';
          return (
            <div key={m.id} className="mcard" style={{ padding: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, fontWeight: 500, background: `${col}18`, color: col }}>{m.category}</span>
                <span style={{ fontSize: 11, color: 'var(--dim)', marginLeft: 'auto' }}>imp {m.importance} · {relativeTime(m.created_at)}</span>
              </div>
              <p style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.5, margin: 0 }}>{m.content}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Drive Tab ────────────────────────────────────────────────────────────────

function ArtifactRow({ a }: { a: Artifact }) {
  return (
    <div className="mcard" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px' }}>
      <span style={{ fontSize: 16, flexShrink: 0 }}>
        {a.content_type.startsWith('image/') ? '🖼' : a.content_type === 'application/pdf' ? '📄' : a.content_type === 'text/markdown' ? '📝' : '📎'}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <a href={a.url} target="_blank" rel="noreferrer" style={{ fontSize: 13, color: 'var(--blue)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.name}</a>
        {a.description && <p style={{ fontSize: 12, color: 'var(--dim)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.description}</p>}
      </div>
      {a.agent_name && <span style={{ fontSize: 11, color: 'var(--dim)', flexShrink: 0 }}>{a.agent_name.split(':')[0]}</span>}
      <span style={{ fontSize: 11, color: 'var(--dim)', flexShrink: 0, fontFamily: 'monospace' }}>{formatBytes(a.size_bytes)}</span>
      <span style={{ fontSize: 11, color: 'var(--dim)', flexShrink: 0 }}>{relativeTime(a.created_at)}</span>
    </div>
  );
}

function isDrive(a: Artifact) {
  if (a.is_generated === true) return false;
  if (a.is_generated === false) return true;
  return !a.agent_name; // fallback: unclassified — use agent_name heuristic
}

function DriveTab({ data }: { data: PD }) {
  const [search, setSearch] = useState('');
  const q = search.toLowerCase();
  const files = (data.artifacts ?? []).filter(a => isDrive(a) && (!q || a.name.toLowerCase().includes(q) || (a.description ?? '').toLowerCase().includes(q)));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Filter files…"
        className="minput"
        style={{ width: '100%', boxSizing: 'border-box' }}
      />
      {files.length === 0 && <p style={{ fontSize: 13, color: 'var(--dim)', fontStyle: 'italic', textAlign: 'center', padding: '32px 0' }}>No uploaded files</p>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {files.map(a => <ArtifactRow key={a.id} a={a} />)}
      </div>
    </div>
  );
}

// ─── Artifacts Tab ────────────────────────────────────────────────────────────

function ArtifactsTab({ data }: { data: PD }) {
  const [search, setSearch] = useState('');
  const q = search.toLowerCase();
  const artifacts = (data.artifacts ?? []).filter(a => !isDrive(a) && (!q || a.name.toLowerCase().includes(q) || (a.description ?? '').toLowerCase().includes(q)));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Filter artifacts…"
        className="minput"
        style={{ width: '100%', boxSizing: 'border-box' }}
      />
      {artifacts.length === 0 && <p style={{ fontSize: 13, color: 'var(--dim)', fontStyle: 'italic', textAlign: 'center', padding: '32px 0' }}>No AI-generated artifacts yet</p>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {artifacts.map(a => <ArtifactRow key={a.id} a={a} />)}
      </div>
    </div>
  );
}

// ─── Activity Tab ─────────────────────────────────────────────────────────────

function ActivityTab({ data }: { data: PD }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
      {/* Sessions */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Sessions</div>
        {data.sessions.length === 0 && <p style={{ fontSize: 13, color: 'var(--dim)', fontStyle: 'italic' }}>No sessions</p>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {data.sessions.map(s => (
            <div key={s.id} className="mcard" style={{ padding: '10px 14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--blue)' }}>{s.agent_name.split(':')[0]}</span>
                <span style={{ fontSize: 11, color: 'var(--dim)', marginLeft: 'auto' }}>{relativeTime(s.created_at)}</span>
              </div>
              {s.summary && <p style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.5, margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{s.summary}</p>}
            </div>
          ))}
        </div>
      </div>

      {/* Agents + Cron */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {data.agents.length > 0 && (
          <div>
            <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Agents</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {data.agents.map(agent => {
                const state = data.agentStates.find(s => s.agent_name === agent.name);
                const status = state?.state?.status ?? 'idle';
                const col = status === 'working' ? 'var(--blue)' : 'var(--dim)';
                return (
                  <div key={agent.name} className="mcard" style={{ padding: '10px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: col, flexShrink: 0 }} />
                      <span style={{ fontSize: 13, color: 'var(--text)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{agent.name}</span>
                      <span style={{ fontSize: 11, color: 'var(--dim)' }}>{agent.last_seen ? relativeTime(agent.last_seen) : '—'}</span>
                    </div>
                    {state?.state?.current_task && (
                      <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4, marginBottom: 0, paddingLeft: 16, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{state.state.current_task}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {data.cronJobs.length > 0 && (
          <div>
            <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Cron Jobs</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {data.cronJobs.map(job => {
                const col = job.last_status === 'ok' ? '#4ade80' : '#ef4444';
                return (
                  <div key={job.id} className="mcard" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px' }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: col, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{job.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--dim)' }}>{job.agent_name} · {job.last_run ? relativeTime(job.last_run) : 'never'}</div>
                    </div>
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, fontWeight: 500, background: `${col}18`, color: col }}>{job.last_status}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Tasks Tab ────────────────────────────────────────────────────────────────

function TasksTab({ data, onReload }: { data: PD; onReload: () => void }) {
  const [toggling, setToggling] = useState<number | null>(null);
  const pending = data.tasks.filter(t => t.status === 'pending' || t.status === 'in-progress' || t.status === 'in_progress');
  const done = data.tasks.filter(t => t.status === 'completed' || t.status === 'done');

  async function toggleTask(id: number, current: string) {
    setToggling(id);
    const next = (current === 'done' || current === 'completed') ? 'pending' : 'done';
    try {
      await updateTask(id, { status: next });
      onReload();
    } finally {
      setToggling(null);
    }
  }

  function TaskRow({ t }: { t: PD['tasks'][0] }) {
    const isDone = t.status === 'completed' || t.status === 'done';
    const col = isDone ? '#4ade80' : t.status === 'in-progress' || t.status === 'in_progress' ? '#60a5fa' : '#f59e0b';
    const isToggling = toggling === t.id;
    return (
      <div className="mcard" style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 14px', opacity: isDone ? 0.5 : 1 }}>
        <button
          onClick={() => toggleTask(t.id, t.status)}
          disabled={isToggling}
          style={{
            width: 16, height: 16, borderRadius: 4, border: `1.5px solid ${isDone ? '#4ade80' : 'var(--border)'}`,
            background: isDone ? '#4ade8022' : 'transparent', cursor: 'pointer', flexShrink: 0, marginTop: 2,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
          }}
          title={isDone ? 'Mark pending' : 'Mark done'}
        >
          {isDone && <span style={{ fontSize: 10, color: '#4ade80', lineHeight: 1 }}>✓</span>}
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, color: 'var(--text)', textDecoration: isDone ? 'line-through' : 'none' }}>{t.title}</div>
          <div style={{ fontSize: 11, color: 'var(--dim)', marginTop: 2 }}>
            {t.agent_name && <span style={{ color: 'var(--blue)' }}>{t.agent_name.split(':')[0]}</span>}
            {t.agent_name && ' · '}p{t.priority} · {relativeTime(t.created_at)}
          </div>
        </div>
        <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, fontWeight: 500, background: `${col}18`, color: col, flexShrink: 0 }}>{t.status}</span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {pending.length > 0 && (
        <div>
          <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Active — {pending.length}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{pending.map(t => <TaskRow key={t.id} t={t} />)}</div>
        </div>
      )}
      {done.length > 0 && (
        <div>
          <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Completed — {done.length}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{done.map(t => <TaskRow key={t.id} t={t} />)}</div>
        </div>
      )}
      {data.tasks.length === 0 && (
        <p style={{ fontSize: 13, color: 'var(--dim)', fontStyle: 'italic', textAlign: 'center', padding: '16px 0' }}>No tasks yet</p>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const TABS = ['Backlog', 'Tasks', 'Memories', 'Drive', 'Artifacts', 'Activity'] as const;
type Tab = typeof TABS[number];

export function ProjectDetail({ projectId, onSelect }: { projectId: number; onSelect: (id: number) => void }) {
  const [data, setData] = useState<PD | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('Backlog');

  function reload() { fetchProjectDetail(projectId).then(setData).catch(() => {}); }

  useEffect(() => {
    setLoading(true); setError(null); setData(null);
    fetchProjectDetail(projectId)
      .then(setData).catch(e => setError(String(e))).finally(() => setLoading(false));
  }, [projectId]);

  if (loading) return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontSize: 13, color: 'var(--dim)' }}>Loading…</div>
    </div>
  );

  if (error) return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontSize: 13, color: '#f87171' }}>{error}</div>
    </div>
  );

  if (!data) return null;

  const backlogCount = data.backlog.epics.length + data.backlog.unlinked_issues.length;
  const driveCount = (data.artifacts ?? []).filter(a => isDrive(a)).length;
  const artifactsCount = (data.artifacts ?? []).filter(a => !isDrive(a)).length;

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      {/* Header */}
      <div style={{ padding: '20px 24px 0', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 16 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <h1 className="gradient-text" style={{ fontSize: 20, fontWeight: 600, margin: 0 }}>{data.project.name}</h1>
              <span className={data.project.status === 'active' ? 'pill pill-green' : 'pill'}>
                {data.project.status}
              </span>
            </div>
            {data.project.description && (
              <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.5, margin: 0 }}>{data.project.description}</p>
            )}
          </div>
          <div style={{ fontSize: 11, color: 'var(--dim)', flexShrink: 0, paddingTop: 4 }}>{relativeTime(data.project.updated_at)}</div>
        </div>

        {/* Sub-project pills */}
        {data.children.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
            {data.children.map(child => (
              <button
                key={child.id}
                onClick={() => onSelect(child.id)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 99, background: 'var(--card)', border: '1px solid var(--border-hover)', cursor: 'pointer', fontSize: 12, color: 'var(--text)' }}
              >
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: child.status === 'active' ? 'var(--green)' : 'var(--dim)', flexShrink: 0 }} />
                {child.name}
              </button>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4 }}>
          {TABS.map(t => {
            const count = t === 'Backlog' ? backlogCount : t === 'Tasks' ? data.tasks.length : t === 'Memories' ? data.memories.length : t === 'Drive' ? driveCount : t === 'Artifacts' ? artifactsCount : data.sessions.length;
            const isActive = tab === t;
            return (
              <button key={t} onClick={() => setTab(t)} className={`tab-btn${isActive ? ' active' : ''}`}>
                {t}
                {count > 0 && (
                  <span style={{
                    fontSize: 11,
                    padding: '1px 6px',
                    borderRadius: 4,
                    fontFamily: 'monospace',
                    background: isActive ? 'rgba(59,130,246,0.15)' : 'var(--card)',
                    color: isActive ? 'var(--blue)' : 'var(--dim)',
                    marginLeft: 4,
                  }}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
        {tab === 'Backlog' && <BacklogTab projectId={data.project.id} backlog={data.backlog} reload={reload} />}
        {tab === 'Tasks' && <TasksTab data={data} onReload={reload} />}
        {tab === 'Memories' && <MemoriesTab data={data} />}
        {tab === 'Drive' && <DriveTab data={data} />}
        {tab === 'Artifacts' && <ArtifactsTab data={data} />}
        {tab === 'Activity' && <ActivityTab data={data} />}
      </div>
    </div>
  );
}
