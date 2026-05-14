import { fetch } from "undici";

async function testMixkit() {
  const url = "https://assets.mixkit.co/videos/preview/mixkit-tree-with-yellow-leaves-low-angle-shot-1579-preview.mp4";
  
  console.log(`Fetching ${url}...`);
  
  try {
    const resp = await fetch(url, {
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "*/*",
        "Referer": "https://mixkit.co/",
      }
    });
    
    console.log(`Status: ${resp.status}`);
    console.log(`Headers:`, resp.headers);
    
    if (resp.status !== 200 && resp.status !== 206) {
      const text = await resp.text();
      console.log(`Body:`, text.substring(0, 500));
    }
  } catch (err) {
    console.error("Error:", err);
  }
}

testMixkit();
