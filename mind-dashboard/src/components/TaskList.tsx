import type { AgentTask } from '../types';
import { s, statusColor } from '../styles';

export function TaskList({ tasks }: { tasks: AgentTask[] }) {
  const active = tasks.filter(t => t.status === 'pending' || t.status === 'in_progress');

  if (active.length === 0) {
    return <div style={{ ...s.card, ...s.empty }}>No active tasks.</div>;
  }

  return (
    <div style={s.card}>
      {active.map((task, i) => (
        <div key={task.id}>
          {i > 0 && <div style={s.divider} />}
          <div style={s.row}>
            <div style={s.dot(statusColor(task.status))} />
            <span style={s.name}>{task.title}</span>
            <span style={{ ...s.badge(statusColor(task.status)), marginLeft: 'auto' }}>{task.status}</span>
          </div>
          {task.agent_name && (
            <div style={{ ...s.sub, marginTop: '4px', paddingLeft: '16px' }}>
              {task.agent_name} · priority {task.priority}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
