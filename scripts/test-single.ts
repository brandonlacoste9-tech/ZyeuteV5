import { searchTrendsTool } from "../backend/ai/orchestrator";

async function testBrowser() {
  console.log("🧪 Testing Browser Service...");
  try {
    const start = Date.now();
    const result = await searchTrendsTool.execute({
      platform: "google",
      region: "montreal",
    });
    const duration = Date.now() - start;

    if (result.success) {
      console.log("✅ SUCCESS! (" + duration + "ms)");
      console.log("Trends found:", result.trends?.length);
      console.log(JSON.stringify(result.trends?.slice(0, 1), null, 2));
    } else {
      console.log("❌ FAILURE");
      console.error(result.error);
    }
  } catch (err) {
    console.error("❌ EXCEPTION:", err);
  }
}

testBrowser();
