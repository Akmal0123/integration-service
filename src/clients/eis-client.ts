import axios, { AxiosResponse } from 'axios';
import { envConfig } from '../config/env.js';
import { generateJwtB } from '../config/jwt.js';

export class EisClient {
  private static async request<T = any>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    scopes: string[],
    requestId?: string,
    extraOptions: Record<string, any> = {}
  ): Promise<AxiosResponse<T>> {
    const token = generateJwtB(scopes);
    const url = `${envConfig.eis.baseUrl.replace(/\/$/, '')}${endpoint}`;

    const headers: Record<string, string> = {
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

  static async getPurchaseOrder(idOrNumber: string, requestId?: string) {
    const res = await this.request(
      'GET',
      `/purchase-orders/${encodeURIComponent(idOrNumber)}`,
      ['purchase-order:read'],
      requestId
    );
    return res.data;
  }

  static async listPurchaseOrders(query: string = '', requestId?: string) {
    const res = await this.request(
      'GET',
      `/purchase-orders?q=${encodeURIComponent(query)}`,
      ['purchase-order:read'],
      requestId
    );
    return res.data;
  }

  static async lookupPurchaseOrders(query: string = '', requestId?: string) {
    const res = await this.request(
      'GET',
      `/purchase-orders/lookup?q=${encodeURIComponent(query)}`,
      ['purchase-order:read'],
      requestId
    );
    return res.data?.data || [];
  }

  static async getPurchaseOrderPdf(idOrNumber: string, requestId?: string) {
    return await this.request(
      'GET',
      `/purchase-orders/${encodeURIComponent(idOrNumber)}/pdf`,
      ['purchase-order:read'],
      requestId,
      { responseType: 'arraybuffer' }
    );
  }

  // --- Purchase Requests ---

  static async getPurchaseRequest(idOrNumber: string, requestId?: string) {
    const res = await this.request(
      'GET',
      `/purchase-requests/${encodeURIComponent(idOrNumber)}`,
      ['purchase-request:read'],
      requestId
    );
    return res.data;
  }

  static async listPurchaseRequests(query: string = '', requestId?: string) {
    const res = await this.request(
      'GET',
      `/purchase-requests?q=${encodeURIComponent(query)}`,
      ['purchase-request:read'],
      requestId
    );
    return res.data;
  }

  static async lookupPurchaseRequests(query: string = '', requestId?: string) {
    const res = await this.request(
      'GET',
      `/purchase-requests/lookup?q=${encodeURIComponent(query)}`,
      ['purchase-request:read'],
      requestId
    );
    return res.data?.data || [];
  }
}
