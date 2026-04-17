import type { Project } from '../types';
import { s, statusColor } from '../styles';

export function ProjectGrid({ projects }: { projects: Project[] }) {
  const active = projects.filter(p => p.status !== 'archived');

  return (
    <div style={s.grid}>
      {active.map(p => (
        <div key={p.id} style={s.card}>
          <div style={s.row}>
            <div style={s.dot(statusColor(p.status))} />
            <span style={s.name}>{p.name}</span>
          </div>
          {p.description && (
            <div style={{ ...s.sub, marginTop: '8px', lineHeight: '1.4' }}>
              {p.description.length > 80 ? p.description.slice(0, 80) + '…' : p.description}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
