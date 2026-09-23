import { PurchaseOrderService } from './purchase-order.service.js';
export class PurchaseOrderController {
    static async getOne(request, reply) {
        const { number } = (request.params || {});
        const transformed = await PurchaseOrderService.getByNumberOrId(number, request.requestId);
        return reply.send({
            success: true,
            data: transformed,
            meta: {
                source: 'eis',
                request_id: request.requestId,
            },
        });
    }
    static async getList(request, reply) {
        const { q } = (request.query || {});
        const results = await PurchaseOrderService.list(q || '', request.requestId);
        return reply.send({
            success: true,
            count: results.length,
            data: results,
            meta: {
                source: 'eis',
                request_id: request.requestId,
            },
        });
    }
    static async lookup(request, reply) {
        const { q } = (request.query || {});
        const results = await PurchaseOrderService.lookup(q || '', request.requestId);
        return reply.send({
            success: true,
            data: results,
            meta: {
                source: 'eis',
                request_id: request.requestId,
            },
        });
    }
    static async getPdf(request, reply) {
        const { id } = (request.params || {});
        const res = await PurchaseOrderService.getPdf(id, request.requestId);
        reply.header('content-type', res.headers['content-type'] || 'application/pdf');
        reply.header('content-disposition', `inline; filename="PO_${id}.pdf"`);
        return reply.send(Buffer.from(res.data));
    }
}
