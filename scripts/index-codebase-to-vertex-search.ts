#!/usr/bin/env tsx
/**
 * Index Zyeuté codebase and Antigravity skills to Vertex AI Search Data Store
 *
 * Converts code files to markdown and uploads to GCS bucket configured for Vertex AI Search.
 * Uses GenAI App Builder credits for semantic indexing.
 *
 * Usage:
 *   tsx scripts/index-codebase-to-vertex-search.ts [--dry-run]
 */

import "dotenv/config";
import { readFileSync, readdirSync, statSync } from "fs";
import { join, extname, relative } from "path";
import { Storage } from "@google-cloud/storage";

const PROJECT_ID =
  process.env.GOOGLE_CLOUD_PROJECT || "spatial-garden-483401-g8";
const BUCKET_NAME =
  process.env.GCS_KNOWLEDGE_BUCKET || "zyeute-knowledge-ingestion";
const DRY_RUN = process.argv.includes("--dry-run");

const INDEX_PATHS = ["backend", "frontend/src", "docs", "shared"];

const CODE_EXTENSIONS = [".ts", ".tsx", ".js", ".jsx"];
const SKIP_PATTERNS = ["node_modules", "dist", ".git", ".next"];

function shouldSkip(path: string): boolean {
  return SKIP_PATTERNS.some((pattern) => path.includes(pattern));
}

function convertCodeToMarkdown(filePath: string, content: string): string {
  const ext = extname(filePath);
  const lang = ext.slice(1);
  return `# ${filePath}\n\n\`\`\`${lang}\n${content}\n\`\`\``;
}

function collectFiles(
  dir: string,
  baseDir: string = dir,
): Array<{ localPath: string; gcsPath: string; content: string }> {
  const files: Array<{ localPath: string; gcsPath: string; content: string }> =
    [];
  try {
    const entries = readdirSync(dir);
    for (const entry of entries) {
      const fullPath = join(dir, entry);
      if (shouldSkip(fullPath)) continue;
      const stat = statSync(fullPath);
      if (stat.isDirectory()) {
        files.push(...collectFiles(fullPath, baseDir));
      } else if (stat.isFile() && CODE_EXTENSIONS.includes(extname(fullPath))) {
        try {
          const content = readFileSync(fullPath, "utf-8");
          const relPath = relative(baseDir, fullPath);
          files.push({
            localPath: fullPath,
            gcsPath: `codebase/${relPath}.md`,
            content: convertCodeToMarkdown(relPath, content),
          });
        } catch (error) {
          console.warn(`⚠️  Failed to read ${fullPath}`);
        }
      }
    }
  } catch (error) {
    console.warn(`⚠️  Failed to read directory ${dir}`);
  }
  return files;
}

async function main() {
  console.log("🔍 Indexing Zyeuté codebase for Vertex AI Search...\n");
  const allFiles: Array<{
    localPath: string;
    gcsPath: string;
    content: string;
  }> = [];
  for (const indexPath of INDEX_PATHS) {
    const fullPath = join(process.cwd(), indexPath);
    try {
      if (statSync(fullPath).isDirectory()) {
        console.log(`📁 Scanning: ${indexPath}`);
        const files = collectFiles(fullPath, fullPath);
        allFiles.push(...files);
        console.log(`   Found ${files.length} files`);
      }
    } catch (error) {
      console.warn(`⚠️  Skipping ${indexPath}`);
    }
  }
  console.log(`\n📊 Total files to index: ${allFiles.length}`);
  if (DRY_RUN) {
    console.log("\n🔍 DRY RUN - Files that would be uploaded:");
    allFiles.forEach((f) => console.log(`  ${f.gcsPath}`));
  } else {
    const storage = new Storage({ projectId: PROJECT_ID });
    const bucket = storage.bucket(BUCKET_NAME);
    const [exists] = await bucket.exists();
    if (!exists) {
      console.log(`📦 Creating bucket: ${BUCKET_NAME}`);
      await bucket.create({ location: "us-central1" });
    }
    console.log(`\n📤 Uploading ${allFiles.length} files...`);
    for (const file of allFiles) {
      try {
        await bucket.file(file.gcsPath).save(file.content, {
          contentType: "text/markdown",
        });
      } catch (error) {
        console.error(`❌ Failed to upload ${file.gcsPath}`);
      }
    }
    console.log("\n✅ Upload complete!");
  }
}

main().catch(console.error);
