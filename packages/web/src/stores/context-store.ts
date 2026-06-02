import { create } from "zustand";
import type { LinearIssue, PullRequest, ReviewRequestedPR, SentryIssue } from "@/lib/api";
import * as api from "@/lib/api";

interface ContextState {
  myLinearIssues: LinearIssue[];
  cyclePickupCandidates: LinearIssue[];
  unassignedTestingIssues: LinearIssue[];
  pullRequests: PullRequest[];
  reviewRequestedPRs: ReviewRequestedPR[];
  sentryIssuesByEnv: Record<string, SentryIssue[]>;
  loading: Record<string, boolean>;
  errors: Record<string, string | null>;
  fetchMyLinearIssues: () => Promise<void>;
  fetchCyclePickupCandidates: () => Promise<void>;
  fetchUnassignedTestingIssues: () => Promise<void>;
  fetchPullRequests: (repos: string[]) => Promise<void>;
  fetchReviewRequestedPRs: () => Promise<void>;
  fetchSentryIssues: (environment: string) => Promise<void>;
  /** Fetch everything in parallel. Used for both initial load and manual refresh
   *  so the two paths can't drift. */
  fetchAll: (repos: string[], sentryEnvs: string[]) => Promise<void>;
}

function describeError(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}

export const useContextStore = create<ContextState>((set, get) => {
  const run = async <T,>(
    key: string,
    fn: () => Promise<T>,
    apply: (state: ContextState, value: T) => Partial<ContextState>,
  ): Promise<void> => {
    set((s) => ({
      loading: { ...s.loading, [key]: true },
      errors: { ...s.errors, [key]: null },
    }));
    try {
      const value = await fn();
      set((s) => ({
        ...apply(s, value),
        loading: { ...s.loading, [key]: false },
      }));
    } catch (err) {
      console.error(`[context-store] ${key} failed`, err);
      set((s) => ({
        loading: { ...s.loading, [key]: false },
        errors: { ...s.errors, [key]: describeError(err) },
      }));
    }
  };

  return {
    myLinearIssues: [],
    cyclePickupCandidates: [],
    unassignedTestingIssues: [],
    pullRequests: [],
    reviewRequestedPRs: [],
    sentryIssuesByEnv: {},
    loading: {},
    errors: {},

    fetchMyLinearIssues: () =>
      run("myLinearIssues", api.getMyLinearIssues, (_, myLinearIssues) => ({ myLinearIssues })),

    fetchPullRequests: (repos: string[]) =>
      run(
        "pullRequests",
        async () => (await Promise.all(repos.map((repo) => api.getMyPullRequests(repo)))).flat(),
        (_, pullRequests) => ({ pullRequests }),
      ),

    fetchCyclePickupCandidates: () =>
      run("cyclePickupCandidates", api.getCyclePickupCandidates, (_, cyclePickupCandidates) => ({
        cyclePickupCandidates,
      })),

    fetchUnassignedTestingIssues: () =>
      run(
        "unassignedTestingIssues",
        api.getUnassignedTestingIssues,
        (_, unassignedTestingIssues) => ({ unassignedTestingIssues }),
      ),

    fetchReviewRequestedPRs: () =>
      run("reviewRequestedPRs", api.getReviewRequestedPRs, (_, reviewRequestedPRs) => ({
        reviewRequestedPRs,
      })),

    fetchSentryIssues: (environment: string) =>
      run(
        `sentryIssues_${environment}`,
        () => api.getSentryIssues(environment),
        (s, issues) => ({
          sentryIssuesByEnv: { ...s.sentryIssuesByEnv, [environment]: issues },
        }),
      ),

    fetchAll: async (repos: string[], sentryEnvs: string[]) => {
      const s = get();
      await Promise.all([
        s.fetchMyLinearIssues(),
        s.fetchCyclePickupCandidates(),
        s.fetchUnassignedTestingIssues(),
        s.fetchPullRequests(repos),
        s.fetchReviewRequestedPRs(),
        ...sentryEnvs.map((env) => s.fetchSentryIssues(env)),
      ]);
    },
  };
});
