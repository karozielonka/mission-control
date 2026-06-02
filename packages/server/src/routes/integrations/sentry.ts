import type { FastifyPluginCallback } from 'fastify';
import type { SentryIssue, SentryLevel } from '@dashboard/shared';
import * as sentry from '../../integrations/sentry.js';
import { runIntegration } from './shared.js';

const SLUG_RE = /^[a-z0-9_-]+$/i;

export const sentryRoutes: FastifyPluginCallback = (fastify, _opts, done) => {
  fastify.get('/api/integrations/sentry/issues', async (request, reply) => {
    const { project, environment } = request.query as { project?: string; environment?: string };
    if (project && !SLUG_RE.test(project)) {
      return reply.status(400).send({ error: 'Invalid project format' });
    }
    if (environment && !SLUG_RE.test(environment)) {
      return reply.status(400).send({ error: 'Invalid environment format' });
    }
    return runIntegration({
      fastify,
      reply,
      integration: 'Sentry',
      configured: sentry.isSentryConfigured(),
      notConfiguredValue: [],
      fn: async (): Promise<SentryIssue[]> => {
        const issues = await sentry.getRecentIssues(project, environment);
        return issues.map((issue) => ({
          id: issue.id,
          title: issue.title,
          culprit: issue.culprit,
          count: parseInt(issue.count, 10) || 0,
          first_seen: issue.firstSeen,
          last_seen: issue.lastSeen,
          level: issue.level as SentryLevel,
          url: issue.permalink,
        }));
      },
    });
  });

  done();
};
