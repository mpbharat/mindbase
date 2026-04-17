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
    <div style={{ minHeight: '100vh', background: c.bg, padding: '24px 32px', maxWidth: 1100, margin: '0 auto' }}>
      <button
        onClick={onBack}
        style={{ background: 'none', border: 'none', color: '#4a9eff', cursor: 'pointer', fontSize: 13, padding: '0 0 20px 0' }}
      >
        ← Back to dashboard
      </button>

      {loading && <p style={{ color: c.muted }}>Loading…</p>}
      {error && <p style={{ color: c.red }}>{error}</p>}

      {data && (
        <>
          {/* Header */}
          <div style={{ marginBottom: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: statusColor(data.project.status) }} />
              <h1 style={{ color: c.text, fontSize: 24, fontWeight: 700, margin: 0 }}>{data.project.name}</h1>
              <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: c.border, color: c.muted }}>
                {data.project.status}
              </span>
            </div>
            {data.project.description && (
              <p style={{ color: c.muted, fontSize: 14, margin: 0 }}>{data.project.description}</p>
            )}
            <p style={{ color: c.muted, fontSize: 12, marginTop: 6 }}>
              Updated {relativeTime(data.project.updated_at)}
            </p>
          </div>

          {/* Sub-projects */}
          {data.children.length > 0 && (
            <section style={{ marginBottom: 32 }}>
              <h2 style={s.sectionTitle}>Sub-projects</h2>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {data.children.map(child => (
                  <div key={child.id} style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '8px 14px', borderRadius: 8, background: c.surface, border: `1px solid ${c.border}`,
                  }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: statusColor(child.status) }} />
                    <span style={{ color: c.text, fontSize: 13 }}>{child.name}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
            {/* Memories */}
            <section>
              <h2 style={s.sectionTitle}>Memories ({data.memories.length})</h2>
              {data.memories.length === 0 ? (
                <p style={{ color: c.muted, fontSize: 13 }}>
                  No memories linked to this project yet.<br />
                  <span style={{ fontSize: 11, opacity: 0.6 }}>
                    Pass <code>project_id</code> when saving memories to link them here.
                  </span>
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {data.memories.map(m => (
                    <div key={m.id} style={{ background: c.surface, border: `1px solid ${c.border}`, borderRadius: 8, padding: '12px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <span style={{
                          fontSize: 10, padding: '2px 7px', borderRadius: 20, fontWeight: 600,
                          background: `${categoryColor[m.category] || '#9ca3af'}22`,
                          color: categoryColor[m.category] || '#9ca3af',
                        }}>
                          {m.category}
                        </span>
                        <span style={{ fontSize: 11, color: c.muted, marginLeft: 'auto' }}>
                          imp {m.importance} · {relativeTime(m.created_at)}
                        </span>
                      </div>
                      <p style={{ color: c.text, fontSize: 13, lineHeight: 1.5, margin: 0 }}>{m.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Sessions + Tasks */}
            <div>
              <section style={{ marginBottom: 28 }}>
                <h2 style={s.sectionTitle}>Sessions ({data.sessions.length})</h2>
                {data.sessions.length === 0 ? (
                  <p style={{ color: c.muted, fontSize: 13 }}>No sessions linked to this project.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {data.sessions.map(sess => (
                      <div key={sess.id} style={{ background: c.surface, border: `1px solid ${c.border}`, borderRadius: 8, padding: '10px 14px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ color: '#4a9eff', fontSize: 12, fontWeight: 600 }}>{sess.agent_name}</span>
                          <span style={{ color: c.muted, fontSize: 11 }}>{relativeTime(sess.created_at)}</span>
                        </div>
                        {sess.summary && <p style={{ color: c.text, fontSize: 12, lineHeight: 1.4, margin: 0 }}>{sess.summary}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {data.tasks.length > 0 && (
                <section>
                  <h2 style={s.sectionTitle}>Tasks ({data.tasks.length})</h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {data.tasks.map(t => (
                      <div key={t.id} style={{ background: c.surface, border: `1px solid ${c.border}`, borderRadius: 8, padding: '10px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{
                            fontSize: 10, padding: '1px 7px', borderRadius: 20,
                            background: t.status === 'completed' ? '#34d39922' : '#fbbf2422',
                            color: t.status === 'completed' ? '#34d399' : '#fbbf24',
                          }}>
                            {t.status}
                          </span>
                          <span style={{ color: c.text, fontSize: 13 }}>{t.title}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
