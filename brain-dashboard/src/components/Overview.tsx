import { useEffect, useState } from 'react';
import { fetchRecentSessions } from '../api';
import type { DashboardData, Session } from '../types';

function relTime(ts: string) {
  const diff = Date.now() - new Date(ts).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 2) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function Overview({ data }: { data: DashboardData }) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [days, setDays] = useState(1);

  useEffect(() => { fetchRecentSessions(days).then(setSessions).catch(() => {}); }, [days]);

  const totalTasks = data.projects.reduce((s, p) => s + p.task_count, 0);
  const totalMems  = data.projects.reduce((s, p) => s + p.memory_count, 0);
  const activeAgents = data.agentStates.filter(a => a.state?.status === 'working').length;

  const grouped = sessions.reduce<Record<string, Session[]>>((acc, s) => {
    const day = new Date(s.created_at).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
    (acc[day] ??= []).push(s);
    return acc;
  }, {});

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {[
          { label: 'Active Tasks',  value: totalTasks,   color: 'var(--blue)'  },
          { label: 'Memories',      value: totalMems,    color: 'var(--text)'  },
          { label: 'Agents Online', value: activeAgents, color: 'var(--green)' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div style={{ fontSize: 32, fontWeight: 700, color: s.color, lineHeight: 1, marginBottom: 6 }}>{s.value}</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 500 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Body */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 20 }}>

        {/* Live Agents */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--dim)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Live Agents
          </div>

          {data.agentStates.length === 0 && (
            <p style={{ fontSize: 13, color: 'var(--dim)', fontStyle: 'italic' }}>No agents seen yet</p>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {data.agentStates.map(a => {
              const working = a.state?.status === 'working';
              return (
                <div key={a.agent_name} className="mcard" style={{ padding: '12px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: a.state?.current_task || a.state?.next_task ? 8 : 0 }}>
                    <span className={working ? 'pulse' : ''} style={{
                      width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
                      background: working ? 'var(--blue)' : 'var(--dim)',
                    }} />
                    <span style={{ fontSize: 12, fontWeight: 500, color: working ? 'var(--text)' : 'var(--muted)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {a.agent_name}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--dim)', flexShrink: 0 }}>{relTime(a.updated_at)}</span>
                  </div>
                  {a.state?.current_task && (
                    <p style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                      {a.state.current_task}
                    </p>
                  )}
                  {!a.state?.current_task && a.state?.next_task && (
                    <p style={{ fontSize: 11, color: 'var(--dim)', lineHeight: 1.4 }}>
                      Next: {a.state.next_task}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Sessions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--dim)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Sessions
            </span>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
              {(['Today', 'Week', 'Month'] as const).map((label, i) => {
                const d = [1, 7, 30][i];
                return (
                  <button key={label} onClick={() => setDays(d)}
                    className={`tab-btn ${days === d ? 'active' : ''}`}
                    style={{ padding: '3px 10px', fontSize: 12 }}>
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {Object.keys(grouped).length === 0 && (
            <p style={{ fontSize: 13, color: 'var(--dim)', fontStyle: 'italic' }}>No sessions in this period</p>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {Object.entries(grouped).map(([day, daySessions]) => (
              <div key={day}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--dim)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                  {day}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {daySessions.map(s => (
                    <div key={s.id} className="mcard" style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: s.summary ? 6 : 0 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--blue)', flexShrink: 0 }}>
                          {s.agent_name.split(':')[0]}
                        </span>
                        {s.project_name && (
                          <span style={{ fontSize: 12, color: 'var(--dim)' }}>· {s.project_name}</span>
                        )}
                        <span style={{ fontSize: 11, color: 'var(--dim)', marginLeft: 'auto', flexShrink: 0 }}>
                          {relTime(s.created_at)}
                        </span>
                      </div>
                      {s.summary && (
                        <p style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                          {s.summary}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
