export interface EvaluateQuestionnaireRequestDTO {
  questionnaireId: string;
  answers: AnswerSelection[];
}

export interface AnswerSelection {
  questionId: string;
  answerOptionId: string;
}

export type ProductSource = 'reductive' | 'additive' | 'both';

export interface EvaluateQuestionnaireResponseDTO {
  products: ProductDTO[];
  activeFilters: ActiveFilterDTO[];
}

export interface ProductDTO {
  id: string;
  name: string;
  category: string;
  priceCents: number;
  attributes: Record<string, string | number | boolean | null>;
  source: ProductSource;
}

export interface ActiveFilterDTO {
  answerOptionId: string;
  rule: {
    field: string;
    op: string;
    value: unknown;
  };
}
