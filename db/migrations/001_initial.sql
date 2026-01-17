-- 001_initial.sql
-- Basic schema for the reductive filtering service.
-- Keep it simple and explicit: this repo is meant to be extended in the coding challenge.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS questionnaires (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL
);

CREATE TABLE IF NOT EXISTS questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  questionnaire_id uuid NOT NULL REFERENCES questionnaires(id) ON DELETE CASCADE,
  position int NOT NULL,
  text text NOT NULL,
  UNIQUE(questionnaire_id, position)
);

CREATE INDEX IF NOT EXISTS idx_questions_questionnaire_id ON questions(questionnaire_id);

CREATE TABLE IF NOT EXISTS answer_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  label text NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_answer_options_question_id ON answer_options(question_id);

-- An answer can have one or more "effects" that are configured in the DB.
-- In the starter, we only support the reductive filtering effect type: 'filter'.
CREATE TABLE IF NOT EXISTS answer_effects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  answer_option_id uuid NOT NULL REFERENCES answer_options(id) ON DELETE CASCADE,
  type text NOT NULL,
  payload jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_answer_effects_answer_option_id ON answer_effects(answer_option_id);
CREATE INDEX IF NOT EXISTS idx_answer_effects_type ON answer_effects(type);

CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL,
  price_cents int NOT NULL,
  attributes jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_price_cents ON products(price_cents);
