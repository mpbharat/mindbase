import type { Agent, AgentState, CronJob, DashboardData, ProjectDetail, ProjectSummary, Subagent } from './types';

const isDev = import.meta.env.DEV;
const BASE = isDev ? import.meta.env.VITE_BRAIN_URL as string : '/api';

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
