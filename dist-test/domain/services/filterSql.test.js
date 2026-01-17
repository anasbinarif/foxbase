"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = require("node:test");
const strict_1 = __importDefault(require("node:assert/strict"));
const filterSql_1 = require("./filterSql");
(0, node_test_1.describe)('buildProductWhere', () => {
    (0, node_test_1.it)('builds an empty where clause when no filters are provided', () => {
        const where = (0, filterSql_1.buildProductWhere)([]);
        strict_1.default.equal(where.clause, '');
        strict_1.default.deepEqual(where.values, []);
    });
    (0, node_test_1.it)('builds a safe AND-combined where clause with placeholders', () => {
        const where = (0, filterSql_1.buildProductWhere)([
            { field: 'category', op: 'eq', value: 'insulation' },
            { field: 'priceCents', op: 'lte', value: 10000 },
            { field: 'attributes.application', op: 'eq', value: 'roof' },
        ]);
        strict_1.default.equal(where.clause, "p.category = $1 AND p.price_cents <= $2 AND p.attributes ->> 'application' = $3");
        strict_1.default.deepEqual(where.values, ['insulation', 10000, 'roof']);
    });
    (0, node_test_1.it)('builds an IN clause with multiple placeholders', () => {
        const where = (0, filterSql_1.buildProductWhere)([{ field: 'category', op: 'in', value: ['insulation', 'tools'] }]);
        strict_1.default.equal(where.clause, 'p.category IN ($1, $2)');
        strict_1.default.deepEqual(where.values, ['insulation', 'tools']);
    });
});
