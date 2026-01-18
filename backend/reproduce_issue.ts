
import express from 'express';
import { registerRoutes } from './routes.js';
import tiGuyRouter from "./routes/tiguy.js";
import hiveRouter from "./routes/hive.js";
import { createServer } from 'http';

const app = express();
const httpServer = createServer(app);

// Mock storage and other dependencies as best as possible
// or just try to load routes and see if it crashes

async function run() {
  try {
    console.log("Attempting to register routes...");
    // Mock environment variables if needed
    process.env.VITE_SUPABASE_URL = "https://example.supabase.co";
    process.env.VITE_SUPABASE_ANON_KEY = "mock-key";
    
    app.use("/api/tiguy", tiGuyRouter);
    app.use("/api/hive", hiveRouter);

    await registerRoutes(httpServer, app);
    console.log("Routes registered successfully!");
  } catch (error) {
    console.error("Caught error:", error);
  }
}

run();
