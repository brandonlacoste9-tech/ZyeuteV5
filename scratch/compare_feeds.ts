import { fetch } from "undici";

async function compareFeeds() {
  try {
    const res1 = await fetch("https://www.zyeute.com/api/feed");
    const json1 = await res1.json();
    const urls1 = json1.posts?.map((p: any) => p.media_url).slice(0, 3) || [];

    const res2 = await fetch("https://zyeute-v5-git-main-brandons-projects-7c6e25ca.vercel.app/api/feed");
    const json2 = await res2.json();
    const urls2 = json2.posts?.map((p: any) => p.media_url).slice(0, 3) || [];

    console.log("www.zyeute.com URLs:", urls1);
    console.log("vercel.app URLs:", urls2);
  } catch (err: any) {
    console.error("Error:", err.message);
  }
}

compareFeeds();
