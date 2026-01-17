"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
const logger_1 = require("../../../config/logger");
const errors_1 = require("../../../application/errors");
function errorHandler(err, _req, res, _next) {
    if (err instanceof errors_1.ValidationError) {
        res.status(400).json({ error: 'validation_error', message: err.message });
        return;
    }
    if (err instanceof errors_1.NotFoundError) {
        res.status(404).json({ error: 'not_found', message: err.message });
        return;
    }
    logger_1.logger.error({ err }, 'Unhandled error');
    res.status(500).json({ error: 'internal_error', message: 'Unexpected server error' });
}
