import axios from 'axios';
import { envConfig } from '../config/env.js';
import { generateJwtB } from '../config/jwt.js';
export class EisClient {
    static async request(method, endpoint, scopes, requestId, extraOptions = {}) {
        const token = generateJwtB(scopes);
        const url = `${envConfig.eis.baseUrl.replace(/\/$/, '')}${endpoint}`;
        const headers = {
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
            ...(extraOptions.headers || {}),
        };
        if (requestId) {
            headers['x-request-id'] = requestId;
        }
        return await axios({
            method,
            url,
            headers,
            timeout: envConfig.eis.timeoutMs,
            ...extraOptions,
        });
    }
    // --- Purchase Orders ---
    static async getPurchaseOrder(idOrNumber, requestId) {
        const res = await this.request('GET', `/purchase-orders/${encodeURIComponent(idOrNumber)}`, ['purchase-order:read'], requestId);
        return res.data;
    }
    static async listPurchaseOrders(query = '', requestId) {
        const res = await this.request('GET', `/purchase-orders?q=${encodeURIComponent(query)}`, ['purchase-order:read'], requestId);
        return res.data;
    }
    static async lookupPurchaseOrders(query = '', requestId) {
        const res = await this.request('GET', `/purchase-orders/lookup?q=${encodeURIComponent(query)}`, ['purchase-order:read'], requestId);
        return res.data?.data || [];
    }
    static async getPurchaseOrderPdf(idOrNumber, requestId) {
        return await this.request('GET', `/purchase-orders/${encodeURIComponent(idOrNumber)}/pdf`, ['purchase-order:read'], requestId, { responseType: 'arraybuffer' });
    }
    // --- Purchase Requests ---
    static async getPurchaseRequest(idOrNumber, requestId) {
        const res = await this.request('GET', `/purchase-requests/${encodeURIComponent(idOrNumber)}`, ['purchase-request:read'], requestId);
        return res.data;
    }
    static async listPurchaseRequests(query = '', requestId) {
        const res = await this.request('GET', `/purchase-requests?q=${encodeURIComponent(query)}`, ['purchase-request:read'], requestId);
        return res.data;
    }
    static async lookupPurchaseRequests(query = '', requestId) {
        const res = await this.request('GET', `/purchase-requests/lookup?q=${encodeURIComponent(query)}`, ['purchase-request:read'], requestId);
        return res.data?.data || [];
    }
}
