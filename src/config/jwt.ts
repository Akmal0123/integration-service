import jwt from 'jsonwebtoken';
import { envConfig } from './env.js';

export interface JwtAPayload {
  iss: string;
  aud: string;
  sub: string;
  scope: string[] | string;
  iat?: number;
  exp?: number;
}

export interface JwtBPayload {
  iss: string;
  aud: string;
  sub: string;
  scope: string[];
  iat: number;
  exp: number;
}

/**
 * Verify JWT A received from AMS (Boundary 1: AMS -> Fastify)
 */
export function verifyJwtA(token: string): JwtAPayload {
  const decoded = jwt.verify(token, envConfig.jwtA.secret, {
    algorithms: ['HS256'],
    issuer: envConfig.jwtA.issuer,
    audience: envConfig.jwtA.audience,
  }) as JwtAPayload;

  return decoded;
}

/**
 * Generate short-lived JWT B for calling EIS (Boundary 2: Fastify -> EIS)
 */
export function generateJwtB(scopes: string[] = ['purchase-order:read', 'purchase-request:read']): string {
  const now = Math.floor(Date.now() / 1000);
  const payload: JwtBPayload = {
    iss: envConfig.jwtB.issuer,
    aud: envConfig.jwtB.audience,
    sub: 'integration-service',
    scope: scopes,
    iat: now,
    exp: now + envConfig.jwtB.ttlSeconds,
  };

  return jwt.sign(payload, envConfig.jwtB.secret, {
    algorithm: 'HS256',
  });
}
