import { FastifyInstance } from 'fastify';
import { LookupController } from './lookup.controller.js';
import { authenticateAms } from '../../middleware/authentication.js';

export default async function lookupRoutes(fastify: FastifyInstance) {
  // Common scope validator for lookup: allows either PO or PR read permission
  const checkLookupAuth = async (request: any, reply: any) => {
    await authenticateAms(request, reply);
    if (reply.sent) return;

    const rawScope = request.jwt?.scope;
    let scopes: string[] = [];

    if (Array.isArray(rawScope)) {
      scopes = rawScope;
    } else if (typeof rawScope === 'string') {
      scopes = rawScope.split(/\s+/);
    }

    const hasAccess = scopes.includes('integration:purchase-order:read') ||
                      scopes.includes('integration:purchase-request:read');

    if (!hasAccess) {
      return reply.status(403).send({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Forbidden: Requires either integration:purchase-order:read or integration:purchase-request:read',
        },
        request_id: request.requestId,
      });
    }
  };

  // Strict API v1 Routes
  fastify.get('/api/v1/integration/lookup', { preHandler: [checkLookupAuth] }, LookupController.lookup);
  fastify.get('/api/v1/integration/document/:keyword', { preHandler: [checkLookupAuth] }, LookupController.getDocument);

  // Backward compatibility aliases
  fastify.get('/api/integration/lookup', { preHandler: [checkLookupAuth] }, LookupController.lookup);
  fastify.get('/api/integration/document/:keyword', { preHandler: [checkLookupAuth] }, LookupController.getDocument);
}
