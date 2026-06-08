import { db, pool } from "../storage.js";
import { gridRushMatches, users } from "../../shared/schema.js";
import { eq, and, sql } from "drizzle-orm";

export const GRID_RUSH_DURATION_SEC = 45;
export const ALLOWED_STAKES = [100, 250, 500] as const;
export type StakeCennes = (typeof ALLOWED_STAKES)[number];

export type GridRushMatch = typeof gridRushMatches.$inferSelect;

function assertStake(stake: number): StakeCennes {
  if (!ALLOWED_STAKES.includes(stake as StakeCennes)) {
    throw new Error(`Mise invalide. Choix: ${ALLOWED_STAKES.join(", ")}¢`);
  }
  return stake as StakeCennes;
}

async function deductCennes(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  userId: string,
  amount: number,
): Promise<void> {
  const result = await tx
    .update(users)
    .set({ cashCredits: sql`${users.cashCredits} - ${amount}` })
    .where(sql`${users.id} = ${userId} AND ${users.cashCredits} >= ${amount}`)
    .returning({ id: users.id });

  if (!result.length) {
    throw new Error("Solde insuffisant. Achète des cennes dans la boutique!");
  }
}

async function creditCennes(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  userId: string,
  amount: number,
): Promise<void> {
  await tx
    .update(users)
    .set({ cashCredits: sql`${users.cashCredits} + ${amount}` })
    .where(eq(users.id, userId));
}

function activateMatch(now: Date) {
  const endsAt = new Date(now.getTime() + GRID_RUSH_DURATION_SEC * 1000);
  return { startedAt: now, endsAt, status: "ACTIVE" as const };
}

export class GridRushService {
  static async getMatch(matchId: string): Promise<GridRushMatch | null> {
    const [match] = await db
      .select()
      .from(gridRushMatches)
      .where(eq(gridRushMatches.id, matchId))
      .limit(1);
    return match ?? null;
  }

  static async quickMatch(
    userId: string,
    stakeCennes: number,
  ): Promise<GridRushMatch> {
    const stake = assertStake(stakeCennes);
    const now = new Date();

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const waiting = await client.query<{
        id: string;
        player_1_id: string;
        stake_cennes: number;
      }>(
        `SELECT id, player_1_id, stake_cennes
         FROM grid_rush_matches
         WHERE status = 'WAITING'
           AND player_2_id IS NULL
           AND stake_cennes = $1
           AND player_1_id != $2
         ORDER BY created_at ASC
         LIMIT 1
         FOR UPDATE SKIP LOCKED`,
        [stake, userId],
      );

      if (waiting.rows.length > 0) {
        const row = waiting.rows[0];
        const deduct = await client.query(
          `UPDATE user_profiles
           SET cash_credits = cash_credits - $1
           WHERE id = $2 AND cash_credits >= $1
           RETURNING id`,
          [stake, userId],
        );
        if (!deduct.rows.length) {
          throw new Error(
            "Solde insuffisant. Achète des cennes dans la boutique!",
          );
        }

        const { startedAt, endsAt, status } = activateMatch(now);
        const updated = await client.query(
          `UPDATE grid_rush_matches
           SET player_2_id = $1,
               status = $2,
               started_at = $3,
               ends_at = $4,
               updated_at = NOW()
           WHERE id = $5
           RETURNING *`,
          [userId, status, startedAt, endsAt, row.id],
        );

        await client.query("COMMIT");
        return mapRow(updated.rows[0]);
      }

      const deduct = await client.query(
        `UPDATE user_profiles
         SET cash_credits = cash_credits - $1
         WHERE id = $2 AND cash_credits >= $1
         RETURNING id`,
        [stake, userId],
      );
      if (!deduct.rows.length) {
        throw new Error(
          "Solde insuffisant. Achète des cennes dans la boutique!",
        );
      }

      const created = await client.query(
        `INSERT INTO grid_rush_matches (player_1_id, stake_cennes, status)
         VALUES ($1, $2, 'WAITING')
         RETURNING *`,
        [userId, stake],
      );

      await client.query("COMMIT");
      return mapRow(created.rows[0]);
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }

  static async createInvite(
    userId: string,
    stakeCennes: number,
  ): Promise<GridRushMatch> {
    const stake = assertStake(stakeCennes);

    return await db.transaction(async (tx) => {
      await deductCennes(tx, userId, stake);

      const [match] = await tx
        .insert(gridRushMatches)
        .values({
          player1Id: userId,
          stakeCennes: stake,
          status: "WAITING",
        })
        .returning();

      return match;
    });
  }

  static async joinMatch(
    userId: string,
    matchId: string,
  ): Promise<GridRushMatch> {
    const now = new Date();

    return await db.transaction(async (tx) => {
      const [match] = await tx
        .select()
        .from(gridRushMatches)
        .where(eq(gridRushMatches.id, matchId))
        .limit(1);

      if (!match) throw new Error("Partie introuvable");
      if (match.status !== "WAITING")
        throw new Error("Cette partie n'est plus disponible");
      if (match.player2Id) throw new Error("Cette partie est déjà pleine");
      if (match.player1Id === userId) {
        throw new Error("Tu ne peux pas rejoindre ta propre partie");
      }

      await deductCennes(tx, userId, match.stakeCennes);

      const { startedAt, endsAt, status } = activateMatch(now);

      const [updated] = await tx
        .update(gridRushMatches)
        .set({
          player2Id: userId,
          status,
          startedAt,
          endsAt,
          updatedAt: now,
        })
        .where(eq(gridRushMatches.id, matchId))
        .returning();

      return updated;
    });
  }

