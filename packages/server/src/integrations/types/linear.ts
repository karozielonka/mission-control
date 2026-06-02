export interface LinearUser {
  id: string;
  name: string;
  email?: string;
}

export interface LinearState {
  name: string;
  type: string;
}

export interface LinearChild {
  id: string;
  identifier: string;
  title: string;
  state: LinearState;
}

export interface LinearIssue {
  id: string;
  identifier: string;
  title: string;
  description: string | null;
  url: string;
  estimate: number | null;
  priority: number;
  priorityLabel: string;
  state: LinearState;
  assignee: LinearUser | null;
  labels: { nodes: Array<{ name: string }> };
  children: { nodes: LinearChild[] };
}

export interface LinearAttachment {
  id: string;
  url: string;
  title: string;
}

export interface LinearHistoryEntry {
  createdAt: string;
  fromState: { name: string } | null;
  toState: { name: string } | null;
}
