
import "dotenv/config";
import { db } from "./storage";
import { sql } from "drizzle-orm";

async function enableExtras() {
  console.log("Enabling database extensions...");
  try {
    await db.execute(sql`CREATE EXTENSION IF NOT EXISTS vector;`);
    console.log("✅ pgvector enabled");
  } catch (e) {
    console.error("Failed to enable vector:", e);
  }
  
  try {
     await db.execute(sql`CREATE EXTENSION IF NOT EXISTS postgis;`);
     console.log("✅ postgis enabled");
  } catch (e) {
     console.error("Failed to enable postgis (might not be available or needed):", e);
  }
}

enableExtras()
  .catch(console.error)
  .finally(() => process.exit());
