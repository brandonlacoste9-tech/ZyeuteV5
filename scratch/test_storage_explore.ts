
import dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(__dirname, "../.env") });

console.log("DATABASE_URL in script:", process.env.DATABASE_URL ? "SET" : "MISSING");

import { DatabaseStorage } from "../backend/storage";

async function testStorage() {
  const storage = new DatabaseStorage();
  try {
    console.log("Fetching explore posts...");
    const posts = await storage.getExplorePosts(0, 10, "quebec");
    console.log(`Found ${posts.length} posts`);
  } catch (error) {
    console.error("Storage error:", error);
  } finally {
    process.exit(0);
  }
}

testStorage();