  static async incrementScore(
    userId: string,
    matchId: string,
  ): Promise<GridRushMatch> {
    const now = new Date();

    return await db.transaction(async (tx) => {
      const [match] = await tx
        .select()
        .from(gridRushMatches)
        .where(eq(gridRushMatches.id, matchId))
        .limit(1);

      if (!match) throw new Error("Partie introuvable");
      if (match.status !== "ACTIVE")
        throw new Error("La partie n'est pas active");
      if (!match.endsAt || match.endsAt <= now) {
        throw new Error("Le temps est écoulé");
      }

      const isPlayer1 = match.player1Id === userId;
      const isPlayer2 = match.player2Id === userId;
      if (!isPlayer1 && !isPlayer2) {
        throw new Error("Tu n'es pas dans cette partie");
      }

      const [updated] = await tx
        .update(gridRushMatches)
        .set(
          isPlayer1
            ? {
                player1Score: match.player1Score + 1,
                updatedAt: now,
              }
            : {
                player2Score: match.player2Score + 1,
                updatedAt: now,
              },
        )
        .where(
          and(
            eq(gridRushMatches.id, matchId),
            eq(gridRushMatches.status, "ACTIVE"),
          ),
        )
        .returning();

      return updated;
    });
  }

  static async finishMatch(
    userId: string,
    matchId: string,
  ): Promise<GridRushMatch> {
    const now = new Date();

    return await db.transaction(async (tx) => {
      const [match] = await tx
        .select()
        .from(gridRushMatches)
        .where(eq(gridRushMatches.id, matchId))
        .limit(1);

      if (!match) throw new Error("Partie introuvable");
      if (match.status === "COMPLETED") return match;
      if (match.status !== "ACTIVE") {
        throw new Error("La partie ne peut pas être terminée");
      }

      const isParticipant =
        match.player1Id === userId || match.player2Id === userId;
      if (!isParticipant) throw new Error("Tu n'es pas dans cette partie");

      if (match.endsAt && match.endsAt > now) {
        throw new Error("La partie n'est pas encore terminée");
      }

      let winnerId: string | null = null;
      if (match.player1Score > match.player2Score) {
        winnerId = match.player1Id;
      } else if (match.player2Score > match.player1Score) {
        winnerId = match.player2Id!;
      }

      if (winnerId) {
        await creditCennes(tx, winnerId, match.stakeCennes * 2);
      } else if (match.player2Id) {
        await creditCennes(tx, match.player1Id, match.stakeCennes);
        await creditCennes(tx, match.player2Id, match.stakeCennes);
      }

      const [updated] = await tx
        .update(gridRushMatches)
        .set({
          status: "COMPLETED",
          winnerId,
          updatedAt: now,
        })
        .where(
          and(
            eq(gridRushMatches.id, matchId),
            eq(gridRushMatches.status, "ACTIVE"),
          ),
        )
        .returning();

      if (!updated) {
        const [existing] = await tx
          .select()
          .from(gridRushMatches)
          .where(eq(gridRushMatches.id, matchId))
          .limit(1);
        return existing!;
      }

      return updated;
    });
  }

  static async cancelMatch(
    userId: string,
    matchId: string,
  ): Promise<GridRushMatch> {
    const now = new Date();

    return await db.transaction(async (tx) => {
      const [match] = await tx
        .select()
        .from(gridRushMatches)
        .where(eq(gridRushMatches.id, matchId))
        .limit(1);

      if (!match) throw new Error("Partie introuvable");
      if (match.player1Id !== userId) {
        throw new Error("Seul l'hôte peut annuler");
      }
      if (match.status !== "WAITING" || match.player2Id) {
        throw new Error("Cette partie ne peut pas être annulée");
      }

      await creditCennes(tx, userId, match.stakeCennes);

      const [updated] = await tx
        .update(gridRushMatches)
        .set({ status: "CANCELLED", updatedAt: now })
        .where(eq(gridRushMatches.id, matchId))
        .returning();

      return updated;
    });
  }
}

function mapRow(row: Record<string, unknown>): GridRushMatch {
  return {
    id: row.id as string,
    status: row.status as GridRushMatch["status"],
    player1Id: row.player_1_id as string,
    player2Id: (row.player_2_id as string) ?? null,
    player1Score: row.player_1_score as number,
    player2Score: row.player_2_score as number,
    stakeCennes: row.stake_cennes as number,
    winnerId: (row.winner_id as string) ?? null,
    startedAt: row.started_at ? new Date(row.started_at as string) : null,
    endsAt: row.ends_at ? new Date(row.ends_at as string) : null,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  };
}
