import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

async function checkApify() {
  const apiKey = process.env.APIFY_API_KEY;
  if (!apiKey) {
    console.error("No APIFY_API_KEY");
    return;
  }
  const url = `https://api.apify.com/v2/users/me?token=${apiKey}`;
  const res = await fetch(url);
  if (res.ok) {
    const data = await res.json();
    console.log("Apify Key is VALID!");
    console.log(data);
  } else {
    console.error("Apify Key is INVALID or EXPIRED:", res.status, await res.text());
  }
}
checkApify();
