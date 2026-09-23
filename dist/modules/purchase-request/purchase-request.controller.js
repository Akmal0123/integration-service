import { PurchaseRequestService } from './purchase-request.service.js';
export class PurchaseRequestController {
    static async getOne(request, reply) {
        const { number } = (request.params || {});
        const transformed = await PurchaseRequestService.getByNumberOrId(number, request.requestId);
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
        const results = await PurchaseRequestService.list(q || '', request.requestId);
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
        const results = await PurchaseRequestService.lookup(q || '', request.requestId);
        return reply.send({
            success: true,
            data: results,
            meta: {
                source: 'eis',
                request_id: request.requestId,
            },
        });
    }
}
