/**
 * Generate correct database URLs for Supabase
 */

const projectRef = "vuanulvyqkfefmjcikfk";
const password = "HOEqEZsZeycL9PRE";
const region = "us-east-1";

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
console.log("\nOption 3 - Direct (may not work from all locations):");
console.log(directIPv4);
console.log("\n=== Recommendation ===");
console.log("Use Option 1 (Transaction Mode) for Render/Railway");
console.log("Use Option 2 (Session Mode) if you need prepared statements");
