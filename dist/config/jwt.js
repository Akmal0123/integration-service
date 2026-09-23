import jwt from 'jsonwebtoken';
import { envConfig } from './env.js';
/**
 * Verify JWT A received from AMS (Boundary 1: AMS -> Fastify)
 */
export function verifyJwtA(token) {
    const decoded = jwt.verify(token, envConfig.jwtA.secret, {
        algorithms: ['HS256'],
        issuer: envConfig.jwtA.issuer,
        audience: envConfig.jwtA.audience,
    });
    return decoded;
}
/**
 * Generate short-lived JWT B for calling EIS (Boundary 2: Fastify -> EIS)
 */
export function generateJwtB(scopes = ['purchase-order:read', 'purchase-request:read']) {
    const now = Math.floor(Date.now() / 1000);
    const payload = {
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
