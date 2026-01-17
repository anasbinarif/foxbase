import type { Express } from 'express';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import pinoHttp from 'pino-http';
import { logger } from '../../config/logger';
import { errorHandler } from './middlewares/errorHandler';
import { createApiV1Router } from './routes/apiV1';
import type { QuestionnaireController } from './controllers/QuestionnaireController';

export function createApp(params: { questionnaireController: QuestionnaireController }): Express {
  const app = express();

  app.use(
    pinoHttp({
      logger,
    }),
  );

  app.use(helmet());
  app.use(cors());
  app.use(express.json({ limit: '1mb' }));

  app.use('/api/v1', createApiV1Router({ questionnaireController: params.questionnaireController }));

  app.use(errorHandler);

  return app;
}
