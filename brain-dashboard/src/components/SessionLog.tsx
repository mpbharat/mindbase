import type { Session } from '../types';
import { s, relativeTime } from '../styles';

export function SessionLog({ sessions }: { sessions: Session[] }) {
  if (sessions.length === 0) {
    return <div style={{ ...s.card, ...s.empty }}>No sessions recorded yet.</div>;
  }

  return (
    <div style={s.card}>
      {sessions.map((session, i) => (
        <div key={session.id}>
          {i > 0 && <div style={s.divider} />}
          <div style={s.row}>
            <span style={s.name}>{session.agent_name}</span>
            <span style={{ ...s.sub, marginLeft: 'auto' }}>{relativeTime(session.created_at)}</span>
          </div>
          {session.summary && (
            <div style={{ ...s.sub, marginTop: '4px', lineHeight: '1.4' }}>{session.summary}</div>
          )}
        </div>
      ))}
    </div>
  );
}
