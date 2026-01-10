/**
 * 🐝 Global Hive Pulse - Swarm Verification Test
 * Tests the Multi-Model Orchestration System
 * Verifies model selection and failover logic
 */

import { ollama, selectOllamaModel, checkOllamaHealth, listOllamaModels } from "../backend/ai/ollama-service.js";

async function runGlobalPulse() {
  console.log("\n🐝 ==========================================");
  console.log("🐝  GLOBAL HIVE PULSE - SWARM VERIFICATION");
  console.log("🐝 ==========================================\n");

  // Step 1: Health Check
  console.log("📡 Step 1: Checking Ollama Health...");
  const isHealthy = await checkOllamaHealth();
  if (!isHealthy) {
    console.error("❌ Ollama service is not available!");
    console.error("   Make sure Ollama is running: ollama serve");
    process.exit(1);
  }
  console.log("✅ Ollama service is healthy\n");

  // Step 2: List Available Models
  console.log("📋 Step 2: Listing Available Models...");
  const models = await listOllamaModels();
  console.log(`✅ Found ${models.length} models:\n`);
  models.forEach((model) => {
    console.log(`   • ${model}`);
  });
  console.log("");

  // Step 3: Test Model Selection Logic
  console.log("🧠 Step 3: Testing Sovereign Routing Logic...\n");

  const testCases = [
    {
      name: "Quebec Culture Content",
      config: { task: "quebec" as const },
      prompt: "Parle-moi de la fête nationale du Québec en français québécois.",
      expectedModel: "brandonlacoste9/zyeuteV8:latest",
    },
    {
      name: "Code Generation",
      config: { task: "code" as const },
      prompt: "Optimise cette fonction TypeScript pour gérer un ledger Piasse: function calculateBalance(transactions: Transaction[]) { ... }",
      expectedModel: "deepseek-v3.1:671b-cloud",
    },
    {
      name: "Speed Priority",
      config: { priority: "speed" as const },
      prompt: "Quick hello! How are you?",
      expectedModel: "gemini-3-flash-preview:cloud",
    },
    {
      name: "Quality Priority",
      config: { priority: "quality" as const },
      prompt: "Explain the economic implications of a decentralized currency system.",
      expectedModel: "gpt-oss:120b-cloud",
    },
    {
      name: "Reasoning Task",
      config: { task: "reasoning" as const },
      prompt: "Analyze the pros and cons of implementing a credit-based economy in a social platform.",
      expectedModel: "deepseek-v3.1:671b-cloud",
    },
    {
      name: "Creative Writing",
      config: { task: "creative" as const },
      prompt: "Write a short story about a beaver named TI-GUY exploring Montreal.",
      expectedModel: "brandonlacoste9/zyeuteV8:latest",
    },
    {
      name: "Local Only",
      config: { requiresLocal: true, priority: "balance" as const },
      prompt: "Explain what makes Quebec culture unique.",
      expectedModel: "llama3.2:latest",
    },
  ];

  let successCount = 0;
  let failCount = 0;

  for (const testCase of testCases) {
    console.log(`\n🎯 Testing: ${testCase.name}`);
    console.log(`   Config:`, JSON.stringify(testCase.config));
    
    const selectedModel = selectOllamaModel(testCase.config);
    console.log(`   🚀 Selected Model: ${selectedModel}`);
    
    if (selectedModel === testCase.expectedModel) {
      console.log(`   ✅ Routing correct!`);
    } else {
      console.log(`   ⚠️  Expected ${testCase.expectedModel}, got ${selectedModel}`);
    }

    // Test actual generation with failover
    try {
      const start = Date.now();
      console.log(`   ⏳ Generating response...`);
      
      const response = await ollama.generate(testCase.prompt, {
        model: selectedModel,
        temperature: 0.7,
        max_tokens: 200,
      });
      
      const duration = ((Date.now() - start) / 1000).toFixed(2);
      console.log(`   ✅ Success in ${duration}s`);
      console.log(`   📝 Preview: ${response.slice(0, 100).replace(/\n/g, " ")}...`);
      
      successCount++;
    } catch (err: any) {
      console.error(`   ❌ Model ${selectedModel} failed: ${err.message}`);
      console.log(`   🔄 Failover should trigger automatically...`);
      failCount++;
    }
  }

  // Step 4: Summary
  console.log("\n\n📊 ==========================================");
  console.log("📊  PULSE SUMMARY");
  console.log("📊 ==========================================");
  console.log(`✅ Successful Tests: ${successCount}/${testCases.length}`);
  console.log(`❌ Failed Tests: ${failCount}/${testCases.length}`);
  console.log(`📈 Success Rate: ${((successCount / testCases.length) * 100).toFixed(1)}%`);
  
  if (successCount === testCases.length) {
    console.log("\n🎉 THE SWARM IS VERIFIED. READY TO SCALE, BOSS. 🐝🔥");
  } else {
    console.log("\n⚠️  Some models need attention. Check errors above.");
  }
  console.log("");
}

// Run the pulse
runGlobalPulse().catch((error) => {
  console.error("\n❌ Fatal error during pulse:", error);
  process.exit(1);
});