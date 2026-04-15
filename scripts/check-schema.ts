#!/usr/bin/env tsx
// Check what columns actually exist in the publications and user_profiles tables
import "dotenv/config";
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
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
      SELECT table_name, column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name IN ('publications', 'user_profiles')
      ORDER BY table_name, ordinal_position;
    `);

    console.log("\n📊 Table columns:");
    console.log("================================\n");

    const tableColumns = new Map<string, Set<string>>();

    result.rows.forEach((row) => {
      console.log(
        `${row.table_name.padEnd(20)} | ${row.column_name.padEnd(30)} | ${row.data_type.padEnd(20)} | ${row.is_nullable === "YES" ? "NULL" : "NOT NULL"}`,
      );
      if (!tableColumns.has(row.table_name)) {
        tableColumns.set(row.table_name, new Set());
      }
      tableColumns.get(row.table_name)!.add(row.column_name);
    });

    console.log("\n🔍 Checking for missing columns in user_profiles...\n");

    const requiredUserColumns = [
      "parent_id",
      "ti_guy_comments_enabled",
      "hive_id",
      "karma_credits",
      "cash_credits",
      "total_gifts_sent",
      "total_gifts_received",
      "legendary_badges",
      "tax_id",
      "bee_alias",
      "nectar_points",
      "current_streak",
      "max_streak",
      "last_daily_bonus",
      "unlocked_hives",
      "raison_bannissement",
    ];

    const userCols = tableColumns.get("user_profiles") || new Set();
    const missingUserCols = requiredUserColumns.filter(
      (col) => !userCols.has(col),
    );

    if (missingUserCols.length > 0) {
      console.log("❌ Missing columns in user_profiles:");
      missingUserCols.forEach((col) => console.log(`   - ${col}`));
    } else {
      console.log("✅ All required columns exist in user_profiles!");
    }

    client.release();
    await pool.end();
  } catch (error: any) {
    console.error("❌ Failed:", error.message);
    process.exit(1);
  }
}

checkSchema();
