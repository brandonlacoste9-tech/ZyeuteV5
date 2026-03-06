import "dotenv/config";
import fs from "fs";
import path from "path";
import postgres from "postgres";

/**
 * generate-zyeute-knowledge.ts
 *
 * Generates the vertex_search_data.jsonl for your $1,367.95 GenAI Credit.
 * Pulls from:
 * 1. Local Documentation (/docs)
 * 2. Supabase Publications (Live Posts)
 * 3. Supabase Profiles (Public Users)
 */

const SQL_URL = process.env.DATABASE_URL;
const OUTPUT_FILE = "vertex_search_data.jsonl";

async function generateData() {
  console.log("🦫 Starting Zyeuté Knowledge Generation...");
  const entries: any[] = [];

  // --- 1. LOCAL DOCUMENTATION ---
  console.log("📝 Processing local documentation...");
  const docsDir = path.resolve(process.cwd(), "docs");
  if (fs.existsSync(docsDir)) {
    const files = fs.readdirSync(docsDir).filter((f) => f.endsWith(".md"));
    for (const file of files) {
      const content = fs.readFileSync(path.join(docsDir, file), "utf-8");
      entries.push({
        id: `doc_${file.replace(".md", "")}`,
        jsonData: {
          title: `Documentation: ${file}`,
          content: content,
          type: "technical_docs",
          url: `https://zyeute.com/docs/${file}`,
        },
      });
    }
  }

  // --- 2. SUPABASE DATA (PUBLIC POSTS) ---
  if (SQL_URL) {
    console.log("🗄️ Connecting to Supabase to fetch public posts...");
    try {
      const sql = postgres(SQL_URL, { ssl: "require" });

      // Fetch public publications (limit 500 for the knowledge base)
      const publications = await sql`
        SELECT id, content, hive_id, created_at 
        FROM publications 
        WHERE content IS NOT NULL AND content != ''
        ORDER BY created_at DESC 
        LIMIT 500
      `;

      console.log(`📡 Found ${publications.length} public posts.`);

      for (const post of publications) {
        entries.push({
          id: `post_${post.id}`,
          jsonData: {
            title: `Post in Hive: ${post.hive_id || "global"}`,
            content: post.content,
            type: "user_post",
            url: `https://zyeute.com/post/${post.id}`,
            hive: post.hive_id,
          },
        });
      }

      await sql.end();
    } catch (err) {
      console.warn(
        "⚠️ Could not connect to Supabase for live data, proceeding with docs only.",
        err,
      );
    }
  } else {
    console.warn("⚠️ No DATABASE_URL found. Post indexing skipped.");
  }

  // --- 3. WRITE THE JSONL FILE ---
  const stream = fs.createWriteStream(path.resolve(process.cwd(), OUTPUT_FILE));
  for (const entry of entries) {
    stream.write(JSON.stringify(entry) + "\n");
  }
  stream.end();

  console.log(`\n✅ SUCCESS! Generated ${entries.length} knowledge entries.`);
  console.log(`📂 File saved to: ${path.resolve(process.cwd(), OUTPUT_FILE)}`);
  console.log("\n--- NEXT STEPS ---");
  console.log(
    "1. Drag and drop 'vertex_search_data.jsonl' into your 'zyeute1' GCS bucket.",
  );
  console.log(
    "2. In the Vertex AI Search Console, use the 'gs://' path to import it.",
  );
}

generateData().catch(console.error);
