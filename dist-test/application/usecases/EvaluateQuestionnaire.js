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
        // Fetch all effects (reductive filters + additive recommendations).
        const allEffects = await this.effectRepo.findAllEffectsByAnswerOptionIds(answerOptionIds);
        const filterEffects = [];
        const recommendationEffects = [];
        for (const effect of allEffects) {
            if (effect.type === 'filter') {
                filterEffects.push(effect);
            }
            else if (effect.type === 'recommendation') {
                recommendationEffects.push(effect);
            }
        }
        const filters = filterEffects.map((e) => e.payload);
        // Reductive result.
        const reductiveProducts = await this.productRepo.findByFilters(filters);
        // Collect additive product IDs from recommendation effects.
        const additiveProductIdSet = new Set();
        for (const eff of recommendationEffects) {
            for (const id of eff.payload.productIds) {
                additiveProductIdSet.add(id);
            }
        }
        const additiveProductIds = Array.from(additiveProductIdSet);
        const additiveProducts = await this.productRepo.findByIds(additiveProductIds);
        const byId = new Map();
        const reductiveOrder = [];
        for (const p of reductiveProducts) {
            const existing = byId.get(p.id);
            if (!existing) {
                byId.set(p.id, {
                    id: p.id,
                    name: p.name,
                    category: p.category,
                    priceCents: p.priceCents,
                    attributes: p.attributes,
                    source: 'reductive',
                });
                reductiveOrder.push(p.id);
            }
            else {
                // If product already present as additive, mark as both.
                if (existing.source === 'additive') {
                    existing.source = 'both';
                }
            }
        }
        for (const p of additiveProducts) {
            const existing = byId.get(p.id);
            if (!existing) {
                byId.set(p.id, {
                    id: p.id,
                    name: p.name,
                    category: p.category,
                    priceCents: p.priceCents,
                    attributes: p.attributes,
                    source: 'additive',
                });
            }
            else {
                if (existing.source === 'reductive') {
                    existing.source = 'both';
                }
            }
        }
        const additiveOnly = [];
        for (const [id, p] of byId.entries()) {
            if (!reductiveOrder.includes(id)) {
                additiveOnly.push(p);
            }
        }
        additiveOnly.sort((a, b) => {
            if (a.name === b.name) {
                return a.id.localeCompare(b.id);
            }
            return a.name.localeCompare(b.name);
        });
        const mergedProducts = [
            ...reductiveOrder.map((id) => byId.get(id)).filter(Boolean),
            ...additiveOnly,
        ];
        return {
            products: mergedProducts.map((p) => ({
                id: p.id,
                name: p.name,
                category: p.category,
                priceCents: p.priceCents,
                attributes: p.attributes,
                source: p.source,
            })),
            activeFilters: filterEffects.map((e) => ({
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
