import type { FilterAnswerEffect, RecommendationAnswerEffect } from '../../domain/entities/AnswerEffect';

export interface AnswerEffectRepository {
  findFilterEffectsByAnswerOptionIds(answerOptionIds: string[]): Promise<FilterAnswerEffect[]>;
  findAllEffectsByAnswerOptionIds(answerOptionIds: string[]): Promise<(FilterAnswerEffect | RecommendationAnswerEffect)[]>;
}
