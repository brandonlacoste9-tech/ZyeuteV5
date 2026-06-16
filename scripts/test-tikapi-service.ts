import * as dotenv from "dotenv";
import { join } from "path";
dotenv.config({ path: join(process.cwd(), ".env.local") });

async function test() {
  const { TikApiService } = await import("../backend/services/tikapi-service.js");
  
  console.log("Testing getTrendingVideos...");
  const trending = await TikApiService.getTrendingVideos("CA", 3);
  console.log(`Found ${trending.length} trending items`);
  if (trending.length > 0) {
    console.log(trending[0]);
  }

  console.log("\nTesting searchByHashtag...");
  const search = await TikApiService.searchByHashtag("quebec", 3);
  console.log(`Found ${search.length} search items`);
  if (search.length > 0) {
    console.log(search[0]);
  }
}

test();
