"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EvaluateQuestionnaire = void 0;
const errors_1 = require("../errors");
class EvaluateQuestionnaire {
    questionnaireRepo;
    effectRepo;
    productRepo;
    constructor(questionnaireRepo, effectRepo, productRepo) {
        this.questionnaireRepo = questionnaireRepo;
        this.effectRepo = effectRepo;
        this.productRepo = productRepo;
    }
    async execute(params) {
        const { questionnaireId, answers } = params;
        // Basic input sanity checks (do not rely only on controller validation).
        const uniqueQuestions = new Set();
        for (const a of answers) {
            if (uniqueQuestions.has(a.questionId)) {
                throw new errors_1.ValidationError(`Duplicate answer for questionId: ${a.questionId}`);
            }
            uniqueQuestions.add(a.questionId);
        }
        const questionnaire = await this.questionnaireRepo.getById(questionnaireId);
        if (!questionnaire) {
            throw new errors_1.NotFoundError(`Questionnaire not found: ${questionnaireId}`);
        }
        // Validate that answerOptionIds belong to the questionnaire and match the provided questionId.
        const optionToQuestion = new Map();
        for (const q of questionnaire.questions) {
            for (const opt of q.answerOptions) {
                optionToQuestion.set(opt.id, q.id);
            }
        }
        for (const a of answers) {
            const expectedQuestionId = optionToQuestion.get(a.answerOptionId);
            if (!expectedQuestionId) {
                throw new errors_1.ValidationError(`answerOptionId does not belong to questionnaire: ${a.answerOptionId}`);
            }
            if (expectedQuestionId !== a.questionId) {
                throw new errors_1.ValidationError(`answerOptionId ${a.answerOptionId} does not belong to questionId ${a.questionId}`);
            }
        }
        const answerOptionIds = answers.map((a) => a.answerOptionId);
        const effects = await this.effectRepo.findFilterEffectsByAnswerOptionIds(answerOptionIds);
        const filters = effects.map((e) => e.payload);
        const products = await this.productRepo.findByFilters(filters);
        return {
            products: products.map((p) => ({
                id: p.id,
                name: p.name,
                category: p.category,
                priceCents: p.priceCents,
                attributes: p.attributes,
            })),
            activeFilters: effects.map((e) => ({
                answerOptionId: e.answerOptionId,
                rule: {
                    field: e.payload.field,
                    op: e.payload.op,
                    value: e.payload.value,
                },
            })),
        };
    }
}
exports.EvaluateQuestionnaire = EvaluateQuestionnaire;
