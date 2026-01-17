import { pool } from '../db/pool';
import type { QuestionnaireRepository } from '../../application/ports/QuestionnaireRepository';
import type { Questionnaire } from '../../domain/entities/Questionnaire';

type QuestionnaireRow = {
  id: string;
  name: string;
};

type QuestionRow = {
  id: string;
  questionnaire_id: string;
  position: number;
  text: string;
};

type AnswerOptionRow = {
  id: string;
  question_id: string;
  label: string;
};

export class QuestionnaireRepositoryPg implements QuestionnaireRepository {
  async getById(id: string): Promise<Questionnaire | null> {
    const questionnaireRes = await pool.query<QuestionnaireRow>(
      'SELECT id, name FROM questionnaires WHERE id = $1',
      [id],
    );
    const questionnaireRow = questionnaireRes.rows[0];
    if (!questionnaireRow) return null;

    const questionsRes = await pool.query<QuestionRow>(
      'SELECT id, questionnaire_id, position, text FROM questions WHERE questionnaire_id = $1 ORDER BY position ASC',
      [id],
    );

    const questionIds = questionsRes.rows.map((q) => q.id);
    const answerOptionsRes =
      questionIds.length === 0
        ? { rows: [] as AnswerOptionRow[] }
        : await pool.query<AnswerOptionRow>(
            'SELECT id, question_id, label FROM answer_options WHERE question_id = ANY($1::uuid[]) ORDER BY label ASC',
            [questionIds],
          );

    const answerOptionsByQuestion = new Map<string, AnswerOptionRow[]>();
    for (const opt of answerOptionsRes.rows) {
      const arr = answerOptionsByQuestion.get(opt.question_id) ?? [];
      arr.push(opt);
      answerOptionsByQuestion.set(opt.question_id, arr);
    }

    return {
      id: questionnaireRow.id,
      name: questionnaireRow.name,
      questions: questionsRes.rows.map((q) => ({
        id: q.id,
        questionnaireId: q.questionnaire_id,
        position: q.position,
        text: q.text,
        answerOptions: (answerOptionsByQuestion.get(q.id) ?? []).map((o) => ({
          id: o.id,
          questionId: o.question_id,
          label: o.label,
        })),
      })),
    };
  }
}
