import type { CSSProperties } from 'react';

const c = {
  bg: '#0f0f0f',
  surface: '#1a1a1a',
  border: '#2a2a2a',
  text: '#e0e0e0',
  muted: '#888',
  green: '#4ade80',
  yellow: '#facc15',
  red: '#f87171',
  blue: '#60a5fa',
  purple: '#a78bfa',
};

export const s = {
  root: { minHeight: '100vh', padding: '24px', maxWidth: '1100px', margin: '0 auto' } as CSSProperties,
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' } as CSSProperties,
  title: { fontSize: '20px', fontWeight: 700, color: c.text, letterSpacing: '-0.5px' } as CSSProperties,
  meta: { display: 'flex', alignItems: 'center', gap: '12px', color: c.muted, fontSize: '13px' } as CSSProperties,
  refreshBtn: { background: c.surface, border: `1px solid ${c.border}`, color: c.text, padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' } as CSSProperties,
  section: { marginBottom: '32px' } as CSSProperties,
  sectionTitle: { fontSize: '11px', fontWeight: 600, color: c.muted, textTransform: 'uppercase' as const, letterSpacing: '1px', marginBottom: '12px' } as CSSProperties,
  card: { background: c.surface, border: `1px solid ${c.border}`, borderRadius: '8px', padding: '16px' } as CSSProperties,
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px' } as CSSProperties,
  row: { display: 'flex', alignItems: 'center', gap: '8px' } as CSSProperties,
  dot: (color: string) => ({ width: '8px', height: '8px', borderRadius: '50%', background: color, flexShrink: 0 }) as CSSProperties,
  badge: (color: string) => ({ fontSize: '11px', padding: '2px 6px', borderRadius: '4px', background: color + '22', color, fontWeight: 600 }) as CSSProperties,
  name: { fontSize: '14px', fontWeight: 600, color: c.text } as CSSProperties,
  sub: { fontSize: '12px', color: c.muted, marginTop: '2px' } as CSSProperties,
  tag: { fontSize: '11px', color: c.muted, background: c.border, padding: '2px 6px', borderRadius: '4px' } as CSSProperties,
  divider: { borderTop: `1px solid ${c.border}`, margin: '12px 0' } as CSSProperties,
  table: { width: '100%', borderCollapse: 'collapse' as const } as CSSProperties,
  th: { fontSize: '11px', color: c.muted, textAlign: 'left' as const, padding: '6px 8px', borderBottom: `1px solid ${c.border}` } as CSSProperties,
  td: { fontSize: '13px', color: c.text, padding: '8px', borderBottom: `1px solid ${c.border}` } as CSSProperties,
  empty: { color: c.muted, fontSize: '13px', fontStyle: 'italic' as const } as CSSProperties,
  loading: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#888', fontSize: '14px' } as CSSProperties,
  colors: c,
};

export function statusColor(status: string): string {
  if (status === 'active' || status === 'ok' || status === 'running' || status === 'in_progress') return c.green;
  if (status === 'error') return c.red;
  if (status === 'idle' || status === 'unknown' || status === 'done') return c.muted;
  return c.muted;
}

export function relativeTime(iso: string | null): string {
  if (!iso) return 'never';
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return `${Math.floor(hr / 24)}d ago`;
}
