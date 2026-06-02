import type {
  GitHubCheckRunsResponse,
  GitHubCombinedStatus,
  GitHubPullRequest,
  GitHubReview,
  GitHubSearchIssueItem,
  GitHubUser,
} from './types/github.js';

const getToken = () => process.env.GITHUB_PERSONAL_ACCESS_TOKEN || '';

export const isGitHubConfigured = (): boolean => !!process.env.GITHUB_PERSONAL_ACCESS_TOKEN;

async function githubFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = path.startsWith('https://') ? path : `https://api.github.com${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${getToken()}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`GitHub API error ${response.status}: ${body}`);
  }

  return response.json() as Promise<T>;
}

async function getCurrentUser(): Promise<GitHubUser> {
  return githubFetch<GitHubUser>('/user');
}

export async function getMyPullRequests(repo: string): Promise<GitHubPullRequest[]> {
  const currentUser = await getCurrentUser();
  const prs = await githubFetch<GitHubPullRequest[]>(
    `/repos/${repo}/pulls?state=open&per_page=50`
  );
  return prs.filter((pr) => pr.user.login === currentUser.login);
}

export async function getPullRequest(
  repo: string,
  prNumber: number
): Promise<GitHubPullRequest> {
  return githubFetch<GitHubPullRequest>(`/repos/${repo}/pulls/${prNumber}`);
}

export async function getPullRequestReviews(
  repo: string,
  prNumber: number
): Promise<GitHubReview[]> {
  return githubFetch<GitHubReview[]>(`/repos/${repo}/pulls/${prNumber}/reviews`);
}

export async function getPullRequestChecks(
  repo: string,
  ref: string
): Promise<GitHubCheckRunsResponse> {
  return githubFetch<GitHubCheckRunsResponse>(
    `/repos/${repo}/commits/${ref}/check-runs`
  );
}

export async function getCombinedStatus(
  repo: string,
  ref: string
): Promise<GitHubCombinedStatus> {
  return githubFetch<GitHubCombinedStatus>(
    `/repos/${repo}/commits/${ref}/status`
  );
}

interface GitHubSearchResponse {
  total_count: number;
  items: GitHubSearchIssueItem[];
}

export async function getReviewRequestedPullRequests(): Promise<GitHubSearchIssueItem[]> {
  const currentUser = await getCurrentUser();
  const q = `is:pr is:open review-requested:${currentUser.login} -author:${currentUser.login} archived:false`;
  const params = new URLSearchParams({ q, per_page: '50', sort: 'updated', order: 'desc' });
  const result = await githubFetch<GitHubSearchResponse>(`/search/issues?${params.toString()}`);
  return result.items;
}
