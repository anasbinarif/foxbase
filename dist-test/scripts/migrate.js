"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const promises_1 = __importDefault(require("node:fs/promises"));
const node_path_1 = __importDefault(require("node:path"));
const pool_1 = require("../infrastructure/db/pool");
const logger_1 = require("../config/logger");
async function ensureMigrationsTable() {
    await pool_1.pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version text PRIMARY KEY,
      applied_at timestamptz NOT NULL DEFAULT now()
    );
  `);
}
async function getAppliedVersions() {
    const res = await pool_1.pool.query('SELECT version FROM schema_migrations');
    return new Set(res.rows.map((r) => r.version));
}
async function applyMigration(version, sql) {
    const client = await pool_1.pool.connect();
    try {
        await client.query('BEGIN');
        await client.query(sql);
        await client.query('INSERT INTO schema_migrations(version) VALUES ($1)', [version]);
        await client.query('COMMIT');
    }
    catch (err) {
        await client.query('ROLLBACK');
        throw err;
    }
    finally {
        client.release();
    }
}
async function main() {
    await ensureMigrationsTable();
    const migrationsDir = node_path_1.default.join(process.cwd(), 'db', 'migrations');
    const files = (await promises_1.default.readdir(migrationsDir))
        .filter((f) => f.endsWith('.sql'))
        .sort((a, b) => a.localeCompare(b, 'en'));
    const applied = await getAppliedVersions();
    for (const file of files) {
        if (applied.has(file)) {
            logger_1.logger.info({ file }, 'Skipping already applied migration');
            continue;
        }
        const sql = await promises_1.default.readFile(node_path_1.default.join(migrationsDir, file), 'utf8');
        logger_1.logger.info({ file }, 'Applying migration');
        await applyMigration(file, sql);
        logger_1.logger.info({ file }, 'Migration applied');
    }
    await pool_1.pool.end();
}
main().catch((err) => {
    logger_1.logger.error({ err }, 'Migration failed');
    process.exitCode = 1;
});
