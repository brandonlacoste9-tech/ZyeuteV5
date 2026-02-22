import dotenv from "dotenv";
dotenv.config({ override: true });
dotenv.config({ path: ".env.local", override: true });
console.log("🔧 [Preload] Loaded .env files");
