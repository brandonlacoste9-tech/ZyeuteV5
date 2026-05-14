import { fetch } from "undici";

async function testProxy() {
  const targetUrl = encodeURIComponent("https://api.apify.com/v2/key-value-stores/Q17dnRHnfl2nro2ck/records/video-quebecsoli-20260513133825-7639370279625821460.mp4");
  const url = `http://localhost:3000/api/media-proxy?url=${targetUrl}`;
  
  console.log(`Hitting proxy: ${url}`);
  try {
    const resp = await fetch(url, { method: "HEAD" });
    console.log(`Status: ${resp.status}`);
    console.log(`Headers:`, Object.fromEntries(resp.headers.entries()));
  } catch (err: any) {
    console.error("Error:", err.message);
  }
}

testProxy();
