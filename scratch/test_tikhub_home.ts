const TIKHUB_API_KEY = "gYsfWd4o3nOBuFyYF7nF8RjgPDmgQdxO0ifo632jRs6x2nqyJXmHLWK7bA==";

async function test() {
  console.log("Testing TikHub search endpoint using native fetch...");
  try {
    const url = new URL("https://api.tikhub.io/api/v1/tiktok/web/fetch_search_video");
    url.searchParams.append("keyword", "quebec");
    url.searchParams.append("count", "5");
    url.searchParams.append("offset", "0");

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${TIKHUB_API_KEY}`
      }
    });

    const data = await response.json();
    if (!response.ok || data.code !== 200) {
      console.error("❌ Failed:", JSON.stringify(data, null, 2));
      return;
    }
    console.log("✅ Success! Got", data.data?.aweme_list?.length || "no", "videos.");
  } catch (error: any) {
    console.error("❌ Exception:", error.message);
  }
}

test();
