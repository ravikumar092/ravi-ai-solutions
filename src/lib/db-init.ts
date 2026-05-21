import pg from 'pg';

const { Pool } = pg;

let initialized = false;

export async function initDb() {
  if (initialized) return;
  initialized = true;

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS replit_users (
        id TEXT PRIMARY KEY,
        email TEXT,
        first_name TEXT,
        last_name TEXT,
        profile_image_url TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS sessions (
        sid TEXT PRIMARY KEY,
        sess JSONB NOT NULL,
        expire TIMESTAMPTZ NOT NULL
      );

      CREATE INDEX IF NOT EXISTS sessions_expire_idx ON sessions (expire);

      -- user_admin_roles lives in Supabase (user_roles table)
    `);
    console.log('[db-init] Tables ready');
  } catch (e) {
    console.error('[db-init] Error creating tables:', e);
  } finally {
    await pool.end();
  }
}
