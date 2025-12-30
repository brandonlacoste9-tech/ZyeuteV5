import "dotenv/config";

const directUrl = process.env.DIRECT_DATABASE_URL;
if (!directUrl) {
  console.log("DIRECT_DATABASE_URL is not set");
} else {
  try {
    const url = new URL(directUrl);
    console.log(`Protocol: ${url.protocol}`);
    console.log(`Host: ${url.hostname}`);
    console.log(`Port: ${url.port}`);
  } catch (e) {
    console.log("Could not parse DIRECT_DATABASE_URL:", e.message);
  }
}
