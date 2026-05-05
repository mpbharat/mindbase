import { useEffect, useState } from 'react';
import { fetchDashboardData } from './api';
import type { DashboardData } from './types';
import { Sidebar } from './components/Sidebar';
import { Overview } from './components/Overview';
import { ProjectDetail } from './components/ProjectDetail';

export default function App() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  function load() {
    fetchDashboardData().then(setData).catch(e => setError(String(e)));
  }

  useEffect(() => { load(); }, []);
  useEffect(() => { const t = setInterval(load, 30_000); return () => clearInterval(t); }, []);

  if (error) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <span style={{ color: 'var(--red)', fontSize: 13 }}>{error}</span>
    </div>
  );

  if (!data) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--muted)', fontSize: 13 }}>
        <span className="pulse" style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--blue)' }} />
        Loading mind…
      </div>
    </div>
  );

  const selectedProject = data.projects.find(p => p.id === selectedId);
  const workingAgents = data.agentStates.filter(a => a.state?.status === 'working');

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--bg)', overflow: 'hidden' }}>
      <Sidebar
        projects={data.projects}
        agentStates={data.agentStates}
        selectedId={selectedId}
        onSelect={setSelectedId}
      />

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
        {/* Top bar */}
        <div style={{
          height: 44, borderBottom: '1px solid var(--border)',
          padding: '0 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          {/* Breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
            {selectedId ? (
              <>
                <button onClick={() => setSelectedId(null)}
                  style={{ color: 'var(--dim)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, padding: 0 }}>
                  Overview
                </button>
                <span style={{ color: 'var(--dim)' }}>›</span>
                <span style={{ color: 'var(--text)', fontWeight: 500 }}>{selectedProject?.name}</span>
              </>
            ) : (
              <span style={{ color: 'var(--muted)', fontWeight: 500 }}>Overview</span>
            )}
          </div>

          {/* Right side */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {workingAgents.map(a => (
              <span key={a.agent_name} className="pill pill-blue" style={{ gap: 6 }}>
                <span className="pulse" style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--blue)' }} />
                {a.agent_name.split(':')[0]}
              </span>
            ))}
            <button onClick={load} title="Refresh"
              style={{ color: 'var(--dim)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, lineHeight: 1, padding: '0 4px' }}>
              ↻
            </button>
          </div>
        </div>

        {selectedId
          ? <ProjectDetail projectId={selectedId} onSelect={setSelectedId} />
          : <Overview data={data} />
        }
      </main>
    </div>
  );
}
