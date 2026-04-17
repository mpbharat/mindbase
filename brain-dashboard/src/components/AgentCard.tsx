import type { Agent, AgentState, Subagent } from '../types';
import { s, statusColor, relativeTime } from '../styles';

interface Props {
  agent: Agent;
  state: AgentState | undefined;
  subagents: Subagent[];
}

export function AgentCard({ agent, state, subagents }: Props) {
  const agentStatus = state?.state?.status ?? 'idle';
  const color = statusColor(agentStatus);
  const currentTask = state?.state?.current_task;

  return (
    <div style={s.card}>
      <div style={s.row}>
        <div style={s.dot(color)} />
        <span style={s.name}>{agent.name}</span>
        <span style={{ ...s.badge(color), marginLeft: 'auto' }}>{agentStatus}</span>
      </div>
      {currentTask && (
        <div style={{ ...s.sub, marginTop: '8px' }}>{currentTask}</div>
      )}
      <div style={{ ...s.sub, marginTop: '4px' }}>
        Last seen: {relativeTime(agent.last_seen)}
      </div>
      {subagents.length > 0 && (
        <>
          <div style={s.divider} />
          {subagents.map((sa, i) => (
            <div key={i} style={{ ...s.row, marginBottom: '4px', paddingLeft: '8px' }}>
              <span style={{ color: s.colors.muted, fontSize: '12px' }}>└─</span>
              <span style={{ fontSize: '12px', color: s.colors.text }}>{sa.name}</span>
              {sa.task && (
                <span style={{ fontSize: '11px', color: s.colors.muted, marginLeft: '4px' }}>
                  {sa.task.length > 40 ? sa.task.slice(0, 40) + '…' : sa.task}
                </span>
              )}
              <div style={{ ...s.dot(statusColor(sa.status)), marginLeft: 'auto' }} />
            </div>
          ))}
        </>
      )}
    </div>
  );
}
