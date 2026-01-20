import { pool } from '../infrastructure/db/pool';
import { logger } from '../config/logger';

const QUESTIONNAIRE_ID = '00000000-0000-0000-0000-000000000001';

const QUESTIONS = [
  {
    id: '00000000-0000-0000-0000-000000000101',
    questionnaireId: QUESTIONNAIRE_ID,
    position: 1,
    text: 'Where will the product be used?',
  },
  {
    id: '00000000-0000-0000-0000-000000000102',
    questionnaireId: QUESTIONNAIRE_ID,
    position: 2,
    text: 'Preferred material?',
  },
  {
    id: '00000000-0000-0000-0000-000000000103',
    questionnaireId: QUESTIONNAIRE_ID,
    position: 3,
    text: 'What is your max budget?',
  },
  {
    id: '00000000-0000-0000-0000-000000000104',
    questionnaireId: QUESTIONNAIRE_ID,
    position: 4,
    text: 'Any special requirements?',
  },
] as const;

const ANSWER_OPTIONS = [
  // Q1
  { id: '00000000-0000-0000-0000-000000000201', questionId: QUESTIONS[0].id, label: 'Roof' },
  { id: '00000000-0000-0000-0000-000000000202', questionId: QUESTIONS[0].id, label: 'Wall' },
  // Q2
  { id: '00000000-0000-0000-0000-000000000203', questionId: QUESTIONS[1].id, label: 'Foam' },
  { id: '00000000-0000-0000-0000-000000000204', questionId: QUESTIONS[1].id, label: 'Wool' },
  // Q3
  { id: '00000000-0000-0000-0000-000000000205', questionId: QUESTIONS[2].id, label: 'Up to €100' },
  { id: '00000000-0000-0000-0000-000000000206', questionId: QUESTIONS[2].id, label: 'Up to €200' },
  { id: '00000000-0000-0000-0000-000000000207', questionId: QUESTIONS[2].id, label: 'No limit' },
  // Q4
  { id: '00000000-0000-0000-0000-000000000208', questionId: QUESTIONS[3].id, label: 'Premium fire rating' },
  { id: '00000000-0000-0000-0000-000000000209', questionId: QUESTIONS[3].id, label: 'No special requirements' },
] as const;

const ANSWER_EFFECTS = [
  // Q1 effects (application)
  {
    id: '00000000-0000-0000-0000-000000000301',
    answerOptionId: '00000000-0000-0000-0000-000000000201',
    type: 'filter',
    payload: { field: 'attributes.application', op: 'eq', value: 'roof' },
  },
  {
    id: '00000000-0000-0000-0000-000000000302',
    answerOptionId: '00000000-0000-0000-0000-000000000202',
    type: 'filter',
    payload: { field: 'attributes.application', op: 'eq', value: 'wall' },
  },
  // Q2 effects (material)
  {
    id: '00000000-0000-0000-0000-000000000303',
    answerOptionId: '00000000-0000-0000-0000-000000000203',
    type: 'filter',
    payload: { field: 'attributes.material', op: 'eq', value: 'foam' },
  },
  {
    id: '00000000-0000-0000-0000-000000000304',
    answerOptionId: '00000000-0000-0000-0000-000000000204',
    type: 'filter',
    payload: { field: 'attributes.material', op: 'eq', value: 'wool' },
  },
  // Q3 effects (budget)
  {
    id: '00000000-0000-0000-0000-000000000305',
    answerOptionId: '00000000-0000-0000-0000-000000000205',
    type: 'filter',
    payload: { field: 'priceCents', op: 'lte', value: 10000 },
  },
  {
    id: '00000000-0000-0000-0000-000000000306',
    answerOptionId: '00000000-0000-0000-0000-000000000206',
    type: 'filter',
    payload: { field: 'priceCents', op: 'lte', value: 20000 },
  },
  // Note: "No limit" has no filter effect by design.
  // Recommendation using explicit product IDs (existing approach)
  {
    id: '00000000-0000-0000-0000-000000000307',
    answerOptionId: '00000000-0000-0000-0000-000000000205',
    type: 'recommendation',
    payload: {
      productIds: [
        '00000000-0000-0000-0000-000000001002',
        '00000000-0000-0000-0000-000000001004',
      ],
    },
  },
  // Q4 effects - Recommendation using attribute-based filters (new approach)
  {
    id: '00000000-0000-0000-0000-000000000308',
    answerOptionId: '00000000-0000-0000-0000-000000000208', // Premium fire rating
    type: 'recommendation',
    payload: {
      filters: [
        { field: 'attributes.fireRating', op: 'eq', value: 'A' },
      ],
    },
  },
  // Combined approach - using BOTH explicit IDs and attribute-based filters
  {
    id: '00000000-0000-0000-0000-000000000309',
    answerOptionId: '00000000-0000-0000-0000-000000000207', // No limit
    type: 'recommendation',
    payload: {
      productIds: [
        '00000000-0000-0000-0000-000000001003', // Roof Wool Eco (explicit)
      ],
      filters: [
        { field: 'attributes.thicknessMm', op: 'gte', value: 50 }, // Also add thick products
      ],
    },
  },
] as const;

