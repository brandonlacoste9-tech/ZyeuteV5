
import dotenv from "dotenv";
dotenv.config();

async function main() {
    try {
        const { storage } = await import("../server/storage");
        console.log("Fetching explore posts...");
        const posts = await storage.getExplorePosts(0, 10);
        console.log("Success!", posts.length, "posts found.");
        if (posts.length > 0) {
            console.log("First post:", JSON.stringify(posts[0], null, 2));
        }
    } catch (error) {
        console.error("Error fetching explore posts:", error);
    }
    process.exit(0);
}

main();
