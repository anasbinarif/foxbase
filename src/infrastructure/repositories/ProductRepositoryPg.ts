import { pool } from '../db/pool';
import type { ProductRepository } from '../../application/ports/ProductRepository';
import type { Product } from '../../domain/entities/Product';
import type { FilterEffectPayload } from '../../domain/entities/AnswerEffect';
import { buildProductWhere } from '../../domain/services/filterSql';

type ProductRow = {
  id: string;
  name: string;
  category: string;
  price_cents: number;
  attributes: Record<string, string | number | boolean | null>;
};

export class ProductRepositoryPg implements ProductRepository {
  async findByFilters(filters: FilterEffectPayload[]): Promise<Product[]> {
    const where = buildProductWhere(filters);

    const sql = [
      'SELECT id, name, category, price_cents, attributes',
      'FROM products p',
      where.clause ? `WHERE ${where.clause}` : '',
      'ORDER BY name ASC',
      'LIMIT 50',
    ]
      .filter(Boolean)
      .join('\n');

    const res = await pool.query<ProductRow>(sql, where.values);

    return res.rows.map((r) => ({
      id: r.id,
      name: r.name,
      category: r.category,
      priceCents: r.price_cents,
      attributes: r.attributes ?? {},
    }));
  }

  async findByIds(ids: string[]): Promise<Product[]> {
    if (ids.length === 0) return [];

    const res = await pool.query<ProductRow>(
      'SELECT id, name, category, price_cents, attributes FROM products WHERE id = ANY($1::uuid[])',
      [ids],
    );

    return res.rows.map((r) => ({
      id: r.id,
      name: r.name,
      category: r.category,
      priceCents: r.price_cents,
      attributes: r.attributes ?? {},
    }));
  }
}
