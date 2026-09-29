import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;
const connectionString = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;

export const pool = connectionString
  ? new Pool({ connectionString, max: 2, idleTimeoutMillis: 10000, connectionTimeoutMillis: 10000 })
  : null;

let setupPromise;

export async function ensureDatabase() {
  if (!pool) throw new Error('DATABASE_URL chưa được cấu hình.');
  if (!setupPromise) {
    setupPromise = (async () => {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS birthday_content (
          id integer PRIMARY KEY CHECK (id = 1),
          data jsonb NOT NULL,
          updated_at timestamptz NOT NULL DEFAULT now()
        );
        CREATE TABLE IF NOT EXISTS birthday_profile (
          id integer PRIMARY KEY CHECK (id = 1),
          name text NOT NULL DEFAULT '',
          birth_date text NOT NULL DEFAULT '',
          title text NOT NULL DEFAULT '',
          message text NOT NULL DEFAULT '',
          updated_at timestamptz NOT NULL DEFAULT now()
        );
        CREATE TABLE IF NOT EXISTS birthday_surprise_cards (
          id text PRIMARY KEY,
          image text NOT NULL DEFAULT '',
          title text NOT NULL DEFAULT '',
          description text NOT NULL DEFAULT '',
          action text NOT NULL DEFAULT '',
          sort_order integer NOT NULL DEFAULT 0,
          updated_at timestamptz NOT NULL DEFAULT now()
        );
        CREATE TABLE IF NOT EXISTS birthday_memories (
          id text PRIMARY KEY,
          title text NOT NULL DEFAULT '',
          memory_date text NOT NULL DEFAULT '',
          caption text NOT NULL DEFAULT '',
          image text NOT NULL DEFAULT '',
          rotate numeric NOT NULL DEFAULT 0,
          sort_order integer NOT NULL DEFAULT 0,
          created_at timestamptz NOT NULL DEFAULT now(),
          updated_at timestamptz NOT NULL DEFAULT now()
        );
        CREATE TABLE IF NOT EXISTS birthday_tracks (
          id text PRIMARY KEY,
          name text NOT NULL,
          type text NOT NULL CHECK (type IN ('file', 'url', 'youtube')),
          source text NOT NULL,
          sort_order integer NOT NULL DEFAULT 0,
          created_at timestamptz NOT NULL DEFAULT now(),
          updated_at timestamptz NOT NULL DEFAULT now()
        );
        CREATE TABLE IF NOT EXISTS birthday_media (
          id uuid PRIMARY KEY,
          mime_type text NOT NULL,
          data bytea NOT NULL,
          created_at timestamptz NOT NULL DEFAULT now()
        );
        CREATE TABLE IF NOT EXISTS birthday_cards (
          id text PRIMARY KEY,
          data jsonb NOT NULL,
          created_at timestamptz NOT NULL DEFAULT now()
        );
        CREATE TABLE IF NOT EXISTS birthday_wishes (
          id text PRIMARY KEY,
          data jsonb NOT NULL,
          created_at timestamptz NOT NULL DEFAULT now()
        );
        CREATE TABLE IF NOT EXISTS admin_users (
          id uuid PRIMARY KEY,
          username text NOT NULL UNIQUE,
          password_hash text NOT NULL,
          created_at timestamptz NOT NULL DEFAULT now(),
          updated_at timestamptz NOT NULL DEFAULT now(),
          last_login_at timestamptz
        );
        CREATE INDEX IF NOT EXISTS birthday_memories_sort_idx ON birthday_memories (sort_order, created_at);
        CREATE INDEX IF NOT EXISTS birthday_tracks_sort_idx ON birthday_tracks (sort_order, created_at);
      `);
    })().catch((error) => {
      setupPromise = undefined;
      throw error;
    });
  }
  await setupPromise;
  return pool;
}
