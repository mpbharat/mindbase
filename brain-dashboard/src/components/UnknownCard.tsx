import type { Agent, AgentState, CronJob, Subagent } from '../types';
import { s, statusColor, relativeTime } from '../styles';

const c = s.colors;

interface Props {
  agents: Agent[];
  agentStates: AgentState[];
  cronJobs: CronJob[];
  subagents: Subagent[];
  unlinked: { memory_count: number; task_count: number };
}

export function UnknownCard({ agents, agentStates, cronJobs, subagents, unlinked }: Props) {
  const stateMap = Object.fromEntries(agentStates.map(st => [st.agent_name, st]));
  const hasContent = agents.length > 0 || cronJobs.length > 0 || unlinked.memory_count > 0 || unlinked.task_count > 0;

  if (!hasContent) return null;

  return (
    <div style={{
      background: c.surface,
      border: `1px solid ${c.border}`,
      borderRadius: 10,
      padding: '16px',
      marginTop: 12,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: c.muted, flexShrink: 0 }} />
        <span style={{ color: c.text, fontWeight: 600, fontSize: 14 }}>System</span>
        {(unlinked.memory_count > 0 || unlinked.task_count > 0) && (
          <span style={{ fontSize: 11, color: c.muted, marginLeft: 'auto' }}>
            {unlinked.memory_count > 0 && `${unlinked.memory_count} unlinked memories`}
            {unlinked.memory_count > 0 && unlinked.task_count > 0 && ' · '}
            {unlinked.task_count > 0 && `${unlinked.task_count} unlinked tasks`}
          </span>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: agents.length > 0 && cronJobs.length > 0 ? '1fr 1fr' : '1fr', gap: 16 }}>
        {/* Agents */}
        {agents.length > 0 && (
          <div>
            <div style={{ fontSize: 11, color: c.muted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 8 }}>
              Agents
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {agents.map(agent => {
                const state = stateMap[agent.name];
                const status = state?.state?.status ?? 'idle';
                const color = statusColor(status);
                const activeSubagents = subagents.filter(sa => sa.parent_agent === agent.name);
                return (
                  <div key={agent.name}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, flexShrink: 0 }} />
                      <span style={{ fontSize: 13, color: c.text }}>{agent.name}</span>
                      <span style={{ fontSize: 11, color: c.muted, marginLeft: 'auto' }}>{relativeTime(agent.last_seen)}</span>
                    </div>
                    {state?.state?.current_task && (
                      <div style={{ fontSize: 11, color: c.muted, marginLeft: 12, marginTop: 2 }}>
                        {state.state.current_task.length > 60 ? state.state.current_task.slice(0, 60) + '…' : state.state.current_task}
                      </div>
                    )}
                    {activeSubagents.map((sa, i) => (
                      <div key={i} style={{ fontSize: 11, color: c.muted, marginLeft: 16, marginTop: 2 }}>
                        └─ {sa.name}{sa.task ? `: ${sa.task.slice(0, 40)}` : ''}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Cron Jobs */}
        {cronJobs.length > 0 && (
          <div>
            <div style={{ fontSize: 11, color: c.muted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 8 }}>
              Cron Jobs
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {cronJobs.map(job => {
                const color = statusColor(job.last_status);
                return (
                  <div key={job.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, flexShrink: 0, marginTop: 3 }} />
                    <div>
                      <div style={{ fontSize: 12, color: c.text }}>{job.name}</div>
                      <div style={{ fontSize: 11, color: c.muted }}>{job.agent_name} · {relativeTime(job.last_run)}</div>
                    </div>
                    <span style={{ ...s.badge(color), marginLeft: 'auto', fontSize: 10 }}>{job.last_status}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
