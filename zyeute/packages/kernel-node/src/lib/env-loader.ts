/**
 * Environment Loader Utility
 * Loads .env from project root directory
 */
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Calculate root directory (5 levels up from kernel-node/src/lib/)
// kernel-node/src/lib/ -> kernel-node/src/ -> kernel-node/ -> packages/ -> zyeute/ -> root
const rootDir = path.resolve(__dirname, "../../../../../");

// Load .env from root
dotenv.config({ path: path.join(rootDir, ".env") });

export { rootDir };
