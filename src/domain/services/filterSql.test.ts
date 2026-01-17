import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildProductWhere } from './filterSql';

describe('buildProductWhere', () => {
  it('builds an empty where clause when no filters are provided', () => {
    const where = buildProductWhere([]);
    assert.equal(where.clause, '');
    assert.deepEqual(where.values, []);
  });

  it('builds a safe AND-combined where clause with placeholders', () => {
    const where = buildProductWhere([
      { field: 'category', op: 'eq', value: 'insulation' },
      { field: 'priceCents', op: 'lte', value: 10000 },
      { field: 'attributes.application', op: 'eq', value: 'roof' },
    ]);

    assert.equal(where.clause, "p.category = $1 AND p.price_cents <= $2 AND p.attributes ->> 'application' = $3");
    assert.deepEqual(where.values, ['insulation', 10000, 'roof']);
  });

  it('builds an IN clause with multiple placeholders', () => {
    const where = buildProductWhere([{ field: 'category', op: 'in', value: ['insulation', 'tools'] }]);
    assert.equal(where.clause, 'p.category IN ($1, $2)');
    assert.deepEqual(where.values, ['insulation', 'tools']);
  });
});
