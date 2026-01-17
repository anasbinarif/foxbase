import type { Request, Response } from 'express';
import { z } from 'zod';
import type { GetQuestionnaire } from '../../../application/usecases/GetQuestionnaire';
import type { EvaluateQuestionnaire } from '../../../application/usecases/EvaluateQuestionnaire';

const UuidSchema = z.string().uuid();

const EvaluateBodySchema = z.object({
  answers: z
    .array(
      z.object({
        questionId: UuidSchema,
        answerOptionId: UuidSchema,
      }),
    )
    .default([]),
});

export class QuestionnaireController {
  constructor(
    private readonly getQuestionnaire: GetQuestionnaire,
    private readonly evaluateQuestionnaire: EvaluateQuestionnaire,
  ) {}

  async getById(req: Request, res: Response): Promise<void> {
    const questionnaireId = UuidSchema.parse(req.params.questionnaireId);
    const questionnaire = await this.getQuestionnaire.execute(questionnaireId);
    res.status(200).json(questionnaire);
  }

  async evaluate(req: Request, res: Response): Promise<void> {
    const questionnaireId = UuidSchema.parse(req.params.questionnaireId);
    const body = EvaluateBodySchema.parse(req.body);

    const result = await this.evaluateQuestionnaire.execute({
      questionnaireId,
      answers: body.answers,
    });

    res.status(200).json(result);
  }
}
