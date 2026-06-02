import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '..', '..', '..', '.env') });

import Fastify from 'fastify';
import cors from '@fastify/cors';
import { integrationsRoutes } from './routes/integrations/index.js';

const PORT = parseInt(process.env.PORT || '4000', 10);

async function main() {
  const fastify = Fastify({
    logger: {
      level: 'info',
    },
  });

  await fastify.register(cors, {
    origin: (origin, cb) => {
      if (!origin || /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
        cb(null, true);
      } else {
        cb(new Error('Not allowed by CORS'), false);
      }
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  fastify.register(integrationsRoutes);

  fastify.get('/api/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

  try {
    await fastify.listen({ port: PORT, host: '127.0.0.1' });
    console.log(`Dashboard server running on http://localhost:${PORT}`);
    console.log(`PLATFORM_DIR: ${process.env.PLATFORM_DIR || '(not set)'}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

main();
