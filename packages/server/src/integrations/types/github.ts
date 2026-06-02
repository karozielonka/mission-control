export interface GitHubUser {
  login: string;
  id: number;
  avatar_url: string;
}

export interface GitHubPullRequest {
  id: number;
  number: number;
  title: string;
  state: string;
  html_url: string;
  created_at: string;
  updated_at: string;
  user: GitHubUser;
  head: {
    ref: string;
    sha: string;
  };
  base: {
    ref: string;
  };
  draft: boolean;
  mergeable: boolean | null;
  additions: number;
  deletions: number;
  changed_files: number;
  body: string | null;
}

export interface GitHubCheckRun {
  id: number;
  name: string;
  status: string;
  conclusion: string | null;
  html_url: string;
  started_at: string;
  completed_at: string | null;
  output: {
    title: string | null;
    summary: string | null;
  };
}

export interface GitHubCheckRunsResponse {
  total_count: number;
  check_runs: GitHubCheckRun[];
}

export interface GitHubReview {
  id: number;
  user: GitHubUser;
  // APPROVED, CHANGES_REQUESTED, COMMENTED, DISMISSED, PENDING
  state: string;
}

export interface GitHubCombinedStatus {
  state: 'success' | 'failure' | 'pending' | string;
  statuses: Array<{
    state: 'success' | 'failure' | 'pending' | 'error' | string;
    context: string;
  }>;
}

export interface GitHubSearchIssueItem {
  number: number;
  title: string;
  html_url: string;
  state: string;
  draft?: boolean;
  created_at: string;
  updated_at: string;
  user: GitHubUser;
  repository_url: string;
}
