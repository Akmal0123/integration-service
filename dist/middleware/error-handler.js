import axios from 'axios';
export function errorHandler(error, request, reply) {
    request.log.error({
        err: error,
        requestId: request.requestId,
        url: request.raw.url,
    });
    // Fastify Schema Validation Error
    if (error.validation) {
        return reply.status(400).send({
            success: false,
            error: {
                code: 'VALIDATION_ERROR',
                message: error.message || 'Request validation failed',
            },
            request_id: request.requestId,
        });
    }
    // Axios/EIS downstream error handling
    if (axios.isAxiosError(error) || error?.isAxiosError || error?.response) {
        const status = error.response?.status || error.status;
        const eisMessage = error.response?.data?.message;
        if (status === 404) {
            return reply.status(404).send({
                success: false,
                error: {
                    code: 'RESOURCE_NOT_FOUND',
                    message: eisMessage || 'Resource not found in External Inventory System',
                },
                request_id: request.requestId,
            });
        }
        if (status === 401 || status === 403) {
            return reply.status(502).send({
                success: false,
                error: {
                    code: 'EIS_AUTH_FAILED',
                    message: `Downstream EIS authentication failed: ${eisMessage || status}`,
                },
                request_id: request.requestId,
            });
        }
        // Network error / timeout / connection refused
        return reply.status(502).send({
            success: false,
            error: {
                code: 'EIS_BAD_GATEWAY',
                message: 'External Inventory System (EIS) is currently unreachable',
            },
            request_id: request.requestId,
        });
    }
    const statusCode = error.statusCode || error.status || 500;
    return reply.status(statusCode).send({
        success: false,
        error: {
            code: error.code || 'INTERNAL_SERVER_ERROR',
            message: statusCode === 500 ? 'Internal Server Error' : error.message,
        },
        request_id: request.requestId,
    });
}
