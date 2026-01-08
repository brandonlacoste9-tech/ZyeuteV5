#!/usr/bin/env tsx
/**
 * Verify GIN Indexes for AI Discovery
 * Checks that all performance indexes are created and being used correctly
 */

import { config } from "dotenv";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import pg from "pg";

const { Client } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
config({ path: join(__dirname, "../.env") });

const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[36m",
  bright: "\x1b[1m",
  cyan: "\x1b[36m",
};

function log(message: string, color: keyof typeof colors = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

const DATABASE_URL = process.env.DATABASE_URL || process.env.DIRECT_DATABASE_URL;

if (!DATABASE_URL) {
  log("❌ DATABASE_URL not found", "red");
  process.exit(1);
}

const REQUIRED_INDEXES = [
  "idx_posts_ai_labels_gin",
  "idx_posts_media_metadata_gin",
  "idx_posts_discovery_composite",
  "idx_posts_vibe_category",
  "idx_posts_processing_status",
];

interface IndexInfo {
  indexname: string;
  indexdef: string;
  indexsize: string;
}

async function verifyIndexes() {
  const client = new Client({ connectionString: DATABASE_URL });

  try {
    await client.connect();
    log("\n" + "=".repeat(60), "bright");
    log("🔍 Verifying GIN Indexes for AI Discovery", "bright");
    log("=".repeat(60) + "\n", "bright");

    // Check if indexes exist
    log("📋 Checking Index Existence:\n", "cyan");
    const indexQuery = `
      SELECT 
        indexname,
        indexdef,
        pg_size_pretty(pg_relation_size(indexname::regclass)) as indexsize
      FROM pg_indexes
      WHERE schemaname = 'public'
        AND tablename = 'publications'
        AND indexname IN (${REQUIRED_INDEXES.map((_, i) => `$${i + 1}`).join(", ")})
      ORDER BY indexname;
    `;

    const result = await client.query(indexQuery, REQUIRED_INDEXES);
    const foundIndexes = result.rows.map((row: IndexInfo) => row.indexname);

    // Report status for each required index
    for (const indexName of REQUIRED_INDEXES) {
      if (foundIndexes.includes(indexName)) {
        const indexInfo = result.rows.find((r: IndexInfo) => r.indexname === indexName);
        log(`✅ ${indexName}`, "green");
        if (indexInfo) {
          log(`   Size: ${indexInfo.indexsize}`, "blue");
          log(`   Type: ${indexInfo.indexdef.includes("GIN") ? "GIN" : "B-tree"}`, "blue");
        }
      } else {
        log(`❌ ${indexName} - NOT FOUND`, "red");
      }
    }

    // Check index usage with sample queries
    log("\n📊 Testing Index Usage:\n", "cyan");

    // Test 1: AI Labels query
    log("Test 1: AI Labels Query (?| operator)", "yellow");
    const explain1 = await client.query(`
      EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
      SELECT id, ai_labels
      FROM publications
      WHERE ai_labels ?| ARRAY['poutine', 'montreal']::text[]
        AND processing_status = 'completed'
      LIMIT 10;
    `);
    const plan1 = explain1.rows[0]["QUERY PLAN"][0];
    const usesIndex1 = JSON.stringify(plan1).includes("idx_posts_ai_labels_gin");
    if (usesIndex1) {
      log(`   ✅ Using GIN index (Execution time: ${plan1["Execution Time"]?.toFixed(2)}ms)`, "green");
    } else {
      log(`   ⚠️  Not using expected index (may need VACUUM ANALYZE)`, "yellow");
    }

    // Test 2: Vibe category query
    log("\nTest 2: Vibe Category Query", "yellow");
    const explain2 = await client.query(`
      EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
      SELECT id, media_metadata->>'vibe_category' as vibe
      FROM publications
      WHERE media_metadata->>'vibe_category' = 'party'
        AND processing_status = 'completed'
      LIMIT 10;
    `);
    const plan2 = explain2.rows[0]["QUERY PLAN"][0];
    const usesIndex2 = JSON.stringify(plan2).includes("idx_posts_vibe_category") ||
                       JSON.stringify(plan2).includes("idx_posts_media_metadata_gin");
    if (usesIndex2) {
      log(`   ✅ Using index (Execution time: ${plan2["Execution Time"]?.toFixed(2)}ms)`, "green");
    } else {
      log(`   ⚠️  Not using expected index`, "yellow");
    }

    // Test 3: Composite discovery query
    log("\nTest 3: Composite Discovery Query", "yellow");
    const explain3 = await client.query(`
      EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
      SELECT id, ai_labels, media_metadata
      FROM publications
      WHERE processing_status = 'completed'
        AND hive_id = 'quebec'
        AND ai_labels IS NOT NULL
      ORDER BY fire_count DESC
      LIMIT 20;
    `);
    const plan3 = explain3.rows[0]["QUERY PLAN"][0];
    const usesIndex3 = JSON.stringify(plan3).includes("idx_posts_discovery_composite");
    if (usesIndex3) {
      log(`   ✅ Using composite index (Execution time: ${plan3["Execution Time"]?.toFixed(2)}ms)`, "green");
    } else {
      log(`   ⚠️  Not using composite index`, "yellow");
    }

    // Summary
    log("\n" + "=".repeat(60), "bright");
    const allFound = REQUIRED_INDEXES.every((idx) => foundIndexes.includes(idx));
    if (allFound) {
      log("✅ All required indexes are present!", "green");
    } else {
      log("⚠️  Some indexes are missing. Run migration 0013_add_ai_discovery_indexes.sql", "yellow");
    }
    log("=".repeat(60) + "\n", "bright");

    // Performance recommendation
    log("💡 Performance Tips:", "cyan");
    log("   - Run VACUUM ANALYZE publications; after creating indexes", "blue");
    log("   - Monitor index usage with: SELECT * FROM pg_stat_user_indexes;", "blue");
    log("   - Index sizes will grow with data - monitor disk usage", "blue");

  } catch (error: any) {
    log(`\n❌ Error: ${error.message}`, "red");
    if (error.stack) {
      log(`\nStack:\n${error.stack}`, "yellow");
    }
    process.exit(1);
  } finally {
    await client.end();
  }
}

verifyIndexes().catch((error) => {
  log(`\n❌ Fatal error: ${error.message}`, "red");
  process.exit(1);
});
