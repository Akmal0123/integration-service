export const getPurchaseRequestSchema = {
  params: {
    type: 'object',
    required: ['number'],
    properties: {
      number: { type: 'string', minLength: 1 },
    },
  },
};

export const listPurchaseRequestsSchema = {
  querystring: {
    type: 'object',
    properties: {
      q: { type: 'string' },
      page: { type: 'integer', minimum: 1 },
      per_page: { type: 'integer', minimum: 1, maximum: 100 },
    },
  },
};
