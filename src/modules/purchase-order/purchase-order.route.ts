import { FastifyInstance } from 'fastify';
import { PurchaseOrderController } from './purchase-order.controller.js';
import { requireScope } from '../../middleware/authentication.js';
import { getPurchaseOrderSchema, listPurchaseOrdersSchema } from './purchase-order.schema.js';

export default async function purchaseOrderRoutes(fastify: FastifyInstance) {
  const scopeAuth = requireScope('integration:purchase-order:read');

  // Strict API v1 Routes (isolated-integration-service-architecture.md Section 19)
  fastify.get(
    '/api/v1/integration/purchase-orders/:number',
    { preHandler: [scopeAuth], schema: getPurchaseOrderSchema },
    PurchaseOrderController.getOne
  );

  fastify.get(
    '/api/v1/integration/purchase-orders',
    { preHandler: [scopeAuth], schema: listPurchaseOrdersSchema },
    PurchaseOrderController.getList
  );

  fastify.get(
    '/api/v1/integration/purchase-orders/lookup',
    { preHandler: [scopeAuth] },
    PurchaseOrderController.lookup
  );

  fastify.get(
    '/api/v1/integration/purchase-orders/:id/pdf',
    { preHandler: [scopeAuth] },
    PurchaseOrderController.getPdf
  );

  // Backward compatibility aliases
  fastify.get(
    '/api/integration/purchase-orders/:number',
    { preHandler: [scopeAuth] },
    PurchaseOrderController.getOne
  );

  fastify.get(
    '/api/integration/purchase-orders/lookup',
    { preHandler: [scopeAuth] },
    PurchaseOrderController.lookup
  );

  fastify.get(
    '/api/integration/purchase-orders/:id/pdf',
    { preHandler: [scopeAuth] },
    PurchaseOrderController.getPdf
  );
}
