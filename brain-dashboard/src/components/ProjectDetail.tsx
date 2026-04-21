import { useEffect, useState } from 'react';
import { fetchProjectDetail } from '../api';
import type { ProjectDetail as PD } from '../types';
import { s, statusColor, relativeTime } from '../styles';

const c = s.colors;

const categoryColor: Record<string, string> = {
  person: '#a78bfa',
  decision: '#60a5fa',
  project: '#34d399',
  fact: '#fbbf24',
  general: '#9ca3af',
};

const priorityColor = (p: number) =>
  p >= 9 ? '#f87171' : p >= 7 ? '#fbbf24' : p >= 5 ? '#60a5fa' : '#6b7280';

const taskStatusColor: Record<string, string> = {
  completed: '#34d399',
  done: '#34d399',
  'in-progress': '#60a5fa',
  active: '#60a5fa',
  pending: '#fbbf24',
  blocked: '#f87171',
};

function Widget({ title, count, children }: { title: string; count?: number; children: React.ReactNode }) {
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
      </div>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {children}
      </div>
    </div>
  );
}

function Empty({ msg }: { msg: string }) {
  return <p style={{ color: c.muted, fontSize: 12, margin: 0, fontStyle: 'italic' }}>{msg}</p>;
}

export function ProjectDetail({ projectId, onBack }: { projectId: number; onBack: () => void }) {
  const [data, setData] = useState<PD | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
                  <div key={child.id} style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '5px 12px', borderRadius: 20, background: c.surface, border: `1px solid ${c.border}`,
                  }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: statusColor(child.status) }} />
                    <span style={{ color: c.text, fontSize: 12 }}>{child.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 2×2 Widget Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

            {/* Widget 1 — Backlog */}
            <Widget title="Backlog" count={data.backlog.length}>
              {data.backlog.length === 0 ? (
                <Empty msg="No backlog items for this project." />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {data.backlog.map(item => (
                    <div key={item.id} style={{
                      display: 'flex', alignItems: 'flex-start', gap: 8,
                      padding: '8px 10px', borderRadius: 7,
                      background: item.status === 'done' ? 'rgba(52,211,153,0.04)' : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${item.status === 'done' ? '#34d39920' : c.border}`,
                      opacity: item.status === 'done' ? 0.55 : 1,
                    }}>
                      <span style={{
                        fontSize: 10, fontWeight: 700, color: priorityColor(item.priority),
                        flexShrink: 0, marginTop: 1, minWidth: 14, textAlign: 'right',
                      }}>
                        P{item.priority}
                      </span>
                      <div style={{ flex: 1 }}>
                        <span style={{
                          fontSize: 12, color: c.text,
                          textDecoration: item.status === 'done' ? 'line-through' : 'none',
                        }}>
                          {item.title}
                        </span>
                        {item.tags.length > 0 && (
                          <div style={{ display: 'flex', gap: 4, marginTop: 4, flexWrap: 'wrap' }}>
                            {item.tags.map(tag => (
                              <span key={tag} style={{
                                fontSize: 9, padding: '1px 5px', borderRadius: 4,
                                background: 'rgba(255,255,255,0.06)', color: c.muted,
                              }}>{tag}</span>
                            ))}
                          </div>
                        )}
                      </div>
                      <span style={{
                        fontSize: 10, padding: '2px 6px', borderRadius: 4, flexShrink: 0,
                        background: item.status === 'done' ? '#34d39922' : '#fbbf2422',
                        color: item.status === 'done' ? '#34d399' : '#fbbf24',
                      }}>
                        {item.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Widget>

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
