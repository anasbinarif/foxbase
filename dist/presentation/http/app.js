"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = createApp;
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const cors_1 = __importDefault(require("cors"));
const pino_http_1 = __importDefault(require("pino-http"));
const logger_1 = require("../../config/logger");
const errorHandler_1 = require("./middlewares/errorHandler");
const apiV1_1 = require("./routes/apiV1");
function createApp(params) {
    const app = (0, express_1.default)();
    app.use((0, pino_http_1.default)({
        logger: logger_1.logger,
    }));
    app.use((0, helmet_1.default)());
    app.use((0, cors_1.default)());
    app.use(express_1.default.json({ limit: '1mb' }));
    app.use('/api/v1', (0, apiV1_1.createApiV1Router)({ questionnaireController: params.questionnaireController }));
    app.use(errorHandler_1.errorHandler);
    return app;
}
