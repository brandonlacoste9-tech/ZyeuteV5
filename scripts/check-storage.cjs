const pg = require('pg');

const dbUrl = "postgresql://postgres.vuanulvyqkfefmjcikfk:HOEqEZsZeycL9PRE@aws-1-us-east-1.pooler.supabase.com:5432/postgres";

async function run() {
  const client = new pg.Client({ connectionString: dbUrl });
  try {
    await client.connect();
    console.log("✅ Connected to database");
    
    // Check database size
    const dbSizeRes = await client.query(`SELECT pg_size_pretty(pg_database_size(current_database())) as size;`);
    console.log(`Database Size: ${dbSizeRes.rows[0].size}`);

    // Check table sizes
    const tableSizes = await client.query(`
      SELECT nspname || '.' || relname AS "relation",
      pg_size_pretty(pg_total_relation_size(C.oid)) AS "total_size"
      FROM pg_class C
      LEFT JOIN pg_namespace N ON (N.oid = C.relnamespace)
      WHERE nspname NOT IN ('pg_catalog', 'information_schema')
      AND C.relkind <> 'i'
      AND nspname !~ '^pg_toast'
      ORDER BY pg_total_relation_size(C.oid) DESC
      LIMIT 20;
    `);
    
    console.log("\n📊 Top 20 Largest Tables:");
    tableSizes.rows.forEach(row => {
      console.log(`- ${row.relation}: ${row.total_size}`);
    });

  } catch (err) {
    console.error("❌ Failed to query database:", err.message);
  } finally {
    await client.end();
  }
}

run();
