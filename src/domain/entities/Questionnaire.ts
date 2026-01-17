export interface Questionnaire {
  id: string;
  name: string;
  questions: Question[];
}

export interface Question {
  id: string;
  questionnaireId: string;
  position: number;
  text: string;
  answerOptions: AnswerOption[];
}

export interface AnswerOption {
  id: string;
  questionId: string;
  label: string;
}
