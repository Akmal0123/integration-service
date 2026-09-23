import { FastifyReply, FastifyRequest } from 'fastify';
import crypto from 'crypto';

declare module 'fastify' {
  interface FastifyRequest {
    requestId: string;
  }
}

/**
 * Ensures every incoming request has a unique request_id.
 * If client provides 'x-request-id', use it; otherwise generate a new one.
 */
export async function requestIdMiddleware(request: FastifyRequest, reply: FastifyReply) {
  const incomingId = request.headers['x-request-id'];
  const reqId = typeof incomingId === 'string' && incomingId.trim().length > 0
    ? incomingId.trim()
    : `req_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

  request.requestId = reqId;
  reply.header('x-request-id', reqId);
}
