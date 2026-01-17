import { Router } from 'express';
import type { QuestionnaireController } from '../controllers/QuestionnaireController';

export function createApiV1Router(params: { questionnaireController: QuestionnaireController }): Router {
  const router = Router();

  router.get('/health', (_req, res) => res.status(200).json({ ok: true }));

  router.get('/questionnaires/:questionnaireId', (req, res, next) =>
    params.questionnaireController.getById(req, res).catch(next),
  );

  router.post('/questionnaires/:questionnaireId/evaluate', (req, res, next) =>
    params.questionnaireController.evaluate(req, res).catch(next),
  );

  return router;
}
