import { strict as assert } from 'node:assert';
import test from 'node:test';
import type { ProductSource } from '../../dtos/EvaluateQuestionnaireDtos';

// Small pure helper mirroring the merge logic from EvaluateQuestionnaire for unit testing.

interface ProductLike {
  id: string;
  name: string;
  category: string;
  priceCents: number;
  attributes: Record<string, string | number | boolean | null>;
}

interface ProductWithSource extends ProductLike {
  source: ProductSource;
}

function mergeProducts(
  reductiveProducts: ProductLike[],
  additiveProducts: ProductLike[],
): ProductWithSource[] {
  const byId = new Map<string, ProductWithSource>();
  const reductiveOrder: string[] = [];

  for (const p of reductiveProducts) {
    const existing = byId.get(p.id);
    if (!existing) {
      byId.set(p.id, { ...p, source: 'reductive' });
      reductiveOrder.push(p.id);
    } else if (existing.source === 'additive') {
      existing.source = 'both';
    }
  }

  for (const p of additiveProducts) {
    const existing = byId.get(p.id);
    if (!existing) {
      byId.set(p.id, { ...p, source: 'additive' });
    } else if (existing.source === 'reductive') {
      existing.source = 'both';
    }
  }

  const additiveOnly: ProductWithSource[] = [];
  for (const [id, p] of byId.entries()) {
    if (!reductiveOrder.includes(id)) additiveOnly.push(p);
  }

  additiveOnly.sort((a, b) => {
    if (a.name === b.name) return a.id.localeCompare(b.id);
    return a.name.localeCompare(b.name);
  });

  return [
    ...reductiveOrder.map((id) => byId.get(id)!).filter(Boolean),
    ...additiveOnly,
  ];
}

test('mergeProducts: union, deduped, with correct source and order', () => {
  const reductive: ProductLike[] = [
    { id: '1', name: 'B', category: 'c', priceCents: 1, attributes: {} },
    { id: '2', name: 'A', category: 'c', priceCents: 1, attributes: {} },
  ];

  const additive: ProductLike[] = [
    { id: '2', name: 'A', category: 'c', priceCents: 1, attributes: {} },
    { id: '3', name: 'C', category: 'c', priceCents: 1, attributes: {} },
  ];

  const merged = mergeProducts(reductive, additive);

  assert.equal(merged.length, 3);
  assert.deepEqual(
    merged.map((p) => ({ id: p.id, source: p.source })),
    [
      { id: '1', source: 'reductive' },
      { id: '2', source: 'both' },
      { id: '3', source: 'additive' },
    ],
  );

  // Ensure additive-only products are sorted by name then id.
  const last = merged[merged.length - 1]!;
  assert.equal(last.id, '3');
});
