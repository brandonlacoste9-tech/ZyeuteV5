import "dotenv/config";
import { db } from "./storage";
import { tournaments } from "../shared/schema";
import { eq } from "drizzle-orm"; // Fixed import

async function seedTournament() {
  console.log("🌱 Seeding Poutine Royale Tournament...");

  // Check if active tournament exists
  const active = await db
    .select()
    .from(tournaments)
    .where(eq(tournaments.status, "active"));

  if (active.length === 0) {
    console.log("Creating 'Daily Grind' Tournament...");
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 1);

    await db.insert(tournaments).values({
      title: "Daily Grind 🍟",
      entryFee: 10,
      prizePool: 500, // Seed pot
      status: "active",
      expiresAt,
    });
    console.log("Tournament created!");
  } else {
    console.log("Active tournament already exists.");
  }
}

seedTournament()
  .catch(console.error)
  .finally(() => process.exit());
