/**
 * Generate correct database URLs for Supabase
 * Usage: SUPABASE_DB_PASSWORD=your_password tsx scripts/fix-db-url.ts
 */

const projectRef = "vuanulvyqkfefmjcikfk";
const password = process.env.SUPABASE_DB_PASSWORD;
const region = "us-east-1";

if (!password) {
  console.error(
    "❌ Set SUPABASE_DB_PASSWORD env var before running this script.",
  );
  process.exit(1);
}

// Option 1: Pooler (transaction mode) - best for serverless
const poolerTransaction = `postgresql://postgres.${projectRef}:${password}@aws-0-${region}.pooler.supabase.com:6543/postgres`;

// Option 2: Pooler (session mode) - for long connections
const poolerSession = `postgresql://postgres.${projectRef}:${password}@aws-0-${region}.pooler.supabase.com:5432/postgres`;

// Option 3: Direct (IPv4) - if available
const directIPv4 = `postgresql://postgres:${password}@db.${projectRef}.supabase.co:5432/postgres`;

console.log("=== Database Connection Options ===\n");
console.log("Option 1 - Pooler (Transaction Mode):");
console.log(poolerTransaction);
console.log("\nOption 2 - Pooler (Session Mode):");
console.log(poolerSession);
console.log("\nOption 3 - Direct IPv4:");
console.log(directIPv4);
