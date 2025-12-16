
import dotenv from "dotenv";
dotenv.config();
import { sql } from "drizzle-orm";

async function main() {
    const { db } = await import("../server/storage");
    try {
        console.log("Adding FK from publications.user_id to user_profiles.id...");
        await db.execute(sql`
      ALTER TABLE publications 
      ADD CONSTRAINT publications_user_profiles_fk 
      FOREIGN KEY (user_id) REFERENCES public.user_profiles(id);
    `);
        console.log("Success! Constraint added.");
    } catch (err) {
        console.error("Error adding constraint (might already exist):", err);
    }
    process.exit(0);
}
main();
