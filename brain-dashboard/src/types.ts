export interface Project {
  id: number;
  name: string;
  description: string | null;
  status: string;
  parent_id: number | null;
  updated_at: string;
}

export interface ProjectSummary extends Project {
  memory_count: number;
  task_count: number;
  last_session_summary: string | null;
  last_session_agent: string | null;
  last_session_at: string | null;
}

export interface Memory {
  id: number;
  content: string;
  category: string;
  importance: number;
  agent_name: string | null;
  project_id: number | null;
  created_at: string;
}

export interface AgentTask {
  id: number;
  title: string;
  status: string;
  priority: number;
  agent_name: string | null;
  project_id: number | null;
  created_at: string;
}

export interface Agent {
  id: number;
  name: string;
  agent_type: string;
  last_seen: string | null;
}

export interface AgentState {
  agent_name: string;
  state: {
    status?: string;
    current_task?: string;
    previous_task?: string;
    next_task?: string;
  };
  updated_at: string;
}

export interface Session {
  id: number;
  agent_name: string;
  summary: string | null;
  project_id: number | null;
  created_at: string;
}

export interface CronJob {
  id: number;
  name: string;
  agent_name: string;
  schedule: string;
  last_run: string | null;
  last_status: string;
  last_error: string | null;
}

export interface Subagent {
  id: number;
  parent_agent: string;
  name: string;
  task: string | null;
  status: string;
  started_at: string;
  completed_at: string | null;
}

export interface ProjectDetail {
  project: Project;
  children: Project[];
  memories: Memory[];
  sessions: Session[];
  tasks: AgentTask[];
}

export interface DashboardData {
  projects: ProjectSummary[];
  agents: Agent[];
  agentStates: AgentState[];
  cronJobs: CronJob[];
  subagents: Subagent[];
  unlinked: { memory_count: number; task_count: number };
}

export interface BrainData {
  projects: Project[];
  memories: Memory[];
  tasks: AgentTask[];
  agents: Agent[];
  agentStates: AgentState[];
  sessions: Session[];
  cronJobs: CronJob[];
  subagents: Subagent[];
}
