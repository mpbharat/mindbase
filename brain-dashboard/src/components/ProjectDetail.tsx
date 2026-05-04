import { useEffect, useState } from 'react';
import { fetchProjectDetail, createBacklogItem, updateBacklogItem } from '../api';
import type { ProjectDetail as PD, BacklogEpic, BacklogIssue, Artifact } from '../types';
import { s, statusColor, relativeTime } from '../styles';

const c = s.colors;

const categoryColor: Record<string, string> = {
  person: '#a78bfa',
  decision: '#60a5fa',
  project: '#34d399',
  fact: '#fbbf24',
  general: '#9ca3af',
};

const taskStatusColor: Record<string, string> = {
  completed: '#34d399',
  done: '#34d399',
  'in-progress': '#60a5fa',
  active: '#60a5fa',
  pending: '#fbbf24',
  blocked: '#f87171',
};

function Widget({ title, count, children, headerExtra }: { title: string; count?: number; children: React.ReactNode; headerExtra?: React.ReactNode }) {
  return (
    <div style={{
      background: c.surface,
      border: `1px solid ${c.border}`,
      borderRadius: 10,
      padding: '16px',
      display: 'flex',
      flexDirection: 'column',
      minHeight: 200,
      maxHeight: 480,
      overflow: 'hidden',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
        <span style={{ fontSize: 11, color: c.muted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
          {title}
        </span>
        {count !== undefined && (
          <span style={{ fontSize: 10, color: c.muted, background: c.border, borderRadius: 10, padding: '1px 6px' }}>
            {count}
          </span>
        )}
        {headerExtra && <div style={{ marginLeft: 'auto' }}>{headerExtra}</div>}
      </div>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {children}
      </div>
    </div>
  );
}

type InlineForm = { type: 'epic' } | { type: 'issue'; epicId: number } | { type: 'edit-issue'; issue: BacklogIssue; epicId: number | null };

function priorityBadge(p: number) {
  const col = p >= 9 ? '#f87171' : p >= 7 ? '#fbbf24' : p >= 5 ? '#60a5fa' : '#6b7280';
  return <span style={{ fontSize: 10, fontWeight: 700, color: col, flexShrink: 0 }}>P{p}</span>;
}

function StatusToggle({ status, onToggle }: { status: string; onToggle: () => void }) {
  const isDone = status === 'done';
  const col = isDone ? '#34d399' : '#60a5fa';
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onToggle(); }}
      title="Toggle status"
      style={{
        fontSize: 10, padding: '2px 6px', borderRadius: 4, flexShrink: 0, cursor: 'pointer',
        background: `${col}22`, color: col, border: 'none', fontWeight: 600,
      }}
    >
      {status}
    </button>
  );
}

function BacklogWidget({ projectId, backlog, reload }: {
  projectId: number;
  backlog: PD['backlog'];
  reload: () => void;
}) {
  const [form, setForm] = useState<InlineForm | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formPriority, setFormPriority] = useState(7);
  const [expandedIssues, setExpandedIssues] = useState<Set<number>>(new Set());
  const [formEpicId, setFormEpicId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const totalCount = backlog.epics.length + backlog.unlinked_issues.length;

  function openForm(f: InlineForm) {
    setForm(f);
    if (f.type === 'edit-issue') {
      setFormTitle(f.issue.title);
      setFormPriority(f.issue.priority);
      setFormEpicId(f.epicId);
    } else {
      setFormTitle('');
      setFormPriority(7);
      setFormEpicId(f.type === 'issue' ? f.epicId : null);
    }
  }

  function cancelForm() { setForm(null); }

  async function handleSave() {
    if (!formTitle.trim()) return;
    setSaving(true);
    try {
      if (!form) return;
      if (form.type === 'epic') {
        await createBacklogItem({ title: formTitle.trim(), priority: formPriority, type: 'epic', project_id: projectId });
      } else if (form.type === 'issue') {
        await createBacklogItem({ title: formTitle.trim(), priority: formPriority, type: 'issue', parent_id: form.epicId, project_id: projectId });
      } else if (form.type === 'edit-issue') {
        await updateBacklogItem(form.issue.id, { title: formTitle.trim(), priority: formPriority, parent_id: formEpicId });
      }
      setForm(null);
      reload();
    } catch (e) {
      alert(String(e));
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(id: number, current: string) {
    const next = current === 'done' ? 'active' : 'done';
    await updateBacklogItem(id, { status: next });
    reload();
  }

  const inputStyle = {
    background: '#111', border: `1px solid ${c.border}`, color: c.text,
    borderRadius: 5, padding: '4px 8px', fontSize: 12, outline: 'none',
  } as React.CSSProperties;

  const btnStyle = (primary: boolean) => ({
    background: primary ? '#4a9eff22' : 'transparent',
    border: `1px solid ${primary ? '#4a9eff' : c.border}`,
    color: primary ? '#4a9eff' : c.muted,
    borderRadius: 5, padding: '3px 10px', fontSize: 11, cursor: 'pointer',
  } as React.CSSProperties);

  function InlineFormRow({ label }: { label: string }) {
    return (
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', padding: '6px 8px', background: '#ffffff08', borderRadius: 6, marginTop: 4, marginBottom: 4 }}>
        <span style={{ fontSize: 10, color: c.muted, flexShrink: 0 }}>{label}</span>
        <input
          autoFocus
          value={formTitle}
          onChange={e => setFormTitle(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') cancelForm(); }}
          placeholder="Title…"
          style={{ ...inputStyle, flex: 1 }}
        />
        <input
          type="number"
          value={formPriority}
          onChange={e => setFormPriority(Number(e.target.value))}
          min={1} max={10}
          style={{ ...inputStyle, width: 44, textAlign: 'center' }}
        />
        {form?.type === 'edit-issue' && (
          <select
            value={formEpicId ?? ''}
            onChange={e => setFormEpicId(e.target.value === '' ? null : Number(e.target.value))}
            style={{ ...inputStyle, maxWidth: 120 }}
          >
            <option value="">No epic</option>
            {backlog.epics.map(ep => (
              <option key={ep.id} value={ep.id}>{ep.title}</option>
            ))}
          </select>
        )}
        <button onClick={handleSave} disabled={saving} style={btnStyle(true)}>Save</button>
        <button onClick={cancelForm} style={btnStyle(false)}>Cancel</button>
      </div>
    );
  }

  function EpicRow({ epic }: { epic: BacklogEpic }) {
    const isDone = epic.status === 'done';
    return (
      <div style={{ marginBottom: 8 }}>
        {/* Epic header */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '6px 8px', borderRadius: 6,
          background: isDone ? 'rgba(52,211,153,0.04)' : 'rgba(255,255,255,0.04)',
          border: `1px solid ${isDone ? '#34d39920' : c.border}`,
          opacity: isDone ? 0.6 : 1,
        }}>
          <span style={{ fontSize: 12, flexShrink: 0 }}>📋</span>
          {priorityBadge(epic.priority)}
          <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: c.text, textDecoration: isDone ? 'line-through' : 'none' }}>
            {epic.title}
          </span>
          <StatusToggle status={epic.status} onToggle={() => toggleStatus(epic.id, epic.status)} />
          <button
            onClick={() => openForm({ type: 'issue', epicId: epic.id })}
            style={{ ...btnStyle(false), fontSize: 10, padding: '2px 7px' }}
          >
            + Issue
          </button>
        </div>

        {/* Issues under epic */}
        {epic.issues.map(issue => (
          <IssueRow key={issue.id} issue={issue} epicId={epic.id} indent={1} />
        ))}

        {/* Inline form for new issue under this epic */}
        {form?.type === 'issue' && form.epicId === epic.id && (
          <div style={{ marginLeft: 16 }}>
            <InlineFormRow label="Issue" />
          </div>
        )}
      </div>
    );
  }

  function IssueRow({ issue, epicId, indent }: { issue: BacklogIssue; epicId: number | null; indent: number }) {
    const isDone = issue.status === 'done';
    const isExpanded = expandedIssues.has(issue.id);
    const hasTasks = issue.tasks.length > 0;
    const toggleExpand = () => {
      if (!hasTasks) return;
      setExpandedIssues(prev => {
        const next = new Set(prev);
        next.has(issue.id) ? next.delete(issue.id) : next.add(issue.id);
        return next;
      });
    };
    return (
      <div style={{ marginLeft: indent * 16, marginTop: 3 }}>
        <div
          onClick={toggleExpand}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '5px 8px', borderRadius: 5,
            background: isDone ? 'rgba(52,211,153,0.03)' : 'rgba(255,255,255,0.02)',
            border: `1px solid ${isDone ? '#34d39918' : '#ffffff0a'}`,
            opacity: isDone ? 0.55 : 1,
            cursor: hasTasks ? 'pointer' : 'default',
          }}>
          <span style={{ fontSize: 10, color: c.muted, flexShrink: 0 }}>└─</span>
          {priorityBadge(issue.priority)}
          <span style={{ flex: 1, fontSize: 12, color: c.text, textDecoration: isDone ? 'line-through' : 'none' }}>
            {issue.title}
          </span>
          {hasTasks && (
            <span style={{ fontSize: 10, color: c.muted, flexShrink: 0 }}>
              {isExpanded ? '▾' : '▸'} {issue.tasks.length} task{issue.tasks.length !== 1 ? 's' : ''}
            </span>
          )}
          <StatusToggle status={issue.status} onToggle={() => toggleStatus(issue.id, issue.status)} />
          <button
            onClick={(e) => { e.stopPropagation(); openForm({ type: 'edit-issue', issue, epicId }); }}
            style={{ ...btnStyle(false), fontSize: 10, padding: '2px 7px' }}
          >
            edit
          </button>
        </div>

        {/* Agent tasks — only shown when expanded */}
        {isExpanded && issue.tasks.map(task => {
          const tCol = task.status === 'done' || task.status === 'completed' ? '#34d399'
            : task.status === 'active' || task.status === 'in-progress' ? '#60a5fa'
            : '#fbbf24';
          return (
            <div key={task.id} style={{
              marginLeft: 16, marginTop: 2,
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '3px 8px',
              opacity: 0.5,
            }}>
              <span style={{ fontSize: 10, color: c.muted }}>└─</span>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: tCol, flexShrink: 0 }} />
              <span style={{ fontSize: 11, color: c.muted, flex: 1 }}>
                {task.title.length > 55 ? task.title.slice(0, 55) + '…' : task.title}
              </span>
              <span style={{ fontSize: 9, color: tCol }}>{task.status}</span>
            </div>
          );
        })}

        {/* Inline edit form */}
        {form?.type === 'edit-issue' && form.issue.id === issue.id && (
          <div style={{ marginLeft: 16 }}>
            <InlineFormRow label="Edit" />
          </div>
        )}
      </div>
    );
  }

  const addEpicBtn = (
    <button
      onClick={() => openForm({ type: 'epic' })}
      style={btnStyle(false)}
    >
      + Epic
    </button>
  );

  return (
    <Widget title="Backlog" count={totalCount} headerExtra={addEpicBtn}>
      {totalCount === 0 && !form ? (
        <Empty msg="No backlog items for this project." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {/* Inline form for new epic */}
          {form?.type === 'epic' && <InlineFormRow label="Epic" />}

          {/* Epics */}
          {backlog.epics.map(epic => <EpicRow key={epic.id} epic={epic} />)}

          {/* Unlinked Issues */}
          {backlog.unlinked_issues.length > 0 && (
            <div style={{ marginTop: 10 }}>
              <div style={{ fontSize: 10, color: c.muted, borderTop: `1px solid ${c.border}`, paddingTop: 8, marginBottom: 6 }}>
                ── Unlinked Issues ──
              </div>
              {backlog.unlinked_issues.map(issue => (
                <IssueRow key={issue.id} issue={issue} epicId={null} indent={0} />
              ))}
            </div>
          )}
        </div>
      )}
    </Widget>
  );
}

