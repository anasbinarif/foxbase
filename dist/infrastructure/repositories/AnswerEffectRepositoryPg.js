"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnswerEffectRepositoryPg = void 0;
const zod_1 = require("zod");
const pool_1 = require("../db/pool");
const FilterPayloadSchema = zod_1.z.object({
    field: zod_1.z.string().min(1),
    op: zod_1.z.enum(['eq', 'in', 'lte', 'gte']),
    value: zod_1.z.union([zod_1.z.string(), zod_1.z.number(), zod_1.z.array(zod_1.z.union([zod_1.z.string(), zod_1.z.number()]))]),
});
class AnswerEffectRepositoryPg {
    async findFilterEffectsByAnswerOptionIds(answerOptionIds) {
        if (answerOptionIds.length === 0)
            return [];
        const res = await pool_1.pool.query("SELECT id, answer_option_id, type, payload FROM answer_effects WHERE answer_option_id = ANY($1::uuid[]) AND type = 'filter'", [answerOptionIds]);
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
}
exports.AnswerEffectRepositoryPg = AnswerEffectRepositoryPg;
