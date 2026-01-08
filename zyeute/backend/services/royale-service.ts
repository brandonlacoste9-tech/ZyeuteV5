import { db } from "../storage";
import { tournaments, royaleScores, users, transactions } from "@shared/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import { traceDatabase } from "../tracer";

export class RoyaleService {
  static async getActiveTournaments() {
    return await db
      .select()
      .from(tournaments)
      .where(eq(tournaments.status, "active"))
      .orderBy(desc(tournaments.createdAt));
  }

  static async createTournament(title: string, entryFee: number) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 1); // 24h tournaments

    const [tournament] = await db
      .insert(tournaments)
      .values({
        title,
        entryFee,
        status: "active",
        expiresAt,
      })
      .returning();
    return tournament;
  }

  static async joinTournament(userId: string, tournamentId: string) {
    return await db.transaction(async (tx) => {
      const [tournament] = await tx
        .select()
        .from(tournaments)
        .where(eq(tournaments.id, tournamentId));

      if (!tournament) throw new Error("Tournament not found");
      if (tournament.status !== "active") throw new Error("Tournament ended");

      const [user] = await tx.select().from(users).where(eq(users.id, userId));

      if (!user || (user.credits || 0) < tournament.entryFee) {
        throw new Error("Insufficient funds (Piasses)");
      }

      // Deduct fee
      await tx
        .update(users)
        .set({
          credits: (user.credits || 0) - tournament.entryFee,
        })
        .where(eq(users.id, userId));

      // Add to prize pool
      await tx
        .update(tournaments)
        .set({
          prizePool: (tournament.prizePool || 0) + tournament.entryFee,
        })
        .where(eq(tournaments.id, tournamentId));

      return {
        success: true,
        remainingCredits: (user.credits || 0) - tournament.entryFee,
      };
    });
  }

  static async submitScore(
    userId: string,
    tournamentId: string,
    score: number,
    layers: number,
    metadata: any,
  ) {
    // 1. Validate score integrity (basic checks)
    if (score > layers * 2) {
      console.warn(
        `[ANTI-CHEAT] Suspicious score: ${score} with ${layers} layers`,
      );
      // Flag for review? For now allow it but log
    }

    const [entry] = await db
      .insert(royaleScores)
      .values({
        userId,
        tournamentId,
        score,
        layers,
        metadata,
      })
      .returning();

    return entry;
  }

  static async getLeaderboard(tournamentId: string) {
    return await db
      .select({
        username: users.username,
        score: royaleScores.score,
        layers: royaleScores.layers,
        createdAt: royaleScores.createdAt,
      })
      .from(royaleScores)
      .leftJoin(users, eq(royaleScores.userId, users.id))
      .where(eq(royaleScores.tournamentId, tournamentId))
      .orderBy(desc(royaleScores.score))
      .limit(50);
  }
}
