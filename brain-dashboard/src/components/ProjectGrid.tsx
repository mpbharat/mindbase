import type { ProjectSummary } from '../types';
import { s, statusColor, relativeTime } from '../styles';

const c = s.colors;

interface Props {
  projects: ProjectSummary[];
  onSelect: (id: number) => void;
}

function ProjectCard({ project, children, onSelect }: {
  project: ProjectSummary;
  children: ProjectSummary[];
  onSelect: (id: number) => void;
}) {
  const color = statusColor(project.status);
  const hasSession = !!project.last_session_at;
  const hasCounts = project.memory_count > 0 || project.task_count > 0;

  return (
    <div
      onClick={() => onSelect(project.id)}
      style={{
        background: c.surface,
        border: `1px solid ${c.border}`,
        borderRadius: 10,
        padding: '14px 16px',
        cursor: 'pointer',
        transition: 'border-color 0.15s',
        display: 'flex',
        flexDirection: 'column',
        gap: 0,
      }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = '#4a9eff55')}
      onMouseLeave={e => (e.currentTarget.style.borderColor = c.border)}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: project.description ? 4 : 0 }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
        <span style={{ color: c.text, fontWeight: 600, fontSize: 14 }}>{project.name}</span>
        <span style={{ marginLeft: 'auto', fontSize: 11, color: c.muted }}>↗</span>
      </div>

      {/* Description */}
      {project.description && (
        <p style={{ color: c.muted, fontSize: 12, lineHeight: 1.5, margin: '0 0 8px 16px' }}>
          {project.description.length > 70 ? project.description.slice(0, 70) + '…' : project.description}
        </p>
      )}

      {/* Sub-projects */}
      {children.length > 0 && (
        <div style={{ marginBottom: 8, marginLeft: 16, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {children.map(child => (
            <div
              key={child.id}
              onClick={e => { e.stopPropagation(); onSelect(child.id); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '5px 8px', borderRadius: 6,
                background: 'rgba(255,255,255,0.04)', cursor: 'pointer',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
            >
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: statusColor(child.status), flexShrink: 0 }} />
              <span style={{ color: c.text, fontSize: 12, fontWeight: 500 }}>{child.name}</span>
              {child.description && (
                <span style={{ color: c.muted, fontSize: 11, marginLeft: 2 }}>
                  — {child.description.slice(0, 40)}{child.description.length > 40 ? '…' : ''}
                </span>
              )}
              {child.memory_count > 0 && (
                <span style={{ marginLeft: 'auto', fontSize: 10, color: c.muted }}>{child.memory_count}m</span>
              )}
              <span style={{ fontSize: 10, color: c.muted }}>↗</span>
            </div>
          ))}
        </div>
      )}

      {/* Counts + Last session */}
      {(hasCounts || hasSession) && (
        <div style={{ borderTop: `1px solid ${c.border}`, marginTop: 4, paddingTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {hasCounts && (
            <div style={{ display: 'flex', gap: 10 }}>
              {project.memory_count > 0 && (
                <span style={{ fontSize: 11, color: c.muted }}>
                  <span style={{ color: '#a78bfa' }}>●</span> {project.memory_count} {project.memory_count === 1 ? 'memory' : 'memories'}
                </span>
              )}
              {project.task_count > 0 && (
                <span style={{ fontSize: 11, color: c.muted }}>
                  <span style={{ color: '#60a5fa' }}>●</span> {project.task_count} {project.task_count === 1 ? 'task' : 'tasks'}
                </span>
              )}
            </div>
          )}
          {hasSession && (
            <div style={{ fontSize: 11, color: c.muted }}>
              <span style={{ color: '#4a9eff' }}>{project.last_session_agent?.split(':')[0]}</span>
              {' · '}{relativeTime(project.last_session_at)}
              {project.last_session_summary && (
                <div style={{ marginTop: 2, color: c.muted, lineHeight: 1.4 }}>
                  {project.last_session_summary.length > 80
                    ? project.last_session_summary.slice(0, 80) + '…'
                    : project.last_session_summary}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function isActive(p: ProjectSummary) {
  return p.memory_count > 0 || p.task_count > 0 || !!p.last_session_at;
}

export function ProjectGrid({ projects, onSelect }: Props) {
  const roots = projects.filter(p => !p.parent_id);
  const childrenOf = (id: number) => projects.filter(p => p.parent_id === id);

  const active = roots.filter(isActive);
  const inactive = roots.filter(p => !isActive(p));

  if (roots.length === 0) return <p style={{ color: c.muted, fontSize: 13 }}>No projects.</p>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Active projects — full cards */}
      {active.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
          {active.map(p => (
            <ProjectCard key={p.id} project={p} children={childrenOf(p.id)} onSelect={onSelect} />
          ))}
        </div>
      )}

      {/* Inactive / empty projects — compact chips */}
      {inactive.length > 0 && (
        <div>
          <p style={{ color: c.muted, fontSize: 11, margin: '0 0 8px 0', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Empty projects
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {inactive.map(p => (
              <div
                key={p.id}
                onClick={() => onSelect(p.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '5px 12px', borderRadius: 20,
                  background: c.surface, border: `1px solid ${c.border}`,
                  cursor: 'pointer', opacity: 0.6,
                }}
                onMouseEnter={e => { e.currentTarget.style.opacity = '1'; }}
                onMouseLeave={e => { e.currentTarget.style.opacity = '0.6'; }}
              >
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: statusColor(p.status), flexShrink: 0 }} />
                <span style={{ color: c.text, fontSize: 12 }}>{p.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
