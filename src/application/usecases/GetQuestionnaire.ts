import type { Questionnaire } from '../../domain/entities/Questionnaire';
import type { QuestionnaireRepository } from '../ports/QuestionnaireRepository';
import { NotFoundError } from '../errors';

export class GetQuestionnaire {
  constructor(private readonly questionnaireRepo: QuestionnaireRepository) {}

  async execute(questionnaireId: string): Promise<Questionnaire> {
    const questionnaire = await this.questionnaireRepo.getById(questionnaireId);
    if (!questionnaire) {
      throw new NotFoundError(`Questionnaire not found: ${questionnaireId}`);
    }
    return questionnaire;
  }
}
