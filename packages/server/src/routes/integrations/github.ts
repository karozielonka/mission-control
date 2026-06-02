import type { FastifyPluginCallback } from 'fastify';
import type {
  ChecksState,
  MergeableState,
  PRState,
  PullRequest,
  ReviewRequestedPR,
  ReviewState,
} from '@dashboard/shared';
import * as github from '../../integrations/github.js';
import type { GitHubPullRequest } from '../../integrations/types/github.js';
import { mapWithConcurrency, runIntegration } from './shared.js';

const REPO_RE = /^[a-zA-Z0-9._-]+\/[a-zA-Z0-9._-]+$/;

const ENRICH_CONCURRENCY = 6;

const FAILURE_CHECK_CONCLUSIONS = new Set([
  'failure',
  'cancelled',
  'timed_out',
  'action_required',
  'startup_failure',
]);

async function resolveCheckRunsState(repo: string, sha: string): Promise<ChecksState> {
  try {
    const { check_runs } = await github.getPullRequestChecks(repo, sha);
    if (check_runs.length === 0) return '';
    if (check_runs.some((c) => c.conclusion && FAILURE_CHECK_CONCLUSIONS.has(c.conclusion))) {
      return 'failure';
    }
    if (check_runs.some((c) => c.status !== 'completed')) return 'pending';
    return 'success';
  } catch {
    return '';
  }
}

async function resolveCombinedStatusState(repo: string, sha: string): Promise<ChecksState> {
  try {
    const combined = await github.getCombinedStatus(repo, sha);
    if (combined.statuses.length === 0) return '';
    if (
      combined.state === 'failure' ||
      combined.statuses.some((s) => s.state === 'failure' || s.state === 'error')
    ) {
      return 'failure';
    }
    if (combined.state === 'pending') return 'pending';
    if (combined.state === 'success') return 'success';
    return '';
  } catch {
    return '';
  }
}

function mergeChecksStates(a: ChecksState, b: ChecksState): ChecksState {
  if (a === 'failure' || b === 'failure') return 'failure';
  if (a === 'pending' || b === 'pending') return 'pending';
  if (a === 'success' || b === 'success') return 'success';
  return '';
}

async function resolveReviewState(repo: string, number: number): Promise<ReviewState> {
  try {
    const reviews = await github.getPullRequestReviews(repo, number);
    const lastReviewByUser = new Map<string, string>();
    for (const review of reviews) {
      if (review.state !== 'COMMENTED' && review.state !== 'PENDING') {
        lastReviewByUser.set(review.user.login, review.state);
      }
    }
    const states = [...lastReviewByUser.values()];
    if (states.includes('CHANGES_REQUESTED')) return 'changes_requested';
    if (states.includes('APPROVED')) return 'approved';
    return '';
  } catch {
    return '';
  }
}

// `pr.state` is `string` upstream but the endpoint filter (`state=open` /
// `is:pr is:open`) plus the draft override means we only ever surface these
// four values to the client. Cast at the wire boundary.
function toPRState(pr: { state: string; draft?: boolean }): PRState {
  if (pr.draft) return 'draft';
  return pr.state as PRState;
}

async function enrichPullRequest(repo: string, pr: GitHubPullRequest): Promise<PullRequest> {
  let additions = 0;
  let deletions = 0;
  let mergeable_state: MergeableState = '';
  try {
    const detail = await github.getPullRequest(repo, pr.number);
    additions = detail.additions ?? 0;
    deletions = detail.deletions ?? 0;
    mergeable_state = (detail.mergeable_state as MergeableState) ?? '';
  } catch {
    // fall back to defaults
  }

  const [checkRuns, commitStatus, review_state] = await Promise.all([
    resolveCheckRunsState(repo, pr.head.sha),
    resolveCombinedStatusState(repo, pr.head.sha),
    resolveReviewState(repo, pr.number),
  ]);
  const checks_state = mergeChecksStates(checkRuns, commitStatus);

  return {
    number: pr.number,
    title: pr.title,
    state: toPRState(pr),
    mergeable_state,
    checks_state,
    review_state,
    url: pr.html_url,
    author: pr.user.login,
    additions,
    deletions,
    created_at: pr.created_at,
    repo,
    head_ref: pr.head.ref,
  };
}

export const githubRoutes: FastifyPluginCallback = (fastify, _opts, done) => {
  fastify.get('/api/integrations/github/pulls', async (request, reply) => {
    const { repo } = request.query as { repo?: string };
    if (!repo) {
      return reply.status(400).send({ error: 'Missing required query parameter: repo' });
    }
    if (!REPO_RE.test(repo)) {
      return reply.status(400).send({ error: 'Invalid repo format' });
    }
    return runIntegration({
      fastify,
      reply,
      integration: 'GitHub',
      configured: github.isGitHubConfigured(),
      notConfiguredValue: [],
      logContext: { repo },
      fn: async () => {
        const prs = await github.getMyPullRequests(repo);
        return mapWithConcurrency(prs, ENRICH_CONCURRENCY, (pr) => enrichPullRequest(repo, pr));
      },
    });
  });

  fastify.get('/api/integrations/github/review-requested', async (_request, reply) =>
    runIntegration({
      fastify,
      reply,
      integration: 'GitHub',
      configured: github.isGitHubConfigured(),
      notConfiguredValue: [],
      fn: async (): Promise<ReviewRequestedPR[]> => {
        const items = await github.getReviewRequestedPullRequests();
        return items.map((item) => {
          const repoMatch = item.repository_url.match(/\/repos\/([^/]+\/[^/]+)$/);
          return {
            number: item.number,
            title: item.title,
            state: toPRState(item),
            url: item.html_url,
            author: item.user.login,
            repo: repoMatch ? repoMatch[1] : '',
            created_at: item.created_at,
            updated_at: item.updated_at,
          };
        });
      },
    }),
  );

  done();
};
