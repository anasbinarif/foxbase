"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApiV1Router = createApiV1Router;
const express_1 = require("express");
function createApiV1Router(params) {
    const router = (0, express_1.Router)();
    router.get('/health', (_req, res) => res.status(200).json({ ok: true }));
    router.get('/questionnaires/:questionnaireId', (req, res, next) => params.questionnaireController.getById(req, res).catch(next));
    router.post('/questionnaires/:questionnaireId/evaluate', (req, res, next) => params.questionnaireController.evaluate(req, res).catch(next));
    return router;
}
