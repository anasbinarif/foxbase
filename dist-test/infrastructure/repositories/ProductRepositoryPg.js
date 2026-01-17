"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductRepositoryPg = void 0;
const pool_1 = require("../db/pool");
const filterSql_1 = require("../../domain/services/filterSql");
class ProductRepositoryPg {
    async findByFilters(filters) {
        const where = (0, filterSql_1.buildProductWhere)(filters);
        const sql = [
            'SELECT id, name, category, price_cents, attributes',
            'FROM products p',
            where.clause ? `WHERE ${where.clause}` : '',
            'ORDER BY name ASC',
            'LIMIT 50',
        ]
            .filter(Boolean)
            .join('\n');
        const res = await pool_1.pool.query(sql, where.values);
        return res.rows.map((r) => ({
            id: r.id,
            name: r.name,
            category: r.category,
            priceCents: r.price_cents,
            attributes: r.attributes ?? {},
        }));
    }
    async findByIds(ids) {
        if (ids.length === 0)
            return [];
        const res = await pool_1.pool.query('SELECT id, name, category, price_cents, attributes FROM products WHERE id = ANY($1::uuid[])', [ids]);
        return res.rows.map((r) => ({
            id: r.id,
            name: r.name,
            category: r.category,
            priceCents: r.price_cents,
            attributes: r.attributes ?? {},
        }));
    }
}
exports.ProductRepositoryPg = ProductRepositoryPg;
