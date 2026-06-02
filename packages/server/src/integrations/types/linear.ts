export interface LinearUser {
  id: string;
  name: string;
}

export interface LinearState {
  name: string;
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
  url: string;
  estimate: number | null;
  priorityLabel: string;
  state: LinearState;
  assignee: LinearUser | null;
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
