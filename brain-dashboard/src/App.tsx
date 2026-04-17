import { useState, useEffect, useCallback } from 'react';
import { fetchBrainData } from './api';
import type { BrainData } from './types';
import { AgentCard } from './components/AgentCard';
import { CronTable } from './components/CronTable';
import { TaskList } from './components/TaskList';
import { ProjectGrid } from './components/ProjectGrid';
import { ProjectDetail } from './components/ProjectDetail';
import { MemoryFeed } from './components/MemoryFeed';
import { SessionLog } from './components/SessionLog';
import { s, relativeTime } from './styles';

const c = s.colors;

export default function App() {
  const [data, setData] = useState<BrainData | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await fetchBrainData();
      setData(d);
      setLastUpdated(new Date());
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 60_000);
    return () => clearInterval(interval);
  }, [load]);

  // Project detail view
  if (selectedProjectId !== null) {
    return (
      <ProjectDetail
        projectId={selectedProjectId}
        onBack={() => setSelectedProjectId(null)}
      />
    );
  }

  if (!data && !error) {
    return <div style={s.loading}>Loading brain…</div>;
  }

  if (error && !data) {
    return <div style={{ ...s.loading, color: '#f87171' }}>Error: {error}</div>;
  }

  const d = data!;

  // Split memories: linked to a project vs. general
  const linkedMemories = d.memories.filter(m => m.project_id !== null);
  const generalMemories = d.memories.filter(m => m.project_id === null);

  return (
    <div style={s.root}>
      <header style={s.header}>
        <h1 style={s.title}>brain</h1>
        <div style={s.meta}>
          {lastUpdated && <span>Updated {relativeTime(lastUpdated.toISOString())}</span>}
          {loading && <span>↻</span>}
          <button style={s.refreshBtn} onClick={load}>↻ Refresh</button>
        </div>
      </header>

      <section style={s.section}>
        <h2 style={s.sectionTitle}>Agents</h2>
        {d.agents.length === 0
          ? <div style={{ color: s.colors.muted, fontSize: '13px', fontStyle: 'italic' }}>No agents have connected yet.</div>
          : <div style={s.grid}>
              {d.agents.map(agent => (
                <AgentCard
                  key={agent.name}
                  agent={agent}
                  state={d.agentStates.find(st => st.agent_name === agent.name)}
                  subagents={d.subagents.filter(sa => sa.parent_agent === agent.name && sa.status === 'running')}
                />
              ))}
            </div>
        }
      </section>

      <section style={s.section}>
        <h2 style={s.sectionTitle}>Cron Jobs</h2>
        <CronTable jobs={d.cronJobs} />
      </section>

      <section style={s.section}>
        <h2 style={s.sectionTitle}>Active Tasks</h2>
        <TaskList tasks={d.tasks} />
      </section>

      <section style={s.section}>
        <h2 style={s.sectionTitle}>Projects</h2>
        <p style={{ color: c.muted, fontSize: 12, marginBottom: 12 }}>Click any project to see memories, sessions, and tasks.</p>
        <ProjectGrid projects={d.projects} onSelect={setSelectedProjectId} />
      </section>

      <section style={s.section}>
        <h2 style={s.sectionTitle}>Recent Memories</h2>
        {linkedMemories.length > 0 && (
          <p style={{ color: c.muted, fontSize: 12, marginBottom: 10 }}>
            {linkedMemories.length} linked to projects · {generalMemories.length} general
          </p>
        )}
        <MemoryFeed memories={d.memories} projects={d.projects} />
      </section>

      <section style={s.section}>
        <h2 style={s.sectionTitle}>Recent Sessions</h2>
        <SessionLog sessions={d.sessions} />
      </section>
    </div>
  );
}
