import dotenv from "dotenv";
import { existsSync } from "fs";
dotenv.config({ override: true });
dotenv.config({ path: ".env.local", override: true });
// Load .env.render if present (for secrets not yet in Render dashboard)
if (existsSync(".env.render")) {
  dotenv.config({ path: ".env.render", override: false });
  console.log("🔧 [Preload] Loaded .env.render fallback");
}
console.log("🔧 [Preload] Loaded .env files");
