import { useCallback, useEffect, useState } from "react";
import { useContextStore } from "@/stores/context-store";
import { DEFAULT_SENTRY_ENV, REPOS, SENTRY_ENVS, type SentryEnv } from "@/config";
import { REFRESH_INTERVAL_MS } from "@/lib/constants";
import { Header } from "./sections/header";
import { NextActions } from "./sections/next-actions";
import { SuggestionsPanel } from "./sections/suggestions-panel";
import { NowWorkingOn } from "./sections/now-working-on";
import { PullRequestsPanel } from "./sections/pull-requests-panel";
import { ReviewsPanel } from "./sections/reviews-panel";

export function HomeView() {
  const fetchMyLinearIssues = useContextStore(({fetchMyLinearIssues}) => fetchMyLinearIssues);
  const fetchCyclePickupCandidates = useContextStore(({fetchCyclePickupCandidates}) => fetchCyclePickupCandidates);
  const fetchUnassignedTestingIssues = useContextStore(({fetchUnassignedTestingIssues}) => fetchUnassignedTestingIssues);
  const fetchPullRequests = useContextStore(({fetchPullRequests}) => fetchPullRequests);
  const fetchReviewRequestedPRs = useContextStore(({fetchReviewRequestedPRs}) => fetchReviewRequestedPRs);
  const fetchSentryIssues = useContextStore(({fetchSentryIssues}) => fetchSentryIssues);
  const sentryIssuesByEnv = useContextStore(({sentryIssuesByEnv}) => sentryIssuesByEnv);
  const loading = useContextStore(({loading}) => loading);

  const [sentryEnv, setSentryEnv] = useState<SentryEnv>(DEFAULT_SENTRY_ENV);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [refreshing, setRefreshing] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [, setTick] = useState(0);

  // Force re-render every minute so timeAgo / staleness pills keep updating
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  // Lazy-load sentry data when the user switches environments
  useEffect(() => {
    if (!sentryIssuesByEnv[sentryEnv] && !loading[`sentryIssues_${sentryEnv}`]) {
      fetchSentryIssues(sentryEnv);
    }
  }, [sentryEnv, sentryIssuesByEnv, loading, fetchSentryIssues]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      fetchMyLinearIssues(),
      fetchCyclePickupCandidates(),
      fetchUnassignedTestingIssues(),
      fetchPullRequests([...REPOS]),
      fetchReviewRequestedPRs(),
      ...SENTRY_ENVS.map((env) => fetchSentryIssues(env)),
    ]);
    setLastRefresh(new Date());
    setRefreshing(false);
  }, [
    fetchMyLinearIssues,
    fetchCyclePickupCandidates,
    fetchUnassignedTestingIssues,
    fetchPullRequests,
    fetchReviewRequestedPRs,
    fetchSentryIssues,
  ]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden h-screen bg-background text-foreground">
      <div className="flex-1 flex flex-col px-8 py-4 gap-3 max-w-[1600px] mx-auto w-full min-h-0">
        <Header
          sentryEnv={sentryEnv}
          setSentryEnv={setSentryEnv}
          lastRefresh={lastRefresh}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          onSuggestNext={() => setShowSuggestions(true)}
        />

        <NextActions />

        {showSuggestions && <SuggestionsPanel onClose={() => setShowSuggestions(false)} />}

        <NowWorkingOn />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 flex-1 min-h-0">
          <PullRequestsPanel />
          <ReviewsPanel />
        </div>
      </div>
    </div>
  );
}
