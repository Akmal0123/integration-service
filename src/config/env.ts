import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export interface Config {
  port: number;
  host: string;
  eis: {
    baseUrl: string;
    timeoutMs: number;
  };
  jwtA: {
    secret: string;
    issuer: string;
    audience: string;
  };
  jwtB: {
    secret: string;
    issuer: string;
    audience: string;
    ttlSeconds: number;
  };
}

export const envConfig: Config = {
  port: parseInt(process.env.PORT || '5000', 10),
  host: process.env.HOST || '0.0.0.0',
  eis: {
    baseUrl: process.env.EIS_BASE_URL || 'http://localhost:9000/api/v1',
    timeoutMs: parseInt(process.env.EIS_TIMEOUT_MS || '10000', 10),
  },
  jwtA: {
    secret: process.env.JWT_A_SECRET || 'ams-fastify-secret-key-super-secure-token-a',
    issuer: process.env.JWT_A_ISSUER || 'ams',
    audience: process.env.JWT_A_AUDIENCE || 'integration-service',
  },
  jwtB: {
    secret: process.env.JWT_B_SECRET || 'fastify-eis-secret-key-super-secure-token-b',
    issuer: process.env.JWT_B_ISSUER || 'integration-service',
    audience: process.env.JWT_B_AUDIENCE || 'eis',
    ttlSeconds: parseInt(process.env.JWT_B_TTL_SECONDS || '900', 10),
  },
};