function Empty({ msg }: { msg: string }) {
  return <p style={{ color: c.muted, fontSize: 12, margin: 0, fontStyle: 'italic' }}>{msg}</p>;
}

function formatBytes(n: number | null) {
  if (!n) return '—';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

function ArtifactsWidget({ artifacts }: { artifacts: Artifact[] }) {
  if (artifacts.length === 0) return null;
  return (
    <div style={{ marginTop: 16 }}>
      <Widget title="Drive — Artifacts" count={artifacts.length}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {artifacts.map(a => (
            <div key={a.id} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 10px', borderRadius: 7,
              background: 'rgba(255,255,255,0.03)', border: `1px solid ${c.border}`,
            }}>
              <span style={{ fontSize: 16, flexShrink: 0 }}>
                {a.content_type.startsWith('image/') ? '🖼' : a.content_type === 'application/pdf' ? '📄' : '📎'}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <a href={a.url} target="_blank" rel="noreferrer" style={{ color: '#4a9eff', fontSize: 12, textDecoration: 'none' }}>
                  {a.name}
                </a>
                {a.description && (
                  <div style={{ fontSize: 11, color: c.muted, marginTop: 1 }}>{a.description}</div>
                )}
              </div>
              <span style={{ fontSize: 11, color: c.muted, flexShrink: 0 }}>{formatBytes(a.size_bytes)}</span>
              <span style={{ fontSize: 10, color: c.muted, flexShrink: 0 }}>{relativeTime(a.created_at)}</span>
            </div>
          ))}
        </div>
      </Widget>
    </div>
  );
}

