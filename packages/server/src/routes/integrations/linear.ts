import type { FastifyPluginCallback } from 'fastify';
import type { LinearIssue, LinearSubtask } from '@dashboard/shared';
import * as linear from '../../integrations/linear.js';
import type { LinearIssue as UpstreamLinearIssue } from '../../integrations/types/linear.js';
import { runIntegration } from './shared.js';

const isReviewStatus = (status: string): boolean => /review/i.test(status);

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
      fn: async () => (await linear.getUnassignedTestingIssues()).map(mapLinearIssue),
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
