"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetQuestionnaire = void 0;
const errors_1 = require("../errors");
class GetQuestionnaire {
    questionnaireRepo;
    constructor(questionnaireRepo) {
        this.questionnaireRepo = questionnaireRepo;
    }
    async execute(questionnaireId) {
        const questionnaire = await this.questionnaireRepo.getById(questionnaireId);
        if (!questionnaire) {
            throw new errors_1.NotFoundError(`Questionnaire not found: ${questionnaireId}`);
        }
        return questionnaire;
    }
}
exports.GetQuestionnaire = GetQuestionnaire;
