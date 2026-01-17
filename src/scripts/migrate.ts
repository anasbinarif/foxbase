import fs from 'node:fs/promises';
import path from 'node:path';
import { pool } from '../infrastructure/db/pool';
import { logger } from '../config/logger';

type MigrationRow = { version: string };

async function ensureMigrationsTable(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version text PRIMARY KEY,
      applied_at timestamptz NOT NULL DEFAULT now()
    );
  `);
}

async function getAppliedVersions(): Promise<Set<string>> {
  const res = await pool.query<MigrationRow>('SELECT version FROM schema_migrations');
  return new Set(res.rows.map((r) => r.version));
}

async function applyMigration(version: string, sql: string): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('INSERT INTO schema_migrations(version) VALUES ($1)', [version]);
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function main(): Promise<void> {
  await ensureMigrationsTable();

  const migrationsDir = path.join(process.cwd(), 'db', 'migrations');
  const files = (await fs.readdir(migrationsDir))
    .filter((f) => f.endsWith('.sql'))
    .sort((a, b) => a.localeCompare(b, 'en'));

  const applied = await getAppliedVersions();

  for (const file of files) {
    if (applied.has(file)) {
      logger.info({ file }, 'Skipping already applied migration');
      continue;
    }
    const sql = await fs.readFile(path.join(migrationsDir, file), 'utf8');
    logger.info({ file }, 'Applying migration');
    await applyMigration(file, sql);
    logger.info({ file }, 'Migration applied');
  }

  await pool.end();
}

main().catch((err) => {
  logger.error({ err }, 'Migration failed');
  process.exitCode = 1;
});
