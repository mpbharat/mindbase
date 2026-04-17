import type { Project } from '../types';
import { s, statusColor } from '../styles';

const c = s.colors;

interface Props {
  projects: Project[];
  onSelect: (id: number) => void;
}

function ProjectCard({ project, children, onSelect }: { project: Project; children: Project[]; onSelect: (id: number) => void }) {
  const color = statusColor(project.status);
  return (
    <div
      onClick={() => onSelect(project.id)}
      style={{
        background: c.surface, border: `1px solid ${c.border}`, borderRadius: 10,
        padding: '14px 16px', cursor: 'pointer', transition: 'border-color 0.15s',
      }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = '#4a9eff55')}
      onMouseLeave={e => (e.currentTarget.style.borderColor = c.border)}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: project.description ? 6 : 0 }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
        <span style={{ color: c.text, fontWeight: 600, fontSize: 14 }}>{project.name}</span>
        <span style={{ marginLeft: 'auto', fontSize: 11, color: c.muted }}>↗</span>
      </div>
      {project.description && (
        <p style={{ color: c.muted, fontSize: 12, lineHeight: 1.5, margin: '0 0 0 16px' }}>
          {project.description.length > 80 ? project.description.slice(0, 80) + '…' : project.description}
        </p>
      )}
      {children.length > 0 && (
        <div style={{ marginTop: 10, marginLeft: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {children.map(child => (
            <div
              key={child.id}
              onClick={e => { e.stopPropagation(); onSelect(child.id); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '7px 10px', borderRadius: 7,
                background: 'rgba(255,255,255,0.04)', cursor: 'pointer',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.07)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
            >
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: statusColor(child.status), flexShrink: 0 }} />
              <span style={{ color: c.text, fontSize: 13 }}>{child.name}</span>
              {child.description && (
                <span style={{ color: c.muted, fontSize: 11, marginLeft: 4 }}>
                  — {child.description.slice(0, 45)}{child.description.length > 45 ? '…' : ''}
                </span>
              )}
              <span style={{ marginLeft: 'auto', fontSize: 10, color: c.muted }}>↗</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function ProjectGrid({ projects, onSelect }: Props) {
  const roots = projects.filter(p => !p.parent_id && p.status !== 'archived');
  const childrenOf = (id: number) => projects.filter(p => p.parent_id === id);

  if (roots.length === 0) return <p style={{ color: c.muted, fontSize: 13 }}>No active projects.</p>;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
      {roots.map(p => (
        <ProjectCard key={p.id} project={p} children={childrenOf(p.id)} onSelect={onSelect} />
      ))}
    </div>
  );
}
