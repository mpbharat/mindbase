import type { Agent, AgentState, AgentTask, BrainData, CronJob, Memory, Project, ProjectDetail, Session, Subagent } from './types';

// In dev: call worker directly using VITE_ env vars from .env.local
// In prod: call /api/* which Pages Function proxies to worker (key never in browser)
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

export async function fetchBrainData(): Promise<BrainData> {
  const [
    { projects },
    { memories },
    { tasks },
    { agents },
    { states },
    { sessions },
    { cron_jobs },
    { subagents },
  ] = await Promise.all([
    get<{ projects: Project[] }>('/projects'),
    get<{ memories: Memory[] }>('/memories?limit=50'),
    get<{ tasks: AgentTask[] }>('/tasks'),
    get<{ agents: Agent[] }>('/agents'),
    get<{ states: AgentState[] }>('/agent-states'),
    get<{ sessions: Session[] }>('/sessions?limit=10'),
    get<{ cron_jobs: CronJob[] }>('/crons'),
    get<{ subagents: Subagent[] }>('/subagents'),
  ]);

  return { projects, memories, tasks, agents, agentStates: states, sessions, cronJobs: cron_jobs, subagents };
}

export async function fetchProjectDetail(id: number): Promise<ProjectDetail> {
  return get<ProjectDetail>(`/project/${id}`);
}
