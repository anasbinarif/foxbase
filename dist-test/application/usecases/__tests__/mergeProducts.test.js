"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_assert_1 = require("node:assert");
const node_test_1 = __importDefault(require("node:test"));
function mergeProducts(reductiveProducts, additiveProducts) {
    const byId = new Map();
    const reductiveOrder = [];
    for (const p of reductiveProducts) {
        const existing = byId.get(p.id);
        if (!existing) {
            byId.set(p.id, { ...p, source: 'reductive' });
            reductiveOrder.push(p.id);
        }
        else if (existing.source === 'additive') {
            existing.source = 'both';
        }
    }
    for (const p of additiveProducts) {
        const existing = byId.get(p.id);
        if (!existing) {
            byId.set(p.id, { ...p, source: 'additive' });
        }
        else if (existing.source === 'reductive') {
            existing.source = 'both';
        }
    }
    const additiveOnly = [];
    for (const [id, p] of byId.entries()) {
        if (!reductiveOrder.includes(id))
            additiveOnly.push(p);
    }
    additiveOnly.sort((a, b) => {
        if (a.name === b.name)
            return a.id.localeCompare(b.id);
        return a.name.localeCompare(b.name);
    });
    return [
        ...reductiveOrder.map((id) => byId.get(id)).filter(Boolean),
        ...additiveOnly,
    ];
}
(0, node_test_1.default)('mergeProducts: union, deduped, with correct source and order', () => {
    const reductive = [
        { id: '1', name: 'B', category: 'c', priceCents: 1, attributes: {} },
        { id: '2', name: 'A', category: 'c', priceCents: 1, attributes: {} },
    ];
    const additive = [
        { id: '2', name: 'A', category: 'c', priceCents: 1, attributes: {} },
        { id: '3', name: 'C', category: 'c', priceCents: 1, attributes: {} },
    ];
    const merged = mergeProducts(reductive, additive);
    node_assert_1.strict.equal(merged.length, 3);
    node_assert_1.strict.deepEqual(merged.map((p) => ({ id: p.id, source: p.source })), [
        { id: '1', source: 'reductive' },
        { id: '2', source: 'both' },
        { id: '3', source: 'additive' },
    ]);
    // Ensure additive-only products are sorted by name then id.
    const last = merged[merged.length - 1];
    node_assert_1.strict.equal(last.id, '3');
});
