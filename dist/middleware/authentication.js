import { verifyJwtA } from '../config/jwt.js';
/**
 * Authentication hook: validates JWT A from AMS
 */
export async function authenticateAms(request, reply) {
    const authHeader = request.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return reply.status(401).send({
            success: false,
            error: {
                code: 'UNAUTHORIZED',
                message: 'Missing or malformed Authorization Bearer token',
            },
            request_id: request.requestId,
        });
    }
    const token = authHeader.substring(7).trim();
    try {
        const payload = verifyJwtA(token);
        request.jwt = payload;
    }
    catch (err) {
        const isExpired = err.name === 'TokenExpiredError';
        return reply.status(401).send({
            success: false,
            error: {
                code: isExpired ? 'TOKEN_EXPIRED' : 'INVALID_TOKEN',
                message: isExpired ? 'Token has expired' : (err.message || 'Invalid token'),
            },
            request_id: request.requestId,
        });
    }
}
/**
 * Scope verification factory for route-level authorization
 */
export function requireScope(requiredScope) {
    return async function (request, reply) {
        // First ensure authenticated
        if (!request.jwt) {
            await authenticateAms(request, reply);
            if (reply.sent)
                return;
        }
        const rawScope = request.jwt?.scope;
        let scopes = [];
        if (Array.isArray(rawScope)) {
            scopes = rawScope;
        }
        else if (typeof rawScope === 'string') {
            scopes = rawScope.split(/\s+/);
        }
        if (!scopes.includes(requiredScope)) {
            return reply.status(403).send({
                success: false,
                error: {
                    code: 'FORBIDDEN',
                    message: `Forbidden: Insufficient scope. Required: '${requiredScope}'`,
                },
                request_id: request.requestId,
            });
        }
    };
}
