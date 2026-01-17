"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuestionnaireController = void 0;
const zod_1 = require("zod");
const UuidSchema = zod_1.z.string().uuid();
const EvaluateBodySchema = zod_1.z.object({
    answers: zod_1.z
        .array(zod_1.z.object({
        questionId: UuidSchema,
        answerOptionId: UuidSchema,
    }))
        .default([]),
});
class QuestionnaireController {
    getQuestionnaire;
    evaluateQuestionnaire;
    constructor(getQuestionnaire, evaluateQuestionnaire) {
        this.getQuestionnaire = getQuestionnaire;
        this.evaluateQuestionnaire = evaluateQuestionnaire;
    }
    async getById(req, res) {
        const questionnaireId = UuidSchema.parse(req.params.questionnaireId);
        const questionnaire = await this.getQuestionnaire.execute(questionnaireId);
        res.status(200).json(questionnaire);
    }
    async evaluate(req, res) {
        const questionnaireId = UuidSchema.parse(req.params.questionnaireId);
        const body = EvaluateBodySchema.parse(req.body);
        const result = await this.evaluateQuestionnaire.execute({
            questionnaireId,
            answers: body.answers,
        });
        res.status(200).json(result);
    }
}
exports.QuestionnaireController = QuestionnaireController;
