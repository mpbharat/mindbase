import type { Memory } from '../types';
import { s } from '../styles';

const categoryColor: Record<string, string> = {
  person: '#a78bfa',
  decision: '#60a5fa',
  fact: '#4ade80',
  project: '#facc15',
  general: '#888',
};

export function MemoryFeed({ memories }: { memories: Memory[] }) {
  if (memories.length === 0) {
    return <div style={{ ...s.card, ...s.empty }}>No memories saved yet.</div>;
  }

  return (
    <div style={s.card}>
      {memories.map((m, i) => (
        <div key={m.id}>
          {i > 0 && <div style={s.divider} />}
          <div style={s.row}>
            <span style={s.badge(categoryColor[m.category] ?? '#888')}>{m.category}</span>
            <span style={{ ...s.tag, marginLeft: 'auto' }}>importance {m.importance}</span>
          </div>
          <div style={{ ...s.sub, marginTop: '6px', color: s.colors.text, lineHeight: '1.5' }}>
            {m.content}
          </div>
        </div>
      ))}
    </div>
  );
}
