import type { FastifyPluginCallback } from 'fastify';
import { linearRoutes } from './linear.js';
import { githubRoutes } from './github.js';
import { sentryRoutes } from './sentry.js';

export const integrationsRoutes: FastifyPluginCallback = (fastify, _opts, done) => {
  fastify.register(linearRoutes);
  fastify.register(githubRoutes);
  fastify.register(sentryRoutes);
  done();
};
