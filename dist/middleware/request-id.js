import crypto from 'crypto';
/**
 * Ensures every incoming request has a unique request_id.
 * If client provides 'x-request-id', use it; otherwise generate a new one.
 */
export async function requestIdMiddleware(request, reply) {
    const incomingId = request.headers['x-request-id'];
    const reqId = typeof incomingId === 'string' && incomingId.trim().length > 0
        ? incomingId.trim()
        : `req_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    request.requestId = reqId;
    reply.header('x-request-id', reqId);
}
