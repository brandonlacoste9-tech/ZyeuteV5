import "dotenv/config";
import { moderateContent } from "./vertex-moderation";

async function testVertex() {
  console.log("🚀 Starting Vertex AI Test...");

  if (process.env.VERTEX_AI_ENABLED !== "true") {
    console.log(
      "⚠️ VERTEX_AI_ENABLED is not set to true. Check your .env file.",
    );
  }

  const sampleText = "I love this app, it's so helpful!";
  console.log(`📝 Testing moderation with sample text: "${sampleText}"`);

  try {
    const result = await moderateContent(sampleText);
    console.log("✅ Vertex AI is enabled");
    console.log(`✅ Result: ${JSON.stringify(result, null, 2)}`);

    if (result.allowed) {
      console.log("✅ Successfully used Vertex AI");
    } else {
      console.log("❌ Content was unexpectedly blocked, but the API worked.");
    }
  } catch (error: any) {
    console.error("❌ Failed to test Vertex AI:", error.message);
    process.exit(1);
  }
}

testVertex();
