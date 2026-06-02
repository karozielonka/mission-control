import type {
  LinearIssue,
  PullRequest,
  ReviewRequestedPR,
  SentryIssue,
} from "@dashboard/shared";

// Re-export wire-format types so existing consumers can keep importing from
// `@/lib/api`. Source of truth lives in `@dashboard/shared`.
export type {
  ChecksState,
  LinearIssue,
  LinearSubtask,
  MergeableState,
  PRState,
  PullRequest,
  ReviewRequestedPR,
  ReviewState,
  SentryIssue,
  SentryLevel,
} from "@dashboard/shared";

function resolveBaseUrl(): string {
  const url = import.meta.env.VITE_API_URL;
  if (url) return url;
  if (import.meta.env.PROD) {
    throw new Error("VITE_API_URL must be set in production");
  }
  console.warn("[api] VITE_API_URL not set — defaulting to http://localhost:4000");
  return "http://localhost:4000";
}

const BASE_URL = resolveBaseUrl();

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!res.ok) {
    let detail = "";
    try {
      const body = (await res.clone().json()) as { error?: unknown };
      if (typeof body.error === "string") detail = `: ${body.error}`;
    } catch {
      // Body wasn't JSON — status text is the best we can do.
    }
    throw new Error(`API ${res.status} ${res.statusText}${detail}`);
  }

  return res.json() as Promise<T>;
}

// --- Linear ---

export async function getMyLinearIssues(): Promise<LinearIssue[]> {
  return request<LinearIssue[]>("/api/integrations/linear/my-issues");
}

export async function getCyclePickupCandidates(): Promise<LinearIssue[]> {
  return request<LinearIssue[]>("/api/integrations/linear/cycle-pickup-candidates");
}

export async function getUnassignedTestingIssues(): Promise<LinearIssue[]> {
  return request<LinearIssue[]>("/api/integrations/linear/unassigned-testing");
}

// --- GitHub ---

export async function getMyPullRequests(repo: string): Promise<PullRequest[]> {
  return request<PullRequest[]>(
    `/api/integrations/github/pulls?repo=${encodeURIComponent(repo)}`,
  );
}

export async function getReviewRequestedPRs(): Promise<ReviewRequestedPR[]> {
  return request<ReviewRequestedPR[]>("/api/integrations/github/review-requested");
}

// --- Sentry ---

export async function getSentryIssues(environment?: string): Promise<SentryIssue[]> {
  const qs = environment ? `?environment=${encodeURIComponent(environment)}` : "";
  return request<SentryIssue[]>(`/api/integrations/sentry/issues${qs}`);
}