export function ProjectDetail({ projectId, onBack, onSelect }: { projectId: number; onBack: () => void; onSelect: (id: number) => void }) {
  const [data, setData] = useState<PD | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function reload() {
    fetchProjectDetail(projectId).then(setData).catch(() => {});
  }

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchProjectDetail(projectId)
      .then(setData)
      .catch(e => setError(String(e)))
      .finally(() => setLoading(false));
  }, [projectId]);

  return (
    <div style={{ minHeight: '100vh', background: c.bg, padding: '24px 32px', maxWidth: 1200, margin: '0 auto' }}>
      <button
        onClick={onBack}
        style={{ background: 'none', border: 'none', color: '#4a9eff', cursor: 'pointer', fontSize: 13, padding: '0 0 20px 0' }}
      >
        ← Back to dashboard
      </button>

      {loading && <p style={{ color: c.muted }}>Loading…</p>}
      {error && <p style={{ color: '#f87171' }}>{error}</p>}

      {data && (
        <>
          {/* Header */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: statusColor(data.project.status), flexShrink: 0 }} />
              <h1 style={{ color: c.text, fontSize: 22, fontWeight: 700, margin: 0 }}>{data.project.name}</h1>
              <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: c.border, color: c.muted }}>
                {data.project.status}
              </span>
              <span style={{ color: c.muted, fontSize: 11, marginLeft: 'auto' }}>
                Updated {relativeTime(data.project.updated_at)}
              </span>
            </div>
            {data.project.description && (
              <p style={{ color: c.muted, fontSize: 13, margin: '0 0 10px 20px' }}>{data.project.description}</p>
            )}

            {/* Sub-projects */}
            {data.children.length > 0 && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginLeft: 20 }}>
                {data.children.map(child => (
                  <div key={child.id} onClick={() => onSelect(child.id)} style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '5px 12px', borderRadius: 20, background: c.surface, border: `1px solid ${c.border}`,
                    cursor: 'pointer',
                  }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: statusColor(child.status) }} />
                    <span style={{ color: c.text, fontSize: 12 }}>{child.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Artifacts */}
          {data.artifacts && data.artifacts.length > 0 && (
            <ArtifactsWidget artifacts={data.artifacts} />
          )}

          {/* 2×2 Widget Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

            {/* Widget 1 — Backlog */}
            <BacklogWidget projectId={data.project.id} backlog={data.backlog} reload={reload} />

            {/* Widget 2 — Active Tasks */}
            <Widget title="Tasks" count={data.tasks.length}>
              {data.tasks.length === 0 ? (
                <Empty msg="No tasks linked to this project." />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {data.tasks.map(t => {
                    const tColor = taskStatusColor[t.status] || '#9ca3af';
                    return (
                      <div key={t.id} style={{
                        display: 'flex', alignItems: 'flex-start', gap: 8,
                        padding: '8px 10px', borderRadius: 7,
                        background: 'rgba(255,255,255,0.03)', border: `1px solid ${c.border}`,
                        opacity: t.status === 'completed' || t.status === 'done' ? 0.55 : 1,
                      }}>
                        <span style={{
                          width: 7, height: 7, borderRadius: '50%', background: tColor,
                          flexShrink: 0, marginTop: 3,
                        }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 12, color: c.text }}>{t.title}</div>
                          <div style={{ fontSize: 11, color: c.muted, marginTop: 2 }}>
                            {t.agent_name && <span style={{ color: '#4a9eff' }}>{t.agent_name.split(':')[0]}</span>}
                            {t.agent_name && ' · '}
                            p{t.priority} · {relativeTime(t.created_at)}
                          </div>
                        </div>
                        <span style={{
                          fontSize: 10, padding: '2px 6px', borderRadius: 4, flexShrink: 0,
                          background: `${tColor}22`, color: tColor,
                        }}>
                          {t.status}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </Widget>

            {/* Widget 3 — Memories */}
            <Widget title="Memories" count={data.memories.length}>
              {data.memories.length === 0 ? (
                <Empty msg="No memories linked to this project yet." />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {data.memories.map(m => {
                    const mc = categoryColor[m.category] || '#9ca3af';
                    return (
                      <div key={m.id} style={{
                        background: 'rgba(255,255,255,0.03)', border: `1px solid ${c.border}`,
                        borderRadius: 8, padding: '10px 12px',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                          <span style={{
                            fontSize: 9, padding: '2px 6px', borderRadius: 20, fontWeight: 600,
                            background: `${mc}22`, color: mc,
                          }}>
                            {m.category}
                          </span>
                          <span style={{ fontSize: 10, color: c.muted, marginLeft: 'auto' }}>
                            imp {m.importance} · {relativeTime(m.created_at)}
                          </span>
                        </div>
                        <p style={{ color: c.text, fontSize: 12, lineHeight: 1.5, margin: 0 }}>{m.content}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </Widget>

            {/* Widget 4 — Agents & Cron Jobs */}
            <Widget title="Agents & Cron Jobs">
              {data.agents.length === 0 && data.cronJobs.length === 0 ? (
                <Empty msg="No agents have worked on this project yet." />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {/* Agents */}
                  {data.agents.length > 0 && (
                    <div>
                      <div style={{ fontSize: 10, color: c.muted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: 8 }}>
                        Agents
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {data.agents.map(agent => {
                          const state = data.agentStates.find(st => st.agent_name === agent.name);
                          const status = state?.state?.status ?? 'idle';
                          const color = statusColor(status);
                          return (
                            <div key={agent.name}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span style={{ width: 7, height: 7, borderRadius: '50%', background: color, flexShrink: 0 }} />
                                <span style={{ fontSize: 13, color: c.text }}>{agent.name}</span>
                                <span style={{ fontSize: 10, color: c.muted, marginLeft: 'auto' }}>
                                  {agent.last_seen ? relativeTime(agent.last_seen) : '—'}
                                </span>
                              </div>
                              {state?.state?.current_task && (
                                <div style={{ fontSize: 11, color: c.muted, marginLeft: 13, marginTop: 2 }}>
                                  {state.state.current_task.length > 70
                                    ? state.state.current_task.slice(0, 70) + '…'
                                    : state.state.current_task}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Cron Jobs */}
                  {data.cronJobs.length > 0 && (
                    <div>
                      <div style={{ fontSize: 10, color: c.muted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: 8 }}>
                        Cron Jobs
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {data.cronJobs.map(job => {
                          const color = statusColor(job.last_status);
                          return (
                            <div key={job.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                              <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, flexShrink: 0, marginTop: 3 }} />
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 12, color: c.text }}>{job.name}</div>
                                <div style={{ fontSize: 11, color: c.muted }}>{job.agent_name} · {job.last_run ? relativeTime(job.last_run) : 'never'}</div>
                              </div>
                              <span style={{ ...s.badge(color), fontSize: 10 }}>{job.last_status}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Recent Sessions */}
                  {data.sessions.length > 0 && (
                    <div>
                      <div style={{ fontSize: 10, color: c.muted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: 8 }}>
                        Recent Sessions
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                        {data.sessions.slice(0, 5).map(sess => (
                          <div key={sess.id} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ color: '#4a9eff', fontSize: 11 }}>{sess.agent_name}</span>
                              <span style={{ color: c.muted, fontSize: 10 }}>{relativeTime(sess.created_at)}</span>
                            </div>
                            {sess.summary && (
                              <p style={{ color: c.muted, fontSize: 11, margin: 0, lineHeight: 1.4 }}>
                                {sess.summary.length > 80 ? sess.summary.slice(0, 80) + '…' : sess.summary}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </Widget>
          </div>
        </>
      )}
    </div>
  );
}
