import { Client } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

async function checkPolicies() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('No DATABASE_URL found in environment variables.');
    process.exit(1);
  }

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    const res = await client.query(`
      SELECT policyname, cmd, roles
      FROM pg_policies
      WHERE schemaname='public'
        AND tablename='publications'
        AND cmd='SELECT';
    `);
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error('Error connecting or querying:', err);
  } finally {
    await client.end();
  }
}

checkPolicies();
