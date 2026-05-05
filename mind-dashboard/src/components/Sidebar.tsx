import { useState } from 'react';
import type { ProjectSummary, AgentState } from '../types';

function relTime(ts: string) {
  const m = Math.floor((Date.now() - new Date(ts).getTime()) / 60000);
  if (m < 2) return 'now';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

interface TreeNode extends ProjectSummary { children: TreeNode[]; }

function buildTree(projects: ProjectSummary[]): TreeNode[] {
  const map = new Map<number, TreeNode>();
  projects.forEach(p => map.set(p.id, { ...p, children: [] }));
  const roots: TreeNode[] = [];
  projects.forEach(p => {
    if (p.parent_id && map.has(p.parent_id)) map.get(p.parent_id)!.children.push(map.get(p.id)!);
    else if (!p.parent_id) roots.push(map.get(p.id)!);
  });
  return roots;
}

function Node({ node, depth, selectedId, onSelect }: {
  node: TreeNode; depth: number; selectedId: number | null; onSelect: (id: number) => void;
}) {
  const [open, setOpen] = useState(depth === 0);
  const isSelected = selectedId === node.id;
  const hasChildren = node.children.length > 0;

  return (
    <div>
      <div
        className={`sidebar-item ${isSelected ? 'active' : ''}`}
        style={{ paddingLeft: `${10 + depth * 14}px` }}
        onClick={() => onSelect(node.id)}
      >
        {/* Expand toggle */}
        {hasChildren ? (
          <button
            onClick={e => { e.stopPropagation(); setOpen(o => !o); }}
            style={{ width: 14, height: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: 'var(--dim)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            <svg width="7" height="7" viewBox="0 0 7 7" fill="currentColor"
              style={{ transform: open ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }}>
              <path d="M1.5 1l4 2.5-4 2.5V1z" />
            </svg>
          </button>
        ) : (
          <span style={{ width: 14, flexShrink: 0 }} />
        )}

        {/* Status dot */}
        <span style={{
          width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
          background: node.task_count > 0 ? 'var(--blue)' : 'var(--dim)',
        }} />

        {/* Name */}
        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }}>
          {node.name}
        </span>

        {/* Task count */}
        {node.task_count > 0 && (
          <span style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--blue)', flexShrink: 0 }}>
            {node.task_count}
          </span>
        )}
      </div>

      {open && hasChildren && (
        <div style={{ marginTop: 1 }}>
          {node.children.map(child => (
            <Node key={child.id} node={child} depth={depth + 1} selectedId={selectedId} onSelect={onSelect} />
          ))}
        </div>
      )}
    </div>
  );
}

interface Props {
  projects: ProjectSummary[];
  agentStates: AgentState[];
  selectedId: number | null;
  onSelect: (id: number) => void;
}

export function Sidebar({ projects, agentStates, selectedId, onSelect }: Props) {
  const tree = buildTree(projects);
  const working = agentStates.filter(a => a.state?.status === 'working');

  return (
    <aside style={{
      width: 220, flexShrink: 0, display: 'flex', flexDirection: 'column',
      borderRight: '1px solid var(--border)', background: 'var(--bg)', height: '100vh', overflow: 'hidden',
    }}>
      {/* Logo */}
      <div style={{ padding: '16px 14px 12px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8, background: 'rgba(59,130,246,0.15)',
            border: '1px solid rgba(59,130,246,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--blue)' }}>B</span>
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Brain</div>
            <div style={{ fontSize: 11, color: 'var(--dim)' }}>Memory OS · v4</div>
          </div>
        </div>
      </div>

      {/* Projects */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 6px' }}>
        <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--dim)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '0 8px 6px' }}>
          Projects
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {tree.map(node => (
            <Node key={node.id} node={node} depth={0} selectedId={selectedId} onSelect={onSelect} />
          ))}
        </div>
      </div>

      {/* Agents */}
      {agentStates.length > 0 && (
        <div style={{ borderTop: '1px solid var(--border)', padding: '10px 14px', flexShrink: 0 }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--dim)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
            Agents {working.length > 0 && <span style={{ color: 'var(--blue)' }}>· {working.length} active</span>}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {agentStates.slice(0, 5).map(a => {
              const isWorking = a.state?.status === 'working';
              return (
                <div key={a.agent_name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className={isWorking ? 'pulse' : ''} style={{
                    width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                    background: isWorking ? 'var(--blue)' : 'var(--dim)',
                  }} />
                  <span style={{ fontSize: 12, color: isWorking ? 'var(--text)' : 'var(--muted)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {a.agent_name.split(':')[0]}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--dim)', flexShrink: 0 }}>{relTime(a.updated_at)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </aside>
  );
}
