import { EisClient } from '../../clients/eis-client.js';
import { transformPurchaseOrder } from '../../transformers/purchase-order.transformer.js';

export class PurchaseOrderService {
  static async getByNumberOrId(numberOrId: string, requestId?: string) {
    const raw = await EisClient.getPurchaseOrder(numberOrId, requestId);
    const data = raw?.data || raw;

    if (!data) {
      throw new Error(`Purchase Order '${numberOrId}' not found`);
    }

    return transformPurchaseOrder(data);
  }

  static async list(query: string = '', requestId?: string) {
    const raw = await EisClient.listPurchaseOrders(query, requestId);
    const list = raw?.data || [];
    return Array.isArray(list) ? list.map(transformPurchaseOrder) : [];
  }

  static async lookup(query: string = '', requestId?: string) {
    return await EisClient.lookupPurchaseOrders(query, requestId);
  }

  static async getPdf(idOrNumber: string, requestId?: string) {
    return await EisClient.getPurchaseOrderPdf(idOrNumber, requestId);
  }
}
