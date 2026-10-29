import type { FastifyPluginCallback } from 'fastify';
import type { LinearIssue, LinearSubtask } from '@dashboard/shared';
import * as linear from '../../integrations/linear.js';
import * as github from '../../integrations/github.js';
import type { LinearIssue as UpstreamLinearIssue } from '../../integrations/types/linear.js';
import { mapWithConcurrency, runIntegration } from './shared.js';

const isReviewStatus = (status: string): boolean => /\breview\b/i.test(status);

function mapLinearIssue(issue: UpstreamLinearIssue): LinearIssue {
  const subtasks: LinearSubtask[] = issue.children.nodes.map((child) => ({
    key: child.identifier,
    summary: child.title,
    status: child.state.name,
  }));
  return {
    key: issue.identifier,
    summary: issue.title,
    status: issue.state.name,
    assignee: issue.assignee?.name ?? null,
    issue_type: 'Issue',
    story_points: issue.estimate ?? null,
    priority: issue.priorityLabel || 'None',
    url: issue.url,
    subtasks,
  };
}

async function enrichReviewMetadata(issue: UpstreamLinearIssue): Promise<LinearIssue> {
  const base = mapLinearIssue(issue);
  if (!isReviewStatus(base.status)) return base;

  const [attachmentsResult, historyResult] = await Promise.allSettled([
    linear.getAttachments(issue.id),
    linear.getIssueHistory(issue.id),
  ]);

  let pr_url: string | undefined;
  if (attachmentsResult.status === 'fulfilled') {
    const prAttachment = attachmentsResult.value.find(
      (a) => a.url.includes('github.com') && a.url.includes('/pull/'),
    );
    if (prAttachment) pr_url = prAttachment.url;
  }

  let status_changed_at: string | undefined;
  if (historyResult.status === 'fulfilled') {
    const lastTransition = historyResult.value
      .filter((entry) => entry.toState && isReviewStatus(entry.toState.name))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
    if (lastTransition) status_changed_at = lastTransition.createdAt;
  }

  return { ...base, pr_url, status_changed_at };
}

const PR_URL_RE = /^https:\/\/github\.com\/([^/]+\/[^/]+)\/pull\/(\d+)/;
const INVOLVEMENT_CONCURRENCY = 5;

async function wasInvolvedInLinear(issueId: string, viewerId: string): Promise<boolean> {
  const history = await linear.getIssueHistory(issueId);
  return history.some(
    (entry) =>
      entry.fromAssignee?.id === viewerId ||
      entry.toAssignee?.id === viewerId ||
      (entry.actor?.id === viewerId && (entry.fromState || entry.toState)),
  );
}

async function wasInvolvedInPullRequests(issueId: string, login: string): Promise<boolean> {
  const attachments = await linear.getAttachments(issueId);
  const prs = attachments
    .map((a) => a.url.match(PR_URL_RE))
    .filter((m): m is RegExpMatchArray => m !== null);

  const results = await Promise.all(
    prs.map(async ([, repo, number]) => {
      const [pr, reviews] = await Promise.all([
        github.getPullRequest(repo, Number(number)),
        github.getPullRequestReviews(repo, Number(number)),
      ]);
      return pr.user.login === login || reviews.some((r) => r.user.login === login);
    }),
  );
  return results.some(Boolean);
}

async function isPickable(
  issue: UpstreamLinearIssue,
  viewerId: string,
  githubLogin: string | null,
): Promise<boolean> {
  try {
    if (await wasInvolvedInLinear(issue.id, viewerId)) return false;
    if (githubLogin && (await wasInvolvedInPullRequests(issue.id, githubLogin))) return false;
    return true;
  } catch {
    return true;
  }
}

export const linearRoutes: FastifyPluginCallback = (fastify, _opts, done) => {
  fastify.get('/api/integrations/linear/cycle-pickup-candidates', async (_request, reply) =>
    runIntegration({
      fastify,
      reply,
      integration: 'Linear',
      configured: linear.isLinearConfigured(),
      notConfiguredValue: [],
      fn: async () => {
        const issues = await linear.getCyclePickupCandidates();
        return issues
          .filter((issue) => !/blocked/i.test(issue.state.name))
          .map(mapLinearIssue);
      },
    }),
  );

  fastify.get('/api/integrations/linear/unassigned-testing', async (_request, reply) =>
    runIntegration({
      fastify,
      reply,
      integration: 'Linear',
      configured: linear.isLinearConfigured(),
      notConfiguredValue: [],
      fn: async () => {
        const issues = await linear.getUnassignedTestingIssues();
        const [viewerId, githubLogin] = await Promise.all([
          linear.getViewerId(),
          github.isGitHubConfigured()
            ? github.getCurrentUser().then((u) => u.login).catch(() => null)
            : null,
        ]);
        const pickable = await mapWithConcurrency(issues, INVOLVEMENT_CONCURRENCY, (issue) =>
          isPickable(issue, viewerId, githubLogin),
        );
        return issues.filter((_, i) => pickable[i]).map(mapLinearIssue);
      },
    }),
  );

  fastify.get('/api/integrations/linear/my-issues', async (_request, reply) =>
    runIntegration({
      fastify,
      reply,
      integration: 'Linear',
      configured: linear.isLinearConfigured(),
      notConfiguredValue: [],
      fn: async () => Promise.all((await linear.getMyIssues()).map(enrichReviewMetadata)),
    }),
  );

  done();
};
