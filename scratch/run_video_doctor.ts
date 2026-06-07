
import * as dotenv from "dotenv";
import path from "path";

async function runDoctor() {
  console.log("🏥 Starting VideoDoctor Auto-Repair...");
  
  // Load environment variables before any other imports
  const envPath = path.resolve(process.cwd(), ".env");
  const envLocalPath = path.resolve(process.cwd(), ".env.local");
  console.log(`Loading env from ${envPath}`);
  dotenv.config({ path: envPath });
  // only load .env.local if we don't already have the DB url
  if (!process.env.DATABASE_URL) {
    dotenv.config({ path: envLocalPath, override: true });
  }
  
  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL missing from environment!");
    return;
  }

  // Dynamic imports to ensure env is loaded first
  const { pool } = await import("../backend/storage.js");
  const { autoFixVideos, healthCheckAllVideos } = await import("../backend/services/video-doctor.js");
  
  try {
    // 1. Check health
    console.log("🔍 Diagnosing videos (limit 100)...");
    const reports = await healthCheckAllVideos(100);
    console.log(`🔍 Diagnosed ${reports.length} videos.`);
    
    const sick = reports.filter(r => r.status !== 'healthy');
    console.log(`🚨 Found ${sick.length} problematic videos.`);
    
    if (sick.length > 0) {
      // 2. Run auto-fix
      console.log("🔧 Running auto-fix...");
      const result = await autoFixVideos(100);
      console.log(`✅ Fixed: ${result.fixed}, Failed: ${result.failed}`);
      
      if (result.reports && result.reports.length > 0) {
        result.reports.forEach((fix, i) => {
          console.log(`Fix ${i+1}: ${fix.success ? '✅' : '❌'} - ${fix.message}`);
        });
      }
    } else {
      console.log("✅ All checked videos are healthy!");
    }
    
  } catch (error) {
    console.error("❌ VideoDoctor run failed:", error);
  } finally {
    await pool.end();
  }
}

runDoctor();
