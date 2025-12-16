
import dotenv from "dotenv";
dotenv.config(); // Load .env BEFORE importing storage

import { sql } from "drizzle-orm";

async function main() {
    try {
        // Dynamic import to ensure .env is loaded
        const { db } = await import("../server/storage");

        console.log("Checking columns in 'publications'...");
        const cols = await db.execute(sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'publications';
    `);
        console.log("Columns:", cols.rows);

        console.log("\nChecking constraints on 'publications'...");
        const constraints = await db.execute(sql`
      SELECT con.conname, con.contype, pg_get_constraintdef(con.oid) as def
      FROM pg_catalog.pg_constraint con
      INNER JOIN pg_catalog.pg_class rel ON rel.oid = con.conrelid
      INNER JOIN pg_catalog.pg_namespace nsp ON nsp.oid = connamespace
      WHERE nsp.nspname = 'public' 
      AND rel.relname = 'publications';
    `);
        console.log("Constraints:", constraints.rows);

    } catch (error) {
        console.error("Error:", error);
    }
    process.exit(0);
}

main();
