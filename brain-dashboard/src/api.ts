import type { Agent, AgentState, CronJob, DashboardData, ProjectDetail, ProjectSummary, Session, Subagent } from './types';

const isDev = import.meta.env.DEV;
const BASE = isDev ? import.meta.env.VITE_BRAIN_URL as string : '/api';

function authHeaders(): HeadersInit {
  return isDev
    ? { 'Authorization': `Bearer ${import.meta.env.VITE_BRAIN_API_KEY as string}`, 'Content-Type': 'application/json' }
    : { 'Content-Type': 'application/json' };
}

async function get<T>(path: string): Promise<T> {
  const headers: HeadersInit = isDev
    ? { 'Authorization': `Bearer ${import.meta.env.VITE_BRAIN_API_KEY as string}` }
    : {};
  const res = await fetch(`${BASE}${path}`, { headers });
  if (!res.ok) throw new Error(`GET ${path} → ${res.status}`);
  return res.json() as Promise<T>;
}

export async function fetchDashboardData(): Promise<DashboardData> {
  const data = await get<{
    projects: ProjectSummary[];
    agents: Agent[];
    agentStates: AgentState[];
    cronJobs: CronJob[];
    subagents: Subagent[];
    unlinked: { memory_count: number; task_count: number };
  }>('/projects/summary');

  return {
    projects: data.projects,
    agents: data.agents ?? [],
    agentStates: data.agentStates ?? [],
    cronJobs: data.cronJobs ?? [],
    subagents: data.subagents ?? [],
    unlinked: data.unlinked ?? { memory_count: 0, task_count: 0 },
  };
}

export async function fetchProjectDetail(id: number): Promise<ProjectDetail> {
  return get<ProjectDetail>(`/project/${id}`);
}

export async function fetchRecentSessions(days: number): Promise<Session[]> {
  const data = await get<{ sessions: Session[] }>(`/sessions?days=${days}&limit=100`);
  return data.sessions;
}

export async function createBacklogItem(item: {
  title: string;
  priority: number;
  type: 'epic' | 'issue';
  parent_id?: number | null;
  project_id?: number | null;
  tags?: string[];
}): Promise<{ id: number }> {
  const res = await fetch(`${BASE}/backlog`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(item),
  });
  if (!res.ok) {
    let msg = `POST /backlog → ${res.status}`;
    try { const b = await res.json() as {error?: string}; if (b.error) msg += `: ${b.error}`; } catch {}
    throw new Error(msg);
  }
  return res.json() as Promise<{ id: number }>;
}

export async function updateBacklogItem(id: number, updates: {
  title?: string;
  status?: string;
  priority?: number;
  type?: string;
  parent_id?: number | null;
}): Promise<void> {
  const res = await fetch(`${BASE}/backlog/${id}`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify(updates),
  });
  if (!res.ok) {
    let msg = `PATCH /backlog/${id} → ${res.status}`;
    try { const b = await res.json() as {error?: string}; if (b.error) msg += `: ${b.error}`; } catch {}
    throw new Error(msg);
  }
}
