import Mux from "@mux/mux-node";
import * as dotenv from "dotenv";

dotenv.config();

const muxTokenId = process.env.MUX_TOKEN_ID;
const muxTokenSecret = process.env.MUX_TOKEN_SECRET;

async function testMux() {
  console.log(`Testing Mux with ID: ${muxTokenId}`);
  if (!muxTokenId || !muxTokenSecret) {
    console.log("❌ Missing Mux credentials");
    return;
  }

  const mux = new Mux({
    tokenId: muxTokenId,
    tokenSecret: muxTokenSecret,
  });

  try {
    const assets = await mux.video.assets.list({ limit: 1 });
    console.log("✅ Mux Credentials are VALID!");
    console.log(`Found ${assets.length} assets.`);
  } catch (err: any) {
    console.error("❌ Mux Credentials are INVALID!");
    console.error(err.message);
  }
}

testMux();
