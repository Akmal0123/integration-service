import { buildApp } from './app.js';
import { envConfig } from './config/env.js';

const start = async () => {
  try {
    const app = await buildApp();
    await app.listen({ port: envConfig.port, host: envConfig.host });

    console.log(`\n======================================================`);
    console.log(`🚀 Fastify Integration Service (TypeScript)`);
    console.log(`📡 URL: http://${envConfig.host === '0.0.0.0' ? 'localhost' : envConfig.host}:${envConfig.port}`);
    console.log(`🔗 Upstream EIS: ${envConfig.eis.baseUrl}`);
    console.log(`🔐 Boundary 1 (AMS -> Fastify): JWT A verified (iss: ${envConfig.jwtA.issuer})`);
    console.log(`🔐 Boundary 2 (Fastify -> EIS): JWT B signed (iss: ${envConfig.jwtB.issuer}, aud: ${envConfig.jwtB.audience})`);
    console.log(`======================================================\n`);
  } catch (err) {
    console.error('Failed to start Fastify server:', err);
    process.exit(1);
  }
};

start();
