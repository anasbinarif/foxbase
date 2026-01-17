import type { AnswerEffectRepository } from '../ports/AnswerEffectRepository';
import type { ProductRepository } from '../ports/ProductRepository';
import type { QuestionnaireRepository } from '../ports/QuestionnaireRepository';
import type { EvaluateQuestionnaireResponseDTO, ProductSource } from '../dtos/EvaluateQuestionnaireDtos';
import type {
  FilterEffectPayload,
  FilterAnswerEffect,
  RecommendationAnswerEffect,
} from '../../domain/entities/AnswerEffect';
import { NotFoundError, ValidationError } from '../errors';

export class EvaluateQuestionnaire {
  constructor(
    private readonly questionnaireRepo: QuestionnaireRepository,
    private readonly effectRepo: AnswerEffectRepository,
    private readonly productRepo: ProductRepository,
  ) {}

  async execute(params: {
    questionnaireId: string;
    answers: Array<{ questionId: string; answerOptionId: string }>;
  }): Promise<EvaluateQuestionnaireResponseDTO> {
    const { questionnaireId, answers } = params;

    // Basic input sanity checks (do not rely only on controller validation).
    const uniqueQuestions = new Set<string>();
    for (const a of answers) {
      if (uniqueQuestions.has(a.questionId)) {
        throw new ValidationError(`Duplicate answer for questionId: ${a.questionId}`);
      }
      uniqueQuestions.add(a.questionId);
    }

    const questionnaire = await this.questionnaireRepo.getById(questionnaireId);
    if (!questionnaire) {
      throw new NotFoundError(`Questionnaire not found: ${questionnaireId}`);
    }

    // Validate that answerOptionIds belong to the questionnaire and match the provided questionId.
    const optionToQuestion = new Map<string, string>();
    for (const q of questionnaire.questions) {
      for (const opt of q.answerOptions) {
        optionToQuestion.set(opt.id, q.id);
      }
    }

    for (const a of answers) {
      const expectedQuestionId = optionToQuestion.get(a.answerOptionId);
      if (!expectedQuestionId) {
        throw new ValidationError(
          `answerOptionId does not belong to questionnaire: ${a.answerOptionId}`,
        );
      }
      if (expectedQuestionId !== a.questionId) {
        throw new ValidationError(
          `answerOptionId ${a.answerOptionId} does not belong to questionId ${a.questionId}`,
        );
      }
    }

    const answerOptionIds = answers.map((a) => a.answerOptionId);

    // Fetch all effects (reductive filters + additive recommendations).
    const allEffects = await this.effectRepo.findAllEffectsByAnswerOptionIds(answerOptionIds);

    const filterEffects: FilterAnswerEffect[] = [];
    const recommendationEffects: RecommendationAnswerEffect[] = [];

    for (const effect of allEffects) {
      if (effect.type === 'filter') {
        filterEffects.push(effect);
      } else if (effect.type === 'recommendation') {
        recommendationEffects.push(effect);
      }
    }

    const filters: FilterEffectPayload[] = filterEffects.map((e) => e.payload);

    // Reductive result.
    const reductiveProducts = await this.productRepo.findByFilters(filters);

    // Collect additive product IDs from recommendation effects.
    const additiveProductIdSet = new Set<string>();
    for (const eff of recommendationEffects) {
      for (const id of eff.payload.productIds) {
        additiveProductIdSet.add(id);
      }
    }
    const additiveProductIds = Array.from(additiveProductIdSet);

    const additiveProducts = await this.productRepo.findByIds(additiveProductIds);

    // Merge results using union approach with deterministic ordering and source flag.
    type ProductWithSource = {
      id: string;
      name: string;
      category: string;
      priceCents: number;
      attributes: Record<string, string | number | boolean | null>;
      source: ProductSource;
    };

    const byId = new Map<string, ProductWithSource>();
    const reductiveOrder: string[] = [];

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
      } else {
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
      } else {
        if (existing.source === 'reductive') {
          existing.source = 'both';
        }
      }
    }

    const additiveOnly: ProductWithSource[] = [];
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

    const mergedProducts: ProductWithSource[] = [
      ...reductiveOrder.map((id) => byId.get(id)!).filter(Boolean),
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
