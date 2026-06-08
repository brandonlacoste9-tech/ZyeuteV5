import pg from "pg";

/** One-shot pg.Client — bypasses the shared pool (Render pooler saturation). */
export function createDirectClient(): pg.Client {
  return new pg.Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 15000,
  });
}

export type PgQueryable = Pick<pg.Client, "query">;

/** Run a SQL script on a dedicated connection (used for startup migrations). */
export async function runSqlScript(sql: string): Promise<void> {
  const client = createDirectClient();
  await client.connect();
  try {
    await client.query(sql);
  } finally {
    await client.end().catch(() => {});
  }
}