const PRODUCTS = [
  {
    id: '00000000-0000-0000-0000-000000001001',
    name: 'Roof Foam Basic',
    category: 'insulation',
    priceCents: 8000,
    attributes: { application: 'roof', material: 'foam', fireRating: 'B', thicknessMm: 20 },
  },
  {
    id: '00000000-0000-0000-0000-000000001002',
    name: 'Roof Foam Plus',
    category: 'insulation',
    priceCents: 15000,
    attributes: { application: 'roof', material: 'foam', fireRating: 'A', thicknessMm: 50 },
  },
  {
    id: '00000000-0000-0000-0000-000000001003',
    name: 'Roof Wool Eco',
    category: 'insulation',
    priceCents: 9000,
    attributes: { application: 'roof', material: 'wool', fireRating: 'B', thicknessMm: 40 },
  },
  {
    id: '00000000-0000-0000-0000-000000001004',
    name: 'Roof Wool Pro',
    category: 'insulation',
    priceCents: 22000,
    attributes: { application: 'roof', material: 'wool', fireRating: 'A', thicknessMm: 80 },
  },
  {
    id: '00000000-0000-0000-0000-000000001005',
    name: 'Wall Foam Basic',
    category: 'insulation',
    priceCents: 7000,
    attributes: { application: 'wall', material: 'foam', fireRating: 'B', thicknessMm: 20 },
  },
  {
    id: '00000000-0000-0000-0000-000000001006',
    name: 'Wall Foam Plus',
    category: 'insulation',
    priceCents: 13000,
    attributes: { application: 'wall', material: 'foam', fireRating: 'A', thicknessMm: 50 },
  },
  {
    id: '00000000-0000-0000-0000-000000001007',
    name: 'Wall Wool Eco',
    category: 'insulation',
    priceCents: 11000,
    attributes: { application: 'wall', material: 'wool', fireRating: 'B', thicknessMm: 40 },
  },
  {
    id: '00000000-0000-0000-0000-000000001008',
    name: 'Wall Wool Pro',
    category: 'insulation',
    priceCents: 25000,
    attributes: { application: 'wall', material: 'wool', fireRating: 'A', thicknessMm: 80 },
  },
] as const;

async function main(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(
      'INSERT INTO questionnaires(id, name) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING',
      [QUESTIONNAIRE_ID, 'Example Insulation Finder'],
    );

    for (const q of QUESTIONS) {
      await client.query(
        'INSERT INTO questions(id, questionnaire_id, position, text) VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO NOTHING',
        [q.id, q.questionnaireId, q.position, q.text],
      );
    }

    for (const o of ANSWER_OPTIONS) {
      await client.query(
        'INSERT INTO answer_options(id, question_id, label) VALUES ($1, $2, $3) ON CONFLICT (id) DO NOTHING',
        [o.id, o.questionId, o.label],
      );
    }

    for (const e of ANSWER_EFFECTS) {
      await client.query(
        'INSERT INTO answer_effects(id, answer_option_id, type, payload) VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO NOTHING',
        [e.id, e.answerOptionId, e.type, e.payload],
      );
    }

    for (const p of PRODUCTS) {
      await client.query(
        'INSERT INTO products(id, name, category, price_cents, attributes) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (id) DO NOTHING',
        [p.id, p.name, p.category, p.priceCents, p.attributes],
      );
    }

    await client.query('COMMIT');
    logger.info(' demonstration data seeded');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  logger.error({ err }, 'Seed failed');
  process.exitCode = 1;
});
