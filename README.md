# FoxBase Filtering Starter (Reductive + Additive Filtering)

This repository is a **starter codebase** for a simplified version of FoxBase's questionnaire-driven filtering system.

It now supports:

- **Reductive filtering** (AND-combined SQL filters)
- **Additive recommendations** (products explicitly added based on certain answers)

---

## What the system does

1. A customer configures a questionnaire (questions + answer options).
2. Each answer option can have one or more **effects** configured in Postgres.
3. Supported effect types:
    - `filter`: contributes a SQL `WHERE` condition that reduces the product set.
    - `recommendation`: adds specific products by ID as additive recommendations.
4. The backend evaluates the current set of answers and returns:
    - the remaining products (reductive ∪ additive, deduped)
    - the active reductive filters.

---

## Tech stack

- **Node.js**, **Express**
- **Postgres**
- **TypeScript**
- Validation: **zod**
- Logging: **pino**

---

## Project structure (high level)

- `src/domain/*`  
  Pure domain types and logic (e.g. filter → SQL builder).
- `src/application/*`  
  Use cases + ports (interfaces). No Express, no Postgres details.
- `src/infrastructure/*`  
  Postgres pool + repository implementations.
- `src/presentation/*`  
  Express app, routes, controllers, and error mapping.
- `db/migrations/*`  
  SQL migrations.
- `src/scripts/*`  
  Tiny migration runner + seed script.

---

## Quickstart

### 1) Start Postgres
```bash
docker compose up -d
```

### 2) Configure env
```bash
cp .env.example .env
```

### 3) Install deps
```bash
npm install
```

### 4) Run migrations + seed
```bash
npm run db:setup
```

### 5) Start the API
```bash
npm run dev
```

API will be available at `http://localhost:3000/api/v1`.

---

## API endpoints

### Health
`GET /api/v1/health`

### Get questionnaire (seeded example)
`GET /api/v1/questionnaires/:questionnaireId`

Seeded questionnaire id:
- `00000000-0000-0000-0000-000000000001`

Example:
```bash
curl http://localhost:3000/api/v1/questionnaires/00000000-0000-0000-0000-000000000001
```

### Evaluate questionnaire (apply reductive filters + additive recommendations)
`POST /api/v1/questionnaires/:questionnaireId/evaluate`

Example (Roof + Foam + Up to €100, where the budget answer also configures additive recommendations):
```bash
curl -X POST http://localhost:3000/api/v1/questionnaires/00000000-0000-0000-0000-000000000001/evaluate \
  -H 'content-type: application/json' \
  -d '{
    "answers": [
      { "questionId": "00000000-0000-0000-0000-000000000101", "answerOptionId": "00000000-0000-0000-0000-000000000201" },
      { "questionId": "00000000-0000-0000-0000-000000000102", "answerOptionId": "00000000-0000-0000-0000-000000000203" },
      { "questionId": "00000000-0000-0000-0000-000000000103", "answerOptionId": "00000000-0000-0000-0000-000000000205" }
    ]
  }'
```

Response shape:
- `products`: array of products with a `source` field:
    - `source: 'reductive' | 'additive' | 'both'`
- `activeFilters`: the filter rules that were triggered by the selected answer options.

Behavior:
- Final result is the **union** of reductive and additive products (even if additive products wouldn’t match the filters).
- Products are **deduplicated by ID**.
- Order is deterministic:
    - All products in the reductive result first (in their filtered order).
    - Then products that only come from additive recommendations, sorted by `name ASC, id ASC`.

---

## Extensibility hint (for interview exercises)

The schema uses `answer_effects(type, payload)` instead of hardcoding behavior in code.  
In the starter, only `type = 'filter'` is supported.

A natural extension is to add a new effect type, for example:
- `type = 'recommendation'`

…which would be computed **in addition** to the reductive filters.

---

## Tests

```bash
npm test
```

The suite includes unit tests for the SQL filter builder and for the additive merge logic.

The test suite runs on Node.js' built-in test runner (`node:test`) and compiles TypeScript to `dist-test/` for execution.

---

## Notes

- The migration runner is intentionally small and lives in `src/scripts/migrate.ts`.
- This codebase is meant for interview use; it is not a production-ready system.
