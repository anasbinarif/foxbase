import { z } from 'zod';
import { pool } from '../db/pool';
import type { AnswerEffectRepository } from '../../application/ports/AnswerEffectRepository';
import type {
  FilterAnswerEffect,
  FilterEffectPayload,
  RecommendationAnswerEffect,
  RecommendationEffectPayload,
} from '../../domain/entities/AnswerEffect';

type AnswerEffectRow = {
  id: string;
  answer_option_id: string;
  type: string;
  payload: unknown;
};

const FilterPayloadSchema: z.ZodType<FilterEffectPayload> = z.object({
  field: z.string().min(1),
  op: z.enum(['eq', 'in', 'lte', 'gte']),
  value: z.union([z.string(), z.number(), z.array(z.union([z.string(), z.number()]))]),
});

const RecommendationPayloadSchema: z.ZodType<RecommendationEffectPayload> = z
  .object({
    productIds: z.array(z.string().uuid()).optional(),
    filters: z.array(FilterPayloadSchema).optional(),
  })
  .refine(
    (data) => data.productIds !== undefined || data.filters !== undefined,
    { message: 'At least one of productIds or filters must be provided' },
  );

export class AnswerEffectRepositoryPg implements AnswerEffectRepository {
  async findFilterEffectsByAnswerOptionIds(answerOptionIds: string[]): Promise<FilterAnswerEffect[]> {
    if (answerOptionIds.length === 0) return [];

    const res = await pool.query<AnswerEffectRow>(
      "SELECT id, answer_option_id, type, payload FROM answer_effects WHERE answer_option_id = ANY($1::uuid[]) AND type = 'filter'",
      [answerOptionIds],
    );

    return res.rows.map((row) => {
      const payload = FilterPayloadSchema.parse(row.payload);

      return {
        id: row.id,
        answerOptionId: row.answer_option_id,
        type: 'filter',
        payload,
      };
    });
  }

  async findAllEffectsByAnswerOptionIds(
    answerOptionIds: string[],
  ): Promise<(FilterAnswerEffect | RecommendationAnswerEffect)[]> {
    if (answerOptionIds.length === 0) return [];

    const res = await pool.query<AnswerEffectRow>(
      'SELECT id, answer_option_id, type, payload FROM answer_effects WHERE answer_option_id = ANY($1::uuid[])',
      [answerOptionIds],
    );

    return res.rows.map((row) => {
      if (row.type === 'filter') {
        const payload = FilterPayloadSchema.parse(row.payload);
        return {
          id: row.id,
          answerOptionId: row.answer_option_id,
          type: 'filter' as const,
          payload,
        };
      }

      if (row.type === 'recommendation') {
        const payload = RecommendationPayloadSchema.parse(row.payload);
        return {
          id: row.id,
          answerOptionId: row.answer_option_id,
          type: 'recommendation' as const,
          payload,
        };
      }

      throw new Error(`Unsupported answer_effects.type: ${row.type}`);
    });
  }
}
