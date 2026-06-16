import fetch from "node-fetch";

async function run() {
  const url = "https://www.zyeute.com/api/feed/infinite?limit=30&type=explore&hive=quebec";
  console.log(`Testing ${url}`);
  try {
    const res = await fetch(url);
    const text = await res.text();
    console.log("Status:", res.status);
    console.log("Body length:", text.length);
    console.log("Snippet:", text.slice(0, 500));
  } catch (e) {
    console.error(e);
  }
}
run();
