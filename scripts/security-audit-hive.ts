#!/usr/bin/env tsx
/**
 * Security Audit: "Scan the Hive"
 *
 * Comprehensive security scan for leaked secrets, API keys, and sensitive data
 * Run this before committing or deploying to production
 *
 * Usage:
 *   tsx scripts/security-audit-hive.ts [--fix] [--verbose]
 *
 * Options:
 *   --fix: Attempt to fix issues automatically (use with caution)
 *   --verbose: Show all findings, not just issues
 */

import { readFileSync, readdirSync, statSync, writeFileSync } from "fs";
import { join, extname } from "path";
import { execSync } from "child_process";

const SENSITIVE_PATTERNS = [
  {
    name: "Dialogflow Agent ID",
    pattern: /AQ\.[A-Za-z0-9_-]{40,}/,
    severity: "high",
    description:
      "Dialogflow CX Agent ID - can be used to access Dialogflow CX credits",
  },
  {
    name: "Stripe Live Key",
    pattern: /sk_live_[A-Za-z0-9]{32,}/,
    severity: "critical",
    description: "Stripe live secret key - can charge real money",
  },
  {
    name: "Stripe Test Key",
    pattern: /sk_test_[A-Za-z0-9]{32,}/,
    severity: "medium",
    description: "Stripe test key - can be abused for testing",
  },
  {
    name: "Google API Key",
    pattern: /AIza[A-Za-z0-9_-]{35,}/,
    severity: "high",
    description: "Google API key - can be used to access Google services",
  },
  {
    name: "Private Key",
    pattern: /-----BEGIN PRIVATE KEY-----/,
    severity: "critical",
    description: "Private key - full authentication access",
  },
  {
    name: "RSA Private Key",
    pattern: /-----BEGIN RSA PRIVATE KEY-----/,
    severity: "critical",
    description: "RSA private key - full authentication access",
  },
  {
    name: "Service Account JSON (inline)",
    pattern: /"type"\s*:\s*"service_account"/,
    severity: "critical",
    description: "Service Account JSON - contains private keys",
    context: "Check if this is a placeholder or real JSON",
  },
  {
    name: "Database Connection String",
    pattern: /postgresql:\/\/[^:]+:[^@]+@[^\s"']+/,
    severity: "critical",
    description: "Database connection string with password",
  },
  {
    name: "Supabase Service Role Key",
    pattern: /eyJ[a-zA-Z0-9_-]{100,}\.eyJ[a-zA-Z0-9_-]{100,}/,
    severity: "high",
    description: "JWT token (possibly Supabase service role key)",
    context: "Check if this is a placeholder or real token",
  },
  {
    name: "AWS Access Key",
    pattern: /AKIA[0-9A-Z]{16}/,
    severity: "high",
    description: "AWS access key ID",
  },
  {
    name: "GitHub Token",
    pattern: /ghp_[A-Za-z0-9]{36}/,
    severity: "high",
    description: "GitHub personal access token",
  },
  {
    name: "Slack Token",
    pattern: /xox[baprs]-[0-9a-zA-Z-]{10,48}/,
    severity: "medium",
    description: "Slack API token",
  },
];

const SAFE_PATTERNS = [
  /YOUR_/i, // Placeholder pattern
  /placeholder/i,
  /example/i,
  /\.example/i,
  /\.template/i,
  /your-/i,
  /<.*>/i, // HTML/XML tags
];

const FILES_TO_SCAN = [
  "backend",
  "frontend/src",
  "scripts",
  "docs",
  ".env.example",
  ".github",
];

const SKIP_PATTERNS = [
  "node_modules",
  "dist",
  ".git",
  ".next",
  "coverage",
  "__pycache__",
  ".cache",
  ".venv",
  "external",
  "tools",
];

const SKIP_EXTENSIONS = [
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".svg",
  ".ico",
  ".woff",
  ".woff2",
  ".ttf",
  ".eot",
  ".mp4",
  ".webm",
  ".pdf",
];

interface Finding {
  file: string;
  line: number;
  pattern: string;
  severity: string;
  description: string;
  match: string;
  context?: string;
}

function shouldSkip(path: string): boolean {
  return SKIP_PATTERNS.some((pattern) => path.includes(pattern));
}

function scanFile(filePath: string): Finding[] {
  const findings: Finding[] = [];

  try {
    const content = readFileSync(filePath, "utf-8");
    const lines = content.split("\n");

    for (const patternInfo of SENSITIVE_PATTERNS) {
      const matches = content.matchAll(new RegExp(patternInfo.pattern, "g"));

      for (const match of matches) {
        const matchText = match[0];
        const matchIndex = match.index || 0;

        // Check if it's a safe placeholder
        const isSafe = SAFE_PATTERNS.some((safePattern) =>
          safePattern.test(matchText),
        );

        // Check surrounding context for placeholders
        const contextStart = Math.max(0, matchIndex - 50);
        const contextEnd = Math.min(
          content.length,
          matchIndex + matchText.length + 50,
        );
        const context = content.substring(contextStart, contextEnd);
        const hasPlaceholderContext = SAFE_PATTERNS.some((safePattern) =>
          safePattern.test(context),
        );

        if (!isSafe && !hasPlaceholderContext) {
          // Find line number
          const lineNumber = content
            .substring(0, matchIndex)
            .split("\n").length;

          findings.push({
            file: filePath,
            line: lineNumber,
            pattern: patternInfo.name,
            severity: patternInfo.severity,
            description: patternInfo.description,
            match:
              matchText.substring(0, 50) + (matchText.length > 50 ? "..." : ""),
            context: patternInfo.context,
          });
        }
      }
    }
  } catch (error: any) {
    // Skip files that can't be read (binary, permissions, etc.)
  }

  return findings;
}

function collectFiles(dir: string, baseDir: string = dir): string[] {
  const files: string[] = [];

  try {
    const entries = readdirSync(dir);

    for (const entry of entries) {
      const fullPath = join(dir, entry);
      const relPath = fullPath
        .replace(baseDir + "\\", "")
        .replace(baseDir + "/", "");

      if (shouldSkip(fullPath)) {
        continue;
      }

      const stat = statSync(fullPath);

      if (stat.isDirectory()) {
        files.push(...collectFiles(fullPath, baseDir));
      } else if (stat.isFile()) {
        const ext = extname(fullPath);
        if (!SKIP_EXTENSIONS.includes(ext)) {
          files.push(fullPath);
        }
      }
    }
  } catch (error) {
    // Skip directories that can't be read
  }

  return files;
}

function checkGitStatus(): { hasUncommitted: boolean; hasStaged: boolean } {
  try {
    const status = execSync("git status --porcelain", {
      encoding: "utf-8",
    });
    const lines = status
      .trim()
      .split("\n")
      .filter((l) => l);
    const hasUncommitted = lines.some((l) => !l.startsWith("??"));
    const hasStaged = lines.some((l) => l.match(/^[AM]/));
    return { hasUncommitted, hasStaged };
  } catch {
    return { hasUncommitted: false, hasStaged: false };
  }
}

function main() {
  const args = process.argv.slice(2);
  const verbose = args.includes("--verbose");
  const fix = args.includes("--fix");

  console.log("🛡️  Security Audit: Scanning the Hive...\n");
  console.log("🔍 Checking for leaked secrets and sensitive data\n");

  // Check git status
  const gitStatus = checkGitStatus();
  if (gitStatus.hasStaged) {
    console.log("⚠️  Warning: You have staged changes");
    console.log("   Consider running this audit before committing\n");
  }

  const allFiles: string[] = [];

  for (const scanPath of FILES_TO_SCAN) {
    const fullPath = join(process.cwd(), scanPath);
    try {
      if (statSync(fullPath).isDirectory()) {
        const files = collectFiles(fullPath, fullPath);
        allFiles.push(...files);
        if (verbose) {
          console.log(`📁 Scanned: ${scanPath} (${files.length} files)`);
        }
      } else if (statSync(fullPath).isFile()) {
        allFiles.push(fullPath);
      }
    } catch {
      // Skip if path doesn't exist
    }
  }

  console.log(`📊 Scanning ${allFiles.length} files...\n`);

  const allFindings: Finding[] = [];

  for (const file of allFiles) {
    const findings = scanFile(file);
    allFindings.push(...findings);
  }

  // Group by severity
  const critical = allFindings.filter((f) => f.severity === "critical");
  const high = allFindings.filter((f) => f.severity === "high");
  const medium = allFindings.filter((f) => f.severity === "medium");

  // Print results
  if (critical.length > 0) {
    console.log(`🔴 CRITICAL (${critical.length}):\n`);
    critical.forEach((f) => {
      console.log(`   ${f.file}:${f.line}`);
      console.log(`   Pattern: ${f.pattern}`);
      console.log(`   Match: ${f.match}`);
      if (f.context) {
        console.log(`   Note: ${f.context}`);
      }
      console.log();
    });
  }

  if (high.length > 0) {
    console.log(`🟠 HIGH (${high.length}):\n`);
    high.forEach((f) => {
      console.log(`   ${f.file}:${f.line}`);
      console.log(`   Pattern: ${f.pattern}`);
      console.log(`   Match: ${f.match.substring(0, 30)}...`);
      console.log();
    });
  }

  if (medium.length > 0 && verbose) {
    console.log(`🟡 MEDIUM (${medium.length}):\n`);
    medium.forEach((f) => {
      console.log(`   ${f.file}:${f.line}`);
      console.log(`   Pattern: ${f.pattern}`);
      console.log();
    });
  }

  // Summary
  console.log("📊 Summary:");
  console.log(`   Critical: ${critical.length}`);
  console.log(`   High: ${high.length}`);
  console.log(`   Medium: ${medium.length}`);
  console.log(`   Total files scanned: ${allFiles.length}`);
  console.log();

  if (critical.length === 0 && high.length === 0) {
    console.log("✅ No critical or high-severity issues found!");
    console.log("   Your Hive is secure 🐝");
    process.exit(0);
  } else {
    console.log("❌ Security issues found!");
    console.log("\n🔧 Action Required:");
    console.log("   1. Review findings above");
    console.log("   2. Remove or replace sensitive data");
    console.log("   3. Use environment variables instead");
    console.log("   4. Re-run audit to verify fixes");
    console.log("\n📋 Security Best Practices:");
    console.log("   - Never commit .env files");
    console.log("   - Use placeholders in code/docs");
    console.log("   - Store secrets in environment variables");
    console.log("   - Use GCP Secret Manager for production");
    process.exit(1);
  }
}

main();
