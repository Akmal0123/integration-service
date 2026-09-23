import { EisClient } from '../../clients/eis-client.js';
import { transformPurchaseRequest } from '../../transformers/purchase-request.transformer.js';

export class PurchaseRequestService {
  static async getByNumberOrId(numberOrId: string, requestId?: string) {
    const raw = await EisClient.getPurchaseRequest(numberOrId, requestId);
    const data = raw?.data || raw;

    if (!data) {
      throw new Error(`Purchase Request '${numberOrId}' not found`);
    }

    return transformPurchaseRequest(data);
  }

  static async list(query: string = '', requestId?: string) {
    const raw = await EisClient.listPurchaseRequests(query, requestId);
    const list = raw?.data || [];
    return Array.isArray(list) ? list.map(transformPurchaseRequest) : [];
  }

  static async lookup(query: string = '', requestId?: string) {
    return await EisClient.lookupPurchaseRequests(query, requestId);
  }
}
