import { sql } from "./db";

let ready: Promise<unknown> | null = null;

function ensureTable() {
  ready ??= sql`
    CREATE TABLE IF NOT EXISTS auth_attempts (
      id BIGSERIAL PRIMARY KEY,
      key TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `.then(() => sql`CREATE INDEX IF NOT EXISTS auth_attempts_key_time ON auth_attempts (key, created_at)`);
  return ready;
}

export async function assertUnderLimit(key: string, max: number, windowMinutes: number) {
  await ensureTable();
  const [{ n }] = await sql`
    SELECT count(*)::int AS n FROM auth_attempts
    WHERE key = ${key} AND created_at > NOW() - make_interval(mins => ${windowMinutes})
  `;
  if (n >= max) throw new Error("Too many attempts. Please wait a few minutes and try again.");
}

export async function recordAttempt(key: string) {
  await ensureTable();
  await sql`INSERT INTO auth_attempts (key) VALUES (${key})`;
  if (Math.random() < 0.02) {
    await sql`DELETE FROM auth_attempts WHERE created_at < NOW() - INTERVAL '1 day'`;
  }
}

export async function clearAttempts(key: string) {
  await ensureTable();
  await sql`DELETE FROM auth_attempts WHERE key = ${key}`;
}
