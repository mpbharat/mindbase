import type { Memory, Project } from '../types';
import { s, relativeTime } from '../styles';

const c = s.colors;

const categoryColor: Record<string, string> = {
  person: '#a78bfa',
  decision: '#60a5fa',
  fact: '#4ade80',
  project: '#facc15',
  general: '#888',
};

export function MemoryFeed({ memories, projects }: { memories: Memory[]; projects: Project[] }) {
  if (memories.length === 0) {
    return <div style={{ ...s.card, ...s.empty }}>No memories saved yet.</div>;
  }

  const projectName = (id: number | null) => {
    if (!id) return null;
    return projects.find(p => p.id === id)?.name ?? null;
  };

  return (
    <div style={s.card}>
      {memories.map((m, i) => (
        <div key={m.id}>
          {i > 0 && <div style={s.divider} />}
          <div style={s.row}>
            <span style={s.badge(categoryColor[m.category] ?? '#888')}>{m.category}</span>
            {m.project_id && (
              <span style={{
                fontSize: 11, padding: '2px 8px', borderRadius: 20,
                background: 'rgba(74,158,255,0.15)', color: '#4a9eff',
              }}>
                {projectName(m.project_id) ?? `project ${m.project_id}`}
              </span>
            )}
            <span style={{ ...s.tag, marginLeft: 'auto' }}>imp {m.importance}</span>
            <span style={{ fontSize: 11, color: c.muted }}>{relativeTime(m.created_at)}</span>
          </div>
          <div style={{ ...s.sub, marginTop: '6px', color: s.colors.text, lineHeight: '1.5' }}>
            {m.content}
          </div>
        </div>
      ))}
    </div>
  );
}
