import type { Questionnaire } from '../../domain/entities/Questionnaire';

export interface QuestionnaireRepository {
  getById(id: string): Promise<Questionnaire | null>;
}
