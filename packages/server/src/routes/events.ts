import type { OutgoingHttpHeaders } from 'node:http';
import type { FastifyPluginCallback } from 'fastify';
import type { PrAlert } from '@dashboard/shared';
import { getRecentAlerts, prEvents } from '../watch/pr-watcher.js';

const PING_MS = 25_000;

export const eventsRoutes: FastifyPluginCallback = (fastify, _opts, done) => {
  fastify.get('/api/events', (request, reply) => {
    reply.hijack();
    reply.raw.writeHead(200, {
      ...(reply.getHeaders() as OutgoingHttpHeaders),
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });

    const write = (event: string, alerts: PrAlert[]) =>
      reply.raw.write(`event: ${event}\ndata: ${JSON.stringify(alerts)}\n\n`);
    const onAlerts = (alerts: PrAlert[]) => write('alerts', alerts);

    write('recent', getRecentAlerts());
    prEvents.on('alerts', onAlerts);
    const ping = setInterval(() => reply.raw.write(': ping\n\n'), PING_MS);

    request.raw.on('close', () => {
      clearInterval(ping);
      prEvents.off('alerts', onAlerts);
    });
  });

  done();
};
