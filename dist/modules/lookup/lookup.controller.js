import { LookupService } from './lookup.service.js';
export class LookupController {
    static async lookup(request, reply) {
        const { q } = (request.query || {});
        const results = await LookupService.lookupAll(q || '', request.requestId);
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
    static async getDocument(request, reply) {
        const { keyword } = (request.params || {});
        const transformed = await LookupService.getDocumentByKeyword(keyword, request.requestId);
        if (!transformed) {
            return reply.status(404).send({
                success: false,
                error: {
                    code: 'DOCUMENT_NOT_FOUND',
                    message: `Dokumen dengan nomor/kode '${keyword}' tidak ditemukan di sistem inventaris eksternal`,
                },
                request_id: request.requestId,
            });
        }
        return reply.send({
            success: true,
            message: 'Dokumen berhasil diambil dan ditransformasikan untuk AMS',
            data: transformed,
            meta: {
                source: 'eis',
                request_id: request.requestId,
            },
        });
    }
}
