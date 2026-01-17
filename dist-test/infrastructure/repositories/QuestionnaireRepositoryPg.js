"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuestionnaireRepositoryPg = void 0;
const pool_1 = require("../db/pool");
class QuestionnaireRepositoryPg {
    async getById(id) {
        const questionnaireRes = await pool_1.pool.query('SELECT id, name FROM questionnaires WHERE id = $1', [id]);
        const questionnaireRow = questionnaireRes.rows[0];
        if (!questionnaireRow)
            return null;
        const questionsRes = await pool_1.pool.query('SELECT id, questionnaire_id, position, text FROM questions WHERE questionnaire_id = $1 ORDER BY position ASC', [id]);
        const questionIds = questionsRes.rows.map((q) => q.id);
        const answerOptionsRes = questionIds.length === 0
            ? { rows: [] }
            : await pool_1.pool.query('SELECT id, question_id, label FROM answer_options WHERE question_id = ANY($1::uuid[]) ORDER BY label ASC', [questionIds]);
        const answerOptionsByQuestion = new Map();
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
exports.QuestionnaireRepositoryPg = QuestionnaireRepositoryPg;
