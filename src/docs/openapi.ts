export const openApiSpec = {
  openapi: '3.1.0',
  info: {
    title: 'Fastify Integration Service API',
    version: '2.0.0',
    description: `
### Isolated Integration Service — AMS ↔ EIS Boundary Layer

Layanan middleware berkinerja tinggi berbasis **Fastify & TypeScript** yang berfungsi sebagai batas isolasi (*integration boundary*) antara **Approval Management System (AMS)** dan **External Inventory System (EIS)**.

#### Prinsip Arsitektur:
- Fastify tidak mengakses database EIS secara langsung. Semua data diambil melalui REST API EIS (Port 9000).
- Komunikasi AMS ➔ Fastify diamankan dengan **JWT A** (Issuer: \`ams\`, Audience: \`integration-service\`).
- Komunikasi Fastify ➔ EIS diamankan dengan **JWT B** (Issuer: \`integration-service\`, Audience: \`eis\`).
- Respon dari EIS dinormalisasi dan ditransformasikan ke dalam kontrak data standar yang dibutuhkan AMS.

#### Cara Menguji Endpoint Ber-otentikasi:
1. Klik tombol **Authorize** di pojok kanan atas atau gunakan dialog otentikasi.
2. Dapatkan token testing valid dengan membuka endpoint **GET /dev/tokens**.
3. Masukkan token tersebut ke dalam input Bearer Token.
4. Klik **Test Request** pada endpoint mana pun yang ingin diuji!
    `,
    contact: {
      name: 'Tim Integrasi Tiga Serangkai',
    },
  },
  servers: [
    {
      url: 'http://localhost:5000',
      description: 'Local Integration Service (Port 5000)',
    },
  ],
  tags: [
    { name: 'System & Health', description: 'Pemeriksaan status server dan token helper' },
    { name: 'Purchase Orders', description: 'Integrasi Purchase Order dari EIS (Memerlukan scope integration:purchase-order:read)' },
    { name: 'Purchase Requests', description: 'Integrasi Purchase Request dari EIS (Memerlukan scope integration:purchase-request:read)' },
    { name: 'Unified Lookup', description: 'Pencarian dokumen lintas PO & PR untuk AMS' },
    { name: 'Legacy Aliases', description: 'Endpoint kompatibilitas mundur (/api/integration/...)' },
  ],
  paths: {
    '/health': {
      get: {
        tags: ['System & Health'],
        summary: 'Pemeriksaan kesehatan service (Health Check)',
        description: 'Mengembalikan status service, timestamp, dan request ID aktif. Tidak memerlukan token otentikasi.',
        responses: {
          '200': {
            description: 'Layanan berjalan normal',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'ok' },
                    service: { type: 'string', example: 'Fastify Integration Service' },
                    version: { type: 'string', example: '2.0.0' },
                    timestamp: { type: 'string', format: 'date-time' },
                    request_id: { type: 'string', example: 'req_1727142000000_abc123' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/dev/tokens': {
      get: {
        tags: ['System & Health'],
        summary: 'Generate Token JWT A & B untuk Keperluan Testing',
        description: 'Menghasilkan token JWT A (AMS ➔ Fastify) dan JWT B (Fastify ➔ EIS) siap pakai beserta contoh header cURL untuk mempermudah testing.',
        responses: {
          '200': {
            description: 'Token pengujian berhasil dibuat',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/TokenHelperResponse',
                },
              },
            },
          },
        },
      },
    },
    '/api/v1/integration/purchase-orders/{number}': {
      get: {
        tags: ['Purchase Orders'],
        summary: 'Ambil Detail Purchase Order berdasarkan Nomor / ID',
        description: 'Mengambil data PO dari EIS dan mentransformasikannya ke kontrak data yang siap dikonsumsi oleh AMS.',
        security: [{ BearerAuth: ['integration:purchase-order:read'] }],
        parameters: [
          {
            name: 'number',
            in: 'path',
            required: true,
            description: 'Nomor PO (misal: PO-2026-0001) atau ID angka',
            schema: { type: 'string', example: 'PO-2026-0001' },
          },
        ],
        responses: {
          '200': {
            description: 'Data PO berhasil ditemukan dan ditransformasikan',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/PurchaseOrderResponse' },
              },
            },
          },
          '401': { $ref: '#/components/responses/UnauthorizedError' },
          '403': { $ref: '#/components/responses/ForbiddenError' },
          '404': { $ref: '#/components/responses/NotFoundError' },
          '502': { $ref: '#/components/responses/BadGatewayError' },
        },
      },
    },
    '/api/v1/integration/purchase-orders': {
      get: {
        tags: ['Purchase Orders'],
        summary: 'Daftar Purchase Orders',
        description: 'Mengambil daftar PO dari EIS dengan opsi pencarian query keyword.',
        security: [{ BearerAuth: ['integration:purchase-order:read'] }],
        parameters: [
          {
            name: 'q',
            in: 'query',
            required: false,
            description: 'Kata kunci pencarian (nomor PO, nama vendor, dll)',
            schema: { type: 'string', example: 'Workstation' },
          },
          {
            name: 'page',
            in: 'query',
            required: false,
            schema: { type: 'integer', default: 1, minimum: 1 },
          },
          {
            name: 'per_page',
            in: 'query',
            required: false,
            schema: { type: 'integer', default: 15, maximum: 100 },
          },
        ],
        responses: {
          '200': {
            description: 'Daftar PO berhasil diambil',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    count: { type: 'integer', example: 1 },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/PurchaseOrderItemContract' },
                    },
                    meta: { $ref: '#/components/schemas/ResponseMeta' },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/UnauthorizedError' },
          '403': { $ref: '#/components/responses/ForbiddenError' },
          '502': { $ref: '#/components/responses/BadGatewayError' },
        },
      },
    },
    '/api/v1/integration/purchase-orders/lookup': {
      get: {
        tags: ['Purchase Orders'],
        summary: 'Lookup PO untuk Autocomplete AMS',
        description: 'Endpoint ringan untuk pencarian cepat PO (digunakan oleh dropdown / autocomplete form input AMS).',
        security: [{ BearerAuth: ['integration:purchase-order:read'] }],
        parameters: [
          {
            name: 'q',
            in: 'query',
            required: false,
            description: 'Kata kunci pencarian nomor PO',
            schema: { type: 'string', example: 'PO-2026' },
          },
        ],
        responses: {
          '200': {
            description: 'Hasil lookup PO',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          id: { type: 'integer', example: 1 },
                          document_number: { type: 'string', example: 'PO-2026-0001' },
                          title: { type: 'string', example: 'PO Pengadaan Perangkat Komputer Workstation Development' },
                          vendor_name: { type: 'string', example: 'PT Teknologi Mandiri' },
                          total_amount: { type: 'number', example: 28700000 },
                        },
                      },
                    },
                    meta: { $ref: '#/components/schemas/ResponseMeta' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/v1/integration/purchase-orders/{id}/pdf': {
      get: {
        tags: ['Purchase Orders'],
        summary: 'Stream / Download Berkas PDF Purchase Order Asli dari EIS',
        description: 'Meneruskan streaming file binary PDF PO langsung dari EIS ke client.',
        security: [{ BearerAuth: ['integration:purchase-order:read'] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'ID PO di EIS',
            schema: { type: 'string', example: '1' },
          },
        ],
        responses: {
          '200': {
            description: 'File binary PDF',
            content: {
              'application/pdf': {
                schema: { type: 'string', format: 'binary' },
              },
            },
          },
          '404': { $ref: '#/components/responses/NotFoundError' },
        },
      },
    },
    '/api/v1/integration/purchase-requests/{number}': {
      get: {
        tags: ['Purchase Requests'],
        summary: 'Ambil Detail Purchase Request berdasarkan Nomor / ID',
        description: 'Mengambil data PR dari EIS dan mentransformasikannya ke kontrak data yang siap dikonsumsi oleh AMS.',
        security: [{ BearerAuth: ['integration:purchase-request:read'] }],
        parameters: [
          {
            name: 'number',
            in: 'path',
            required: true,
            description: 'Nomor PR (misal: PR-2026-0001) atau ID angka',
            schema: { type: 'string', example: 'PR-2026-0001' },
          },
        ],
        responses: {
          '200': {
            description: 'Data PR berhasil ditemukan dan ditransformasikan',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/PurchaseRequestResponse' },
              },
            },
          },
          '401': { $ref: '#/components/responses/UnauthorizedError' },
          '403': { $ref: '#/components/responses/ForbiddenError' },
          '404': { $ref: '#/components/responses/NotFoundError' },
          '502': { $ref: '#/components/responses/BadGatewayError' },
        },
      },
    },
    '/api/v1/integration/purchase-requests': {
      get: {
        tags: ['Purchase Requests'],
        summary: 'Daftar Purchase Requests',
        description: 'Mengambil daftar PR dari EIS dengan filter pencarian kata kunci.',
        security: [{ BearerAuth: ['integration:purchase-request:read'] }],
        parameters: [
          {
            name: 'q',
            in: 'query',
            required: false,
            description: 'Kata kunci pencarian',
            schema: { type: 'string', example: 'Workstation' },
          },
        ],
        responses: {
          '200': {
            description: 'Daftar PR berhasil diambil',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    count: { type: 'integer', example: 1 },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/PurchaseRequestItemContract' },
                    },
                    meta: { $ref: '#/components/schemas/ResponseMeta' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/v1/integration/purchase-requests/lookup': {
      get: {
        tags: ['Purchase Requests'],
        summary: 'Lookup PR untuk Autocomplete AMS',
        description: 'Pencarian cepat nomor PR untuk dropdown pemilihan dokumen di AMS.',
        security: [{ BearerAuth: ['integration:purchase-request:read'] }],
        parameters: [
          {
            name: 'q',
            in: 'query',
            required: false,
            schema: { type: 'string', example: 'PR-2026' },
          },
        ],
        responses: {
          '200': {
            description: 'Hasil lookup PR',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { type: 'array', items: { type: 'object' } },
                    meta: { $ref: '#/components/schemas/ResponseMeta' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/v1/integration/lookup': {
      get: {
        tags: ['Unified Lookup'],
        summary: 'Unified Lookup Dokumen Lintas Tipe (PO + PR)',
        description: 'Mencari dokumen secara gabungan dari Purchase Order dan Purchase Request berdasarkan query pencarian.',
        security: [{ BearerAuth: ['integration:purchase-order:read'] }],
        parameters: [
          {
            name: 'q',
            in: 'query',
            required: false,
            description: 'Query pencarian',
            schema: { type: 'string', example: '2026' },
          },
        ],
        responses: {
          '200': {
            description: 'Hasil pencarian terpadu',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    count: { type: 'integer', example: 2 },
                    data: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          type: { type: 'string', enum: ['PO', 'PR'], example: 'PO' },
                          number: { type: 'string', example: 'PO-2026-0001' },
                          title: { type: 'string', example: 'PO Pengadaan Perangkat Komputer Workstation' },
                          date: { type: 'string', example: '2026-09-14' },
                          vendor_or_dept: { type: 'string', example: 'PT Teknologi Mandiri' },
                          total_amount: { type: 'number', example: 28700000 },
                        },
                      },
                    },
                    meta: { $ref: '#/components/schemas/ResponseMeta' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/v1/integration/document/{keyword}': {
      get: {
        tags: ['Unified Lookup'],
        summary: 'Deteksi & Ambil Dokumen Otomatis (PO atau PR)',
        description: 'Mendeteksi otomatis apakah keyword merupakan nomor PO atau PR, lalu mengambil data detail yang telah ditransformasikan untuk form pembuatan dokumen di AMS.',
        security: [{ BearerAuth: ['integration:purchase-order:read'] }],
        parameters: [
          {
            name: 'keyword',
            in: 'path',
            required: true,
            description: 'Nomor dokumen (misal: PO-2026-0001 atau PR-2026-0001)',
            schema: { type: 'string', example: 'PO-2026-0001' },
          },
        ],
        responses: {
          '200': {
            description: 'Dokumen berhasil ditemukan dan dinormalisasi untuk AMS',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Dokumen berhasil diambil dan ditransformasikan untuk AMS' },
                    data: { $ref: '#/components/schemas/PurchaseOrderContract' },
                    meta: { $ref: '#/components/schemas/ResponseMeta' },
                  },
                },
              },
            },
          },
          '404': { $ref: '#/components/responses/NotFoundError' },
        },
      },
    },
    '/api/integration/purchase-orders/{number}': {
      get: {
        tags: ['Legacy Aliases'],
        summary: '[Legacy] Purchase Order by Number',
        security: [{ BearerAuth: ['integration:purchase-order:read'] }],
        parameters: [{ name: 'number', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'OK' } },
      },
    },
    '/api/integration/lookup': {
      get: {
        tags: ['Legacy Aliases'],
        summary: '[Legacy] Unified Lookup',
        security: [{ BearerAuth: ['integration:purchase-order:read'] }],
        responses: { '200': { description: 'OK' } },
      },
    },
    '/api/integration/document/{keyword}': {
      get: {
        tags: ['Legacy Aliases'],
        summary: '[Legacy] Get Document by Keyword',
        security: [{ BearerAuth: ['integration:purchase-order:read'] }],
        parameters: [{ name: 'keyword', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'OK' } },
      },
    },
  },
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Ketik atau paste token JWT A di sini. Gunakan endpoint GET /dev/tokens untuk mendapatkan token pengujian secara instan.',
      },
    },
    schemas: {
      ResponseMeta: {
        type: 'object',
        properties: {
          source: { type: 'string', example: 'eis' },
          request_id: { type: 'string', example: 'req_1727142000000_abc123' },
        },
      },
      PurchaseOrderResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: { $ref: '#/components/schemas/PurchaseOrderContract' },
          meta: { $ref: '#/components/schemas/ResponseMeta' },
        },
      },
      PurchaseOrderContract: {
        type: 'object',
        properties: {
          document_number: { type: 'string', example: 'PO-2026-0001' },
          document_type: { type: 'string', example: 'Purchase Order' },
          po_number: { type: 'string', example: 'PO-2026-0001' },
          supplier_name: { type: 'string', example: 'PT Teknologi Mandiri' },
          supplier_code: { type: 'string', example: 'VND-001' },
          company_code: { type: 'string', example: 'TS' },
          date: { type: 'string', example: '2026-09-14' },
          status: { type: 'string', example: 'issued' },
          description: { type: 'string', example: 'PO Pengadaan Perangkat Komputer Workstation Development' },
          subtotal: { type: 'number', example: 28700000 },
          tax_rate: { type: 'number', example: 0.11 },
          tax_amount: { type: 'number', example: 3157000 },
          total_amount: { type: 'number', example: 31857000 },
          has_pdf: { type: 'boolean', example: true },
          items: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                code: { type: 'string', example: 'BRG-001' },
                name: { type: 'string', example: 'Laptop Lenovo ThinkPad L14 Gen 4' },
                quantity: { type: 'number', example: 2 },
                unit: { type: 'string', example: 'Unit' },
                unit_price: { type: 'number', example: 12500000 },
                total_price: { type: 'number', example: 25000000 },
              },
            },
          },
        },
      },
      PurchaseOrderItemContract: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          po_number: { type: 'string', example: 'PO-2026-0001' },
          vendor: {
            type: 'object',
            properties: {
              name: { type: 'string', example: 'PT Teknologi Mandiri' },
            },
          },
          order_date: { type: 'string', example: '2026-09-14' },
          total_amount: { type: 'number', example: 31857000 },
          status: { type: 'string', example: 'issued' },
        },
      },
      PurchaseRequestResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: { $ref: '#/components/schemas/PurchaseRequestContract' },
          meta: { $ref: '#/components/schemas/ResponseMeta' },
        },
      },
      PurchaseRequestContract: {
        type: 'object',
        properties: {
          document_number: { type: 'string', example: 'PR-2026-0001' },
          document_type: { type: 'string', example: 'Purchase Request' },
          department: { type: 'string', example: 'IT & Infrastructure' },
          date: { type: 'string', example: '2026-09-10' },
          status: { type: 'string', example: 'approved' },
          notes: { type: 'string', example: 'Permintaan pengadaan unit laptop tim developer baru' },
          items: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                item_name: { type: 'string', example: 'Laptop Lenovo ThinkPad L14' },
                quantity: { type: 'number', example: 2 },
                unit: { type: 'string', example: 'Unit' },
              },
            },
          },
        },
      },
      PurchaseRequestItemContract: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          pr_number: { type: 'string', example: 'PR-2026-0001' },
          department: { type: 'string', example: 'IT & Infrastructure' },
          request_date: { type: 'string', example: '2026-09-10' },
          status: { type: 'string', example: 'approved' },
        },
      },
      TokenHelperResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Token pengujian berhasil digenerate' },
          jwt_a_ams_to_fastify: {
            type: 'object',
            properties: {
              token: { type: 'string' },
              issuer: { type: 'string', example: 'ams' },
              audience: { type: 'string', example: 'integration-service' },
              scopes: { type: 'array', items: { type: 'string' } },
              expires_in: { type: 'string', example: '24 hours' },
              curl_header: { type: 'string', example: 'Authorization: Bearer eyJhbGci...' },
            },
          },
          jwt_b_fastify_to_eis: {
            type: 'object',
            properties: {
              token: { type: 'string' },
              issuer: { type: 'string', example: 'integration-service' },
              audience: { type: 'string', example: 'eis' },
              scopes: { type: 'array', items: { type: 'string' } },
              expires_in: { type: 'string', example: '15 minutes' },
            },
          },
        },
      },
    },
    responses: {
      UnauthorizedError: {
        description: 'Token otentikasi tidak disediakan atau tidak valid',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                success: { type: 'boolean', example: false },
                error: {
                  type: 'object',
                  properties: {
                    code: { type: 'string', example: 'UNAUTHORIZED' },
                    message: { type: 'string', example: 'Authorization header missing or invalid' },
                  },
                },
                request_id: { type: 'string', example: 'req_1727142000000_abc123' },
              },
            },
          },
        },
      },
      ForbiddenError: {
        description: 'Token valid tetapi tidak memiliki scope yang disyaratkan',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                success: { type: 'boolean', example: false },
                error: {
                  type: 'object',
                  properties: {
                    code: { type: 'string', example: 'FORBIDDEN' },
                    message: { type: 'string', example: 'Token missing required scope: integration:purchase-order:read' },
                  },
                },
                request_id: { type: 'string', example: 'req_1727142000000_abc123' },
              },
            },
          },
        },
      },
      NotFoundError: {
        description: 'Dokumen atau resource tidak ditemukan',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                success: { type: 'boolean', example: false },
                error: {
                  type: 'object',
                  properties: {
                    code: { type: 'string', example: 'EIS_RESOURCE_NOT_FOUND' },
                    message: { type: 'string', example: 'Purchase Order tidak ditemukan di sistem EIS' },
                  },
                },
                request_id: { type: 'string', example: 'req_1727142000000_abc123' },
              },
            },
          },
        },
      },
      BadGatewayError: {
        description: 'Gagal menghubungi sistem EIS (EIS down atau network issue)',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                success: { type: 'boolean', example: false },
                error: {
                  type: 'object',
                  properties: {
                    code: { type: 'string', example: 'EIS_UNAVAILABLE' },
                    message: { type: 'string', example: 'External Inventory System (EIS) is currently unreachable' },
                  },
                },
                request_id: { type: 'string', example: 'req_1727142000000_abc123' },
              },
            },
          },
        },
      },
    },
  },
};
