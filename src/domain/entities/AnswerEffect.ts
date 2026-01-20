export type AnswerEffectType = 'filter' | 'recommendation';

export interface AnswerEffect {
  id: string;
  answerOptionId: string;
  type: AnswerEffectType;
  payload: unknown;
}

export type FilterOperator = 'eq' | 'in' | 'lte' | 'gte';

export interface FilterEffectPayload {
  /**
   * Field selector on Product.
   * Supported:
   *  - "category"
   *  - "priceCents"
   *  - "attributes.<key>"   (e.g. "attributes.application")
   */
  field: string;
  op: FilterOperator;
  value: string | number | Array<string | number>;
}

export interface FilterAnswerEffect extends AnswerEffect {
  type: 'filter';
  payload: FilterEffectPayload;
}

export interface RecommendationEffectPayload {
  productIds?: string[];
  filters?: FilterEffectPayload[];
}

export interface RecommendationAnswerEffect extends AnswerEffect {
  type: 'recommendation';
  payload: RecommendationEffectPayload;
}
