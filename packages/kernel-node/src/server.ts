/**
 * ZYEUTE KERNEL NODE (API SERVER)
 * Role: Colony Brain & API Gateway
 * Port: 3000
 */

import express from "express";
import cors from "cors";
import { DeepSeekBee } from "./bees/DeepSeekBee.js";
import { QAFirewallBee } from "./bees/QAFirewallBee.js";
import { App } from "./lib/agents/App.js";
import "./main_loop.js"; // ⚡ Activate Nervous System
import dotenv from "dotenv";

// Load Environment
dotenv.config();

const app = express();
const PORT = 3000;

// 1. MIDDLEWARE (The Wiring)
app.use(cors()); // Allows the local Dashboard HTML to talk to this server
app.use(express.json());

// 2. AGENT INITIALIZATION (The Hive Mind)
const hiveMind = new DeepSeekBee();
const qaFirewall = new QAFirewallBee();

// Initialize the App framework for MCP Tools
const colonyApp = new App({
  name: "Zyeuté-Colony",
  rootAgent: hiveMind,
  mcpServers: process.env.BIGQUERY_MCP_URL
    ? [process.env.BIGQUERY_MCP_URL]
    : [],
});

// 3. API ROUTES (The Control Panel)

// HEARTBEAT (Dashboard Ping)
app.get("/", (req, res) => {
  res.json({
    status: "online",
    system: "Zyeute Colony OS",
    version: "1.0.0",
    memory: process.memoryUsage(),
  });
});

// CHAT (Expression Core Interface)
app.post("/api/chat", async (req, res) => {
  const { message } = req.body;
  console.log(`\n💬 [Incoming Message]: ${message}`);

  try {
    // Pass directly to DeepSeek Brain via processTask
    const result = await hiveMind.processTask({
      id: `chat-${Date.now()}`,
      command: "content_advice", // Mapped to command
      payload: { query: message },
      status: "processing",
    } as any);

    res.json({
      reply: result || "Processing complete.",
      confidence: 0.95, // Hardcoded for now as per user template's expected structure
    });
  } catch (error: any) {
    console.error("🔥 Chat Error:", error);
    res.status(500).json({ reply: "Cognitive Error in DeepSeek Nucleus." });
  }
});

// ANALYZE (Vision Core Interface)
app.post("/api/analyze", async (req, res) => {
  const { assetPath, asset } = req.body; // Dashboard sends 'asset', user code says 'assetPath'
  const targetAsset = assetPath || asset;
  console.log(`\n👁️ [Vision Request]: Analyzing ${targetAsset}`);

  try {
    // Trigger Vision Logic (V-JEPA)
    const analysis = await hiveMind.processTask({
      id: `vision-${Date.now()}`,
      command: "visual_analysis",
      payload: { imageUrl: targetAsset },
      status: "processing",
    } as any);

    res.json({
      status: "success",
      analysis: analysis,
    });
  } catch (error) {
    console.error("🔥 Vision Error:", error);
    res
      .status(500)
      .json({ status: "error", message: "Vision Core Unreachable" });
  }
});

// 4. STARTUP SEQUENCE
async function startKernel() {
  console.log("---------------------------------------------------");
  console.log("🧠 INITIALIZING COLONY BRAIN...");
  console.log("---------------------------------------------------");

  // Launch App Framework (MCP Discovery + Root Agent Start)
  await colonyApp.run();

  // Wake up agents
  await qaFirewall.wakeUp();

  // Start Server
  app.listen(PORT, "0.0.0.0", () => {
    console.log(
      `⚡ [Mission Control] Dashboard Link Active: http://localhost:${PORT}`,
    );
    console.log(`📡 [API] Ready for commands (/api/chat, /api/analyze)`);
    console.log("---------------------------------------------------");
  });
}

startKernel().catch((err) => {
  console.error("❌ Failed to bootstrap Colony OS:", err);
});
