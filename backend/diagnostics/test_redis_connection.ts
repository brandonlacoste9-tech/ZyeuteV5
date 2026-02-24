import Redis from "ioredis";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

async function testRedis() {
  console.log("Testing Redis connection...");
  console.log("Host:", process.env.REDIS_HOST);
  console.log("Port:", process.env.REDIS_PORT);

  // Use REDIS_URL if available, otherwise host/port/pass
  const client = process.env.REDIS_URL
    ? new Redis(process.env.REDIS_URL)
    : new Redis({
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT || "6379"),
        password: process.env.REDIS_PASSWORD,
        username: process.env.REDIS_USERNAME,
      });

  try {
    await client.set("foo", "bar_from_node");
    const result = await client.get("foo");
    console.log("Result from string set/get:", result);

    const pong = await client.ping();
    console.log("Redis Ping Response:", pong);

    await client.quit();
    console.log("Redis connection test successful!");
  } catch (error) {
    console.error("Redis connection test failed:", error);
  }
}

testRedis();
