async function run() {
  try {
    const res = await fetch("http://127.0.0.1:3000/api/users/ti_guy_bot/posts");
    console.log("Status:", res.status);
    const json = await res.json();
    console.log("JSON:", JSON.stringify(json, null, 2).substring(0, 1000));
  } catch (err) {
    console.error("Fetch failed:", err);
  }
}
run();
