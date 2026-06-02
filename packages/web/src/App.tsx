import { useEffect } from "react";
import { HomeView } from "@/components/home/home-view";
import { useContextStore } from "@/stores/context-store";
import { initTheme } from "@/lib/theme";
import { REPOS, DEFAULT_SENTRY_ENV } from "@/config";

initTheme();

function App() {
  const fetchMyLinearIssues = useContextStore(({fetchMyLinearIssues}) => fetchMyLinearIssues);
  const fetchCyclePickupCandidates = useContextStore(({fetchCyclePickupCandidates}) => fetchCyclePickupCandidates);
  const fetchUnassignedTestingIssues = useContextStore(({fetchUnassignedTestingIssues}) => fetchUnassignedTestingIssues);
  const fetchPullRequests = useContextStore(({fetchPullRequests}) => fetchPullRequests);
  const fetchReviewRequestedPRs = useContextStore(({fetchReviewRequestedPRs}) => fetchReviewRequestedPRs);
  const fetchSentryIssues = useContextStore(({fetchSentryIssues}) => fetchSentryIssues);

  useEffect(() => {
    fetchMyLinearIssues();
    fetchCyclePickupCandidates();
    fetchUnassignedTestingIssues();
    fetchPullRequests([...REPOS]);
    fetchReviewRequestedPRs();
    fetchSentryIssues(DEFAULT_SENTRY_ENV);
  }, [
    fetchMyLinearIssues,
    fetchCyclePickupCandidates,
    fetchUnassignedTestingIssues,
    fetchPullRequests,
    fetchReviewRequestedPRs,
    fetchSentryIssues,
  ]);

  return <HomeView />;
}

export default App;
