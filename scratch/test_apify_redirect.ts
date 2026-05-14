import { fetch } from "undici";

async function testProxy() {
  const url = "https://api.apify.com/v2/key-value-stores/Q17dnRHnfl2nro2ck/records/video-quebecsoli-20260513133825-7639370279625821460.mp4";
  console.log(`Fetching ${url}...`);
  try {
    const resp = await fetch(url, { method: "HEAD", redirect: "manual" });
    console.log(`Status: ${resp.status}`);
    console.log(`Headers:`, Object.fromEntries(resp.headers.entries()));
    
    if (resp.status >= 300 && resp.status < 400) {
        console.log(`Redirects to: ${resp.headers.get("location")}`);
    }
  } catch (err: any) {
    console.error("Error:", err.message);
  }
}

testProxy();
