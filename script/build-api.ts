import { build as esbuild } from "esbuild";
import { readFile } from "fs/promises";

// Dependencies to bundle (same list from build.ts for consistency)
const allowlist = [
  "@google/generative-ai",
  "axios",
  "connect-pg-simple",
  "cors",
  "date-fns",
  "drizzle-orm",
  "drizzle-zod",
  "express",
  "express-rate-limit",
  "express-session",
  "jsonwebtoken",
  "memorystore",
  "multer",
  "nanoid",
  "nodemailer",
  "openai",
  "passport",
  "passport-local",
  "pg",
  "stripe",
  "uuid",
  "ws",
  "xlsx",
  "zod",
  "zod-validation-error",
  "@fal-ai/client",
  "bcryptjs",
  "resend",
  "@react-email/render",
  "@react-email/components",
  "@supabase/supabase-js",
];

async function buildApi() {
  console.log("Building API for Vercel serverless...");

  const pkg = JSON.parse(await readFile("package.json", "utf-8"));
  const allDeps = [
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.devDependencies || {}),
  ];
  const externals = allDeps.filter((dep) => !allowlist.includes(dep));

  await esbuild({
    entryPoints: ["api/index.ts"],
    platform: "node",
    bundle: true,
    format: "cjs",
    outfile: "api/index.js",
    define: {
      "process.env.NODE_ENV": '"production"',
    },
    minify: false, // Keep readable for debugging
    external: externals,
    logLevel: "info",
    sourcemap: true,
  });

  console.log("API build complete!");
}

buildApi().catch((err) => {
  console.error(err);
  process.exit(1);
});
