import type { CronJob } from '../types';
import { s, statusColor, relativeTime } from '../styles';

export function CronTable({ jobs }: { jobs: CronJob[] }) {
  if (jobs.length === 0) {
    return <div style={{ ...s.card, ...s.empty }}>No cron jobs recorded yet.</div>;
  }

  return (
    <div style={s.card}>
      <table style={s.table}>
        <thead>
          <tr>
            <th style={s.th}>Name</th>
            <th style={s.th}>Agent</th>
            <th style={s.th}>Schedule</th>
            <th style={s.th}>Last Run</th>
            <th style={s.th}>Status</th>
          </tr>
        </thead>
        <tbody>
          {jobs.map(job => (
            <tr key={job.id}>
              <td style={s.td}>{job.name}</td>
              <td style={{ ...s.td, color: s.colors.muted }}>{job.agent_name}</td>
              <td style={{ ...s.td, color: s.colors.muted, fontFamily: 'monospace' }}>{job.schedule}</td>
              <td style={{ ...s.td, color: s.colors.muted }}>{relativeTime(job.last_run)}</td>
              <td style={s.td}>
                <span style={s.badge(statusColor(job.last_status))}>{job.last_status}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
