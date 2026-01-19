"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_assert_1 = require("node:assert");
const node_test_1 = __importDefault(require("node:test"));
const EvaluateQuestionnaire_1 = require("../EvaluateQuestionnaire");
const QuestionnaireRepositoryPg_1 = require("../../../infrastructure/repositories/QuestionnaireRepositoryPg");
const AnswerEffectRepositoryPg_1 = require("../../../infrastructure/repositories/AnswerEffectRepositoryPg");
const ProductRepositoryPg_1 = require("../../../infrastructure/repositories/ProductRepositoryPg");
const pool_1 = require("../../../infrastructure/db/pool");
/**
 * Integration test for additive filtering (recommendations).
 * This test requires a running Postgres instance with seeded data.
 * Run: npm run db:setup before running this test.
 */
(0, node_test_1.default)('EvaluateQuestionnaire integration: additive filtering with union approach', async () => {
    const questionnaireRepo = new QuestionnaireRepositoryPg_1.QuestionnaireRepositoryPg();
    const effectRepo = new AnswerEffectRepositoryPg_1.AnswerEffectRepositoryPg();
    const productRepo = new ProductRepositoryPg_1.ProductRepositoryPg();
    const evaluateUseCase = new EvaluateQuestionnaire_1.EvaluateQuestionnaire(questionnaireRepo, effectRepo, productRepo);
    const questionnaireId = '00000000-0000-0000-0000-000000000001';
    // Test case: Roof + Foam + Up to €100
    // This should trigger:
    // - Reductive filters: application=roof AND material=foam AND price<=10000
    //   -> Should match: Roof Foam Basic (€80)
    // - Additive recommendations: "Up to €100" answer adds products 1002 and 1004
    //   -> Roof Foam Plus (€150) and Roof Wool Pro (€220)
    const result = await evaluateUseCase.execute({
        questionnaireId,
        answers: [
            {
                questionId: '00000000-0000-0000-0000-000000000101',
                answerOptionId: '00000000-0000-0000-0000-000000000201', // Roof
            },
            {
                questionId: '00000000-0000-0000-0000-000000000102',
                answerOptionId: '00000000-0000-0000-0000-000000000203', // Foam
            },
            {
                questionId: '00000000-0000-0000-0000-000000000103',
                answerOptionId: '00000000-0000-0000-0000-000000000205', // Up to €100
            },
        ],
    });
    // Validate that we have products from both reductive and additive sources
    node_assert_1.strict.ok(result.products.length > 0, 'Should return products');
    // Find products by name for easier assertions
    const productsByName = new Map(result.products.map((p) => [p.name, p]));
    // Reductive result: Roof Foam Basic should be present
    const roofFoamBasic = productsByName.get('Roof Foam Basic');
    node_assert_1.strict.ok(roofFoamBasic, 'Roof Foam Basic should be in results (reductive filter match)');
    node_assert_1.strict.equal(roofFoamBasic.priceCents, 8000);
    node_assert_1.strict.ok(roofFoamBasic.source === 'reductive' || roofFoamBasic.source === 'both', 'Roof Foam Basic should have reductive or both source');
    // Additive results: Roof Foam Plus and Roof Wool Pro should be present
    const roofFoamPlus = productsByName.get('Roof Foam Plus');
    node_assert_1.strict.ok(roofFoamPlus, 'Roof Foam Plus should be in results (additive recommendation)');
    node_assert_1.strict.equal(roofFoamPlus.priceCents, 15000);
    node_assert_1.strict.equal(roofFoamPlus.id, '00000000-0000-0000-0000-000000001002');
    node_assert_1.strict.ok(roofFoamPlus.source === 'additive' || roofFoamPlus.source === 'both', 'Roof Foam Plus should have additive or both source');
    const roofWoolPro = productsByName.get('Roof Wool Pro');
    node_assert_1.strict.ok(roofWoolPro, 'Roof Wool Pro should be in results (additive recommendation)');
    node_assert_1.strict.equal(roofWoolPro.priceCents, 22000);
    node_assert_1.strict.equal(roofWoolPro.id, '00000000-0000-0000-0000-000000001004');
    node_assert_1.strict.ok(roofWoolPro.source === 'additive' || roofWoolPro.source === 'both', 'Roof Wool Pro should have additive or both source');
    // Validate union approach: products that don't match filters are still included
    // Roof Wool Pro doesn't match the material=foam filter, but should still be present
    node_assert_1.strict.equal(roofWoolPro.attributes.material, 'wool', 'Roof Wool Pro is wool, not foam');
    // Validate that active filters are reported
    node_assert_1.strict.ok(result.activeFilters.length > 0, 'Should have active filters');
    const priceFilter = result.activeFilters.find((f) => f.rule.field === 'priceCents');
    node_assert_1.strict.ok(priceFilter, 'Should have price filter');
    node_assert_1.strict.equal(priceFilter?.rule.op, 'lte');
    node_assert_1.strict.equal(priceFilter?.rule.value, 10000);
    // Validate deduplication: no duplicate product IDs
    const productIds = result.products.map((p) => p.id);
    const uniqueIds = new Set(productIds);
    node_assert_1.strict.equal(productIds.length, uniqueIds.size, 'Products should be deduplicated');
    // Validate ordering: reductive products should come before additive-only products
    const sources = result.products.map((p) => p.source);
    let sawAdditiveOnly = false;
    for (const source of sources) {
        if (source === 'additive') {
            sawAdditiveOnly = true;
        }
        else if (source === 'reductive' && sawAdditiveOnly) {
            node_assert_1.strict.fail('Reductive products should come before additive-only products');
        }
    }
});
(0, node_test_1.default)('EvaluateQuestionnaire integration: reductive only (no recommendations)', async () => {
    const questionnaireRepo = new QuestionnaireRepositoryPg_1.QuestionnaireRepositoryPg();
    const effectRepo = new AnswerEffectRepositoryPg_1.AnswerEffectRepositoryPg();
    const productRepo = new ProductRepositoryPg_1.ProductRepositoryPg();
    const evaluateUseCase = new EvaluateQuestionnaire_1.EvaluateQuestionnaire(questionnaireRepo, effectRepo, productRepo);
    const questionnaireId = '00000000-0000-0000-0000-000000000001';
    // Test case: Roof + Foam + Up to €200
    // This should NOT trigger recommendations (only "Up to €100" has recommendations)
    const result = await evaluateUseCase.execute({
        questionnaireId,
        answers: [
            {
                questionId: '00000000-0000-0000-0000-000000000101',
                answerOptionId: '00000000-0000-0000-0000-000000000201', // Roof
            },
            {
                questionId: '00000000-0000-0000-0000-000000000102',
                answerOptionId: '00000000-0000-0000-0000-000000000203', // Foam
            },
            {
                questionId: '00000000-0000-0000-0000-000000000103',
                answerOptionId: '00000000-0000-0000-0000-000000000206', // Up to €200
            },
        ],
    });
    // All products should be reductive-only
    const hasAdditive = result.products.some((p) => p.source === 'additive' || p.source === 'both');
    node_assert_1.strict.equal(hasAdditive, false, 'Should not have any additive products');
    // Should have reductive matches
    node_assert_1.strict.ok(result.products.length > 0, 'Should return reductive products');
    node_assert_1.strict.ok(result.products.every((p) => p.source === 'reductive'), 'All products should have reductive source');
});
(0, node_test_1.default)('EvaluateQuestionnaire integration: validates questionnaire exists', async () => {
    const questionnaireRepo = new QuestionnaireRepositoryPg_1.QuestionnaireRepositoryPg();
    const effectRepo = new AnswerEffectRepositoryPg_1.AnswerEffectRepositoryPg();
    const productRepo = new ProductRepositoryPg_1.ProductRepositoryPg();
    const evaluateUseCase = new EvaluateQuestionnaire_1.EvaluateQuestionnaire(questionnaireRepo, effectRepo, productRepo);
    await node_assert_1.strict.rejects(async () => {
        await evaluateUseCase.execute({
            questionnaireId: '00000000-0000-0000-0000-999999999999', // Non-existent
            answers: [],
        });
    }, {
        name: 'NotFoundError',
        message: /Questionnaire not found/,
    }, 'Should throw NotFoundError for non-existent questionnaire');
});
(0, node_test_1.default)('EvaluateQuestionnaire integration: validates answer options', async () => {
    const questionnaireRepo = new QuestionnaireRepositoryPg_1.QuestionnaireRepositoryPg();
    const effectRepo = new AnswerEffectRepositoryPg_1.AnswerEffectRepositoryPg();
    const productRepo = new ProductRepositoryPg_1.ProductRepositoryPg();
    const evaluateUseCase = new EvaluateQuestionnaire_1.EvaluateQuestionnaire(questionnaireRepo, effectRepo, productRepo);
    const questionnaireId = '00000000-0000-0000-0000-000000000001';
    await node_assert_1.strict.rejects(async () => {
        await evaluateUseCase.execute({
            questionnaireId,
            answers: [
                {
                    questionId: '00000000-0000-0000-0000-000000000101',
                    answerOptionId: '00000000-0000-0000-0000-999999999999', // Invalid option
                },
            ],
        });
    }, {
        name: 'ValidationError',
        message: /does not belong to questionnaire/,
    }, 'Should throw ValidationError for invalid answer option');
});
// Close pool after all tests
node_test_1.default.after(async () => {
    await pool_1.pool.end();
});
