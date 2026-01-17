import { env } from './config/env';
import { logger } from './config/logger';
import { createApp } from './presentation/http/app';
import { QuestionnaireRepositoryPg } from './infrastructure/repositories/QuestionnaireRepositoryPg';
import { AnswerEffectRepositoryPg } from './infrastructure/repositories/AnswerEffectRepositoryPg';
import { ProductRepositoryPg } from './infrastructure/repositories/ProductRepositoryPg';
import { GetQuestionnaire } from './application/usecases/GetQuestionnaire';
import { EvaluateQuestionnaire } from './application/usecases/EvaluateQuestionnaire';
import { QuestionnaireController } from './presentation/http/controllers/QuestionnaireController';

async function bootstrap(): Promise<void> {
  const questionnaireRepo = new QuestionnaireRepositoryPg();
  const effectRepo = new AnswerEffectRepositoryPg();
  const productRepo = new ProductRepositoryPg();

  const getQuestionnaire = new GetQuestionnaire(questionnaireRepo);
  const evaluateQuestionnaire = new EvaluateQuestionnaire(questionnaireRepo, effectRepo, productRepo);

  const questionnaireController = new QuestionnaireController(getQuestionnaire, evaluateQuestionnaire);

  const app = createApp({ questionnaireController });

  app.listen(env.PORT, () => {
    logger.info({ port: env.PORT }, 'Server started');
  });
}

void bootstrap();
