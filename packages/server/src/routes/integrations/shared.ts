import type { FastifyInstance, FastifyReply } from 'fastify';

export type IntegrationName = 'Linear' | 'GitHub' | 'Sentry';

interface RunOptions<T> {
  fastify: FastifyInstance;
  reply: FastifyReply;
  integration: IntegrationName;
  configured: boolean;
  notConfiguredValue: unknown;
  logContext?: Record<string, unknown>;
  fn: () => Promise<T>;
}

/**
 * Wraps an integration route handler with the shared "configured guard +
 * try/catch + standard 502 response" boilerplate.
 *
 * - If the integration isn't configured (no API key etc.), responds with
 *   `notConfiguredValue` and a 200. Lets the UI render an empty state without
 *   surfacing an error.
 * - If the handler throws, logs the error with optional context and replies
 *   `502 { error: "Failed to fetch from <integration>" }`.
 */
export async function runIntegration<T>({
  fastify,
  reply,
  integration,
  configured,
  notConfiguredValue,
  logContext,
  fn,
}: RunOptions<T>) {
  if (!configured) {
    return reply.send(notConfiguredValue);
  }
  try {
    const result = await fn();
    return reply.send(result);
  } catch (err) {
    fastify.log.error({ err, ...(logContext ?? {}) }, `${integration} fetch error`);
    return reply.status(502).send({ error: `Failed to fetch from ${integration}` });
  }
}
