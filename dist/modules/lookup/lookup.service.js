import { PurchaseOrderService } from '../purchase-order/purchase-order.service.js';
import { PurchaseRequestService } from '../purchase-request/purchase-request.service.js';
export class LookupService {
    /**
     * Aggregates PO and PR lookup results for unified autocomplete in AMS
     */
    static async lookupAll(query = '', requestId) {
        const [pos, prs] = await Promise.all([
            PurchaseOrderService.lookup(query, requestId).catch(() => []),
            PurchaseRequestService.lookup(query, requestId).catch(() => []),
        ]);
        const unified = [];
        pos.forEach((po) => {
            unified.push({
                id: po.id,
                code: po.po_number,
                number: po.po_number,
                type: 'PO',
                title: `Purchase Order ${po.po_number}`,
                subtitle: po.vendor || 'Vendor',
                status: po.status,
                source: 'eis',
            });
        });
        prs.forEach((pr) => {
            unified.push({
                id: pr.id,
                code: pr.pr_number,
                number: pr.pr_number,
                type: 'PR',
                title: `Purchase Request ${pr.pr_number}`,
                subtitle: `${pr.requester_name || 'Requester'} (${pr.department || 'Dept'})`,
                status: pr.status,
                source: 'eis',
            });
        });
        return unified;
    }
    /**
     * Auto-detect and fetch single document by keyword (PO or PR)
     */
    static async getDocumentByKeyword(keyword, requestId) {
        const clean = keyword.trim();
        const upper = clean.toUpperCase();
        if (upper.startsWith('PR')) {
            try {
                return await PurchaseRequestService.getByNumberOrId(clean, requestId);
            }
            catch (err) {
                // try PO fallback
            }
        }
        if (upper.startsWith('PO')) {
            try {
                return await PurchaseOrderService.getByNumberOrId(clean, requestId);
            }
            catch (err) {
                // try PR fallback
            }
        }
        // Try PO first
        try {
            return await PurchaseOrderService.getByNumberOrId(clean, requestId);
        }
        catch {
            // Try PR
            return await PurchaseRequestService.getByNumberOrId(clean, requestId);
        }
    }
}
