import { useState, useEffect, useCallback } from 'react';
import { fetchDashboardData } from './api';
import type { DashboardData } from './types';
import { ProjectGrid } from './components/ProjectGrid';
import { ProjectDetail } from './components/ProjectDetail';
import { UnknownCard } from './components/UnknownCard';
import { s, relativeTime } from './styles';

export default function App() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await fetchDashboardData();
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
        <ProjectGrid projects={d.projects} onSelect={setSelectedProjectId} />
      </section>

      <UnknownCard
        agents={d.agents}
        agentStates={d.agentStates}
        cronJobs={d.cronJobs}
        subagents={d.subagents}
        unlinked={d.unlinked}
      />
    </div>
  );
}
