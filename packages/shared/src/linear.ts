export interface LinearSubtask {
  key: string;
  summary: string;
  status: string;
}

export interface LinearIssue {
  key: string;
  summary: string;
  status: string;
  issue_type: string;
  assignee: string | null;
  story_points: number | null;
  priority: string;
  url: string;
  subtasks: LinearSubtask[];
  // Only populated for issues in a "review" status (returned by /linear/my-issues).
  pr_url?: string;
  status_changed_at?: string;
}
