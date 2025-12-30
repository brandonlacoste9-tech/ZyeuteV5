import "dotenv/config";
import { parse } from "url";

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.log("DATABASE_URL is not set");
} else {
  try {
    // Basic parsing to hide sensitive info but show host
    const url = new URL(dbUrl);
    console.log(`Protocol: ${url.protocol}`);
    console.log(`Host: ${url.hostname}`);
    console.log(`Port: ${url.port}`);
    console.log(`Path: ${url.pathname}`);
  } catch (e) {
    console.log("Could not parse DATABASE_URL:", e.message);
  }
}
