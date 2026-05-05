import { useState, useEffect } from 'react';
import { fetchRecentSessions } from '../api';
import type { Session } from '../types';
import { s, relativeTime } from '../styles';

const c = s.colors;

const TABS = [
  { label: 'Today', days: 1 },
  { label: 'This Week', days: 7 },
  { label: 'This Month', days: 30 },
] as const;

function groupByDate(sessions: Session[]): { label: string; sessions: Session[] }[] {
  const groups: Map<string, Session[]> = new Map();
  const now = new Date();

  for (const sess of sessions) {
    const d = new Date(sess.created_at);
    const diffDays = Math.floor((now.getTime() - d.getTime()) / 86_400_000);
    const label =
      diffDays === 0 ? 'Today' :
      diffDays === 1 ? 'Yesterday' :
      d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

    if (!groups.has(label)) groups.set(label, []);
    groups.get(label)!.push(sess);
  }

  return Array.from(groups.entries()).map(([label, sessions]) => ({ label, sessions }));
}

export function SessionsPanel() {
  const [activeDays, setActiveDays] = useState<1 | 7 | 30>(7);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetchRecentSessions(activeDays)
      .then(setSessions)
      .finally(() => setLoading(false));
  }, [activeDays]);

  const groups = groupByDate(sessions);

  return (
    <div style={{
      background: c.surface,
      border: `1px solid ${c.border}`,
      borderRadius: 10,
      padding: '16px',
      marginTop: 12,
    }}>
      {/* Header + tabs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <span style={{ color: c.text, fontWeight: 600, fontSize: 14 }}>Sessions</span>
        {loading && <span style={{ fontSize: 11, color: c.muted }}>↻</span>}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
          {TABS.map(tab => (
            <button
              key={tab.days}
              onClick={() => setActiveDays(tab.days as 1 | 7 | 30)}
              style={{
                background: activeDays === tab.days ? '#4a9eff22' : 'transparent',
                border: `1px solid ${activeDays === tab.days ? '#4a9eff55' : c.border}`,
                color: activeDays === tab.days ? '#4a9eff' : c.muted,
                borderRadius: 6,
                padding: '3px 10px',
                fontSize: 11,
                cursor: 'pointer',
                fontWeight: activeDays === tab.days ? 600 : 400,
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {sessions.length === 0 && !loading && (
        <p style={{ color: c.muted, fontSize: 12, margin: 0, fontStyle: 'italic' }}>No sessions in this period.</p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {groups.map(group => (
          <div key={group.label}>
            <div style={{ fontSize: 11, color: c.muted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 8 }}>
              {group.label}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {group.sessions.map(sess => (
                <div key={sess.id} style={{
                  display: 'flex', gap: 10,
                  padding: '8px 12px', borderRadius: 8,
                  background: 'rgba(255,255,255,0.03)', border: `1px solid ${c.border}`,
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: sess.summary ? 4 : 0 }}>
                      <span style={{ fontSize: 12, color: '#4a9eff', fontWeight: 600 }}>
                        {sess.agent_name.split(':')[0]}
                      </span>
                      {sess.agent_name.includes(':') && (
                        <span style={{ fontSize: 11, color: c.muted }}>
                          {sess.agent_name.split(':')[1]}
                        </span>
                      )}
                      {sess.project_name && (
                        <>
                          <span style={{ color: c.muted, fontSize: 11 }}>·</span>
                          <span style={{ fontSize: 11, color: '#a78bfa' }}>{sess.project_name}</span>
                        </>
                      )}
                      <span style={{ fontSize: 10, color: c.muted, marginLeft: 'auto' }}>
                        {relativeTime(sess.created_at)}
                      </span>
                    </div>
                    {sess.summary && (
                      <p style={{ color: c.muted, fontSize: 12, margin: 0, lineHeight: 1.4 }}>
                        {sess.summary}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
