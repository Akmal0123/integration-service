import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import { requestIdMiddleware } from './middleware/request-id.js';
import { errorHandler } from './middleware/error-handler.js';
import purchaseOrderRoutes from './modules/purchase-order/purchase-order.route.js';
import purchaseRequestRoutes from './modules/purchase-request/purchase-request.route.js';
import lookupRoutes from './modules/lookup/lookup.route.js';

export async function buildApp(): Promise<FastifyInstance> {
  const fastify = Fastify({
    logger: true,
  });

  // Register Request ID Hook
  fastify.addHook('onRequest', requestIdMiddleware);

  // Centralized Error Handler (must be registered early)
  fastify.setErrorHandler(errorHandler);

  // Custom 404 Route Not Found Handler
  fastify.setNotFoundHandler((request, reply) => {
    reply.status(404).send({
      success: false,
      error: {
        code: 'ROUTE_NOT_FOUND',
        message: `Route ${request.method}:${request.url} not found`,
      },
      request_id: request.requestId,
    });
  });

  // Register CORS
  await fastify.register(cors, {
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    exposedHeaders: ['x-request-id', 'content-disposition'],
  });

  // Health Check Endpoint (Public)
  fastify.get('/health', async (request, reply) => {
    return {
      status: 'ok',
      service: 'Fastify Integration Service',
      version: '2.0.0',
      timestamp: new Date().toISOString(),
      request_id: request.requestId,
    };
  });

  // Register Business Modules
  await fastify.register(purchaseOrderRoutes);
  await fastify.register(purchaseRequestRoutes);
  await fastify.register(lookupRoutes);

  return fastify;
}
