#!/usr/bin/env tsx
// Check what columns actually exist in the publications table
import { Pool } from "pg";

async function checkSchema() {
  const databaseUrl =
    process.env.DATABASE_PUBLIC_URL || process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error("❌ DATABASE_URL not set");
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false },
  });

  try {
    const client = await pool.connect();

    const result = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'publications'
      ORDER BY ordinal_position;
    `);

    console.log("\n📊 Publications table columns:");
    console.log("================================\n");

    const existingColumns = new Set();
    result.rows.forEach((row) => {
      console.log(
        `${row.column_name.padEnd(30)} ${row.data_type.padEnd(20)} ${row.is_nullable === "YES" ? "NULL" : "NOT NULL"}`,
      );
      existingColumns.add(row.column_name);
    });

    console.log("\n🔍 Checking for missing columns...\n");

    const requiredColumns = [
      "remix_type",
      "original_post_id",
      "remix_count",
      "sound_id",
      "sound_start_time",
    ];

    const missingColumns = requiredColumns.filter(
      (col) => !existingColumns.has(col),
    );

    if (missingColumns.length > 0) {
      console.log("❌ Missing columns:");
      missingColumns.forEach((col) => console.log(`   - ${col}`));
    } else {
      console.log("✅ All required columns exist!");
    }

    client.release();
    await pool.end();
  } catch (error: any) {
    console.error("❌ Failed:", error.message);
    process.exit(1);
  }
}

checkSchema();
