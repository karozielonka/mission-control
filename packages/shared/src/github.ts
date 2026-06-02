export type PRState = "open" | "closed" | "merged" | "draft";

// GitHub's full set of `mergeable_state` values, plus `""` when the detail
// fetch fails server-side.
export type MergeableState =
  | "clean"
  | "dirty"
  | "unstable"
  | "blocked"
  | "behind"
  | "draft"
  | "has_hooks"
  | "unknown"
  | "";

export type ChecksState = "success" | "failure" | "pending" | "";

export type ReviewState = "approved" | "changes_requested" | "";

export interface PullRequest {
  number: number;
  title: string;
  state: PRState;
  mergeable_state: MergeableState;
  checks_state?: ChecksState;
  review_state: ReviewState;
  url: string;
  author: string;
  additions: number;
  deletions: number;
  created_at: string;
  repo: string;
  head_ref?: string;
}

export interface ReviewRequestedPR {
  number: number;
  title: string;
  state: PRState;
  url: string;
  author: string;
  repo: string;
  created_at: string;
  updated_at: string;
}
