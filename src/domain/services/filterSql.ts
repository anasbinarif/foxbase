import { FilterEffectPayload } from '../entities/AnswerEffect';

export type SqlWhere = {
  clause: string; // without the leading WHERE
  values: unknown[];
};

const ATTRIBUTE_KEY_REGEX = /^[a-zA-Z0-9_]+$/;

function toColumnExpression(field: string): { sql: string; cast?: 'int' | 'numeric' | 'text' } {
  if (field === 'category') return { sql: 'p.category', cast: 'text' };
  if (field === 'priceCents') return { sql: 'p.price_cents', cast: 'int' };

  const prefix = 'attributes.';
  if (field.startsWith(prefix)) {
    const key = field.slice(prefix.length);
    if (!ATTRIBUTE_KEY_REGEX.test(key)) {
      throw new Error(`Invalid attributes key: "${key}"`);
    }
    // attributes are stored as jsonb; ->> returns text
    return { sql: `p.attributes ->> '${key}'`, cast: 'text' };
  }

  throw new Error(`Unsupported field selector: "${field}"`);
}

export function buildProductWhere(filters: FilterEffectPayload[]): SqlWhere {
  const values: unknown[] = [];
  const clauses: string[] = [];

  for (const filter of filters) {
    const { sql: rawExpr, cast } = toColumnExpression(filter.field);

    // For numeric comparisons on attributes (rare), you can cast explicitly.
    const expr =
      (filter.op === 'gte' || filter.op === 'lte') && cast === 'text' && typeof filter.value === 'number'
        ? `(${rawExpr})::numeric`
        : rawExpr;

    switch (filter.op) {
      case 'eq': {
        if (Array.isArray(filter.value)) {
          throw new Error(`eq operator does not accept array value for field "${filter.field}"`);
        }
        values.push(filter.value);
        clauses.push(`${expr} = $${values.length}`);
        break;
      }
      case 'gte': {
        if (Array.isArray(filter.value)) {
          throw new Error(`gte operator does not accept array value for field "${filter.field}"`);
        }
        values.push(filter.value);
        clauses.push(`${expr} >= $${values.length}`);
        break;
      }
      case 'lte': {
        if (Array.isArray(filter.value)) {
          throw new Error(`lte operator does not accept array value for field "${filter.field}"`);
        }
        values.push(filter.value);
        clauses.push(`${expr} <= $${values.length}`);
        break;
      }
      case 'in': {
        if (!Array.isArray(filter.value) || filter.value.length === 0) {
          throw new Error(`in operator requires a non-empty array for field "${filter.field}"`);
        }
        const placeholders: string[] = [];
        for (const v of filter.value) {
          values.push(v);
          placeholders.push(`$${values.length}`);
        }
        clauses.push(`${expr} IN (${placeholders.join(', ')})`);
        break;
      }
      default: {
        // Exhaustiveness check
        const neverOp: never = filter.op;
        throw new Error(`Unsupported operator: ${String(neverOp)}`);
      }
    }
  }

  return {
    clause: clauses.join(' AND '),
    values,
  };
}
