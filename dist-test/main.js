"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const env_1 = require("./config/env");
const logger_1 = require("./config/logger");
const app_1 = require("./presentation/http/app");
const QuestionnaireRepositoryPg_1 = require("./infrastructure/repositories/QuestionnaireRepositoryPg");
const AnswerEffectRepositoryPg_1 = require("./infrastructure/repositories/AnswerEffectRepositoryPg");
const ProductRepositoryPg_1 = require("./infrastructure/repositories/ProductRepositoryPg");
const GetQuestionnaire_1 = require("./application/usecases/GetQuestionnaire");
const EvaluateQuestionnaire_1 = require("./application/usecases/EvaluateQuestionnaire");
const QuestionnaireController_1 = require("./presentation/http/controllers/QuestionnaireController");
async function bootstrap() {
    const questionnaireRepo = new QuestionnaireRepositoryPg_1.QuestionnaireRepositoryPg();
    const effectRepo = new AnswerEffectRepositoryPg_1.AnswerEffectRepositoryPg();
    const productRepo = new ProductRepositoryPg_1.ProductRepositoryPg();
    const getQuestionnaire = new GetQuestionnaire_1.GetQuestionnaire(questionnaireRepo);
    const evaluateQuestionnaire = new EvaluateQuestionnaire_1.EvaluateQuestionnaire(questionnaireRepo, effectRepo, productRepo);
    const questionnaireController = new QuestionnaireController_1.QuestionnaireController(getQuestionnaire, evaluateQuestionnaire);
    const app = (0, app_1.createApp)({ questionnaireController });
    app.listen(env_1.env.PORT, () => {
        logger_1.logger.info({ port: env_1.env.PORT }, 'Server started');
    });
}
void bootstrap();
