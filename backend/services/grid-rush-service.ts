import { db, pool } from "../storage.js";
import { gridRushMatches } from "../../shared/schema.js";
import { eq, and, sql } from "drizzle-orm";

export const GRID_RUSH_DURATION_SEC = 45;
export const ALLOWED_STAKES = [100, 250, 500] as const;
export const DEFAULT_WALLET_TOKENS = 1000;
export type StakeTokens = (typeof ALLOWED_STAKES)[number];

export type GridRushMatch = typeof gridRushMatches.$inferSelect;

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

const INSUFFICIENT_TOKENS =
  "Pas assez de jetons! Tu repartiras avec 1000 jetons gratuits.";

function assertStake(stake: number): StakeTokens {
  if (!ALLOWED_STAKES.includes(stake as StakeTokens)) {
    throw new Error(
      `Mise invalide. Choix: ${ALLOWED_STAKES.join(", ")} jetons`,
    );
  }
  return stake as StakeTokens;
}

/** Create the wallet (seeded with default tokens) if it does not exist yet. */
async function ensureWalletTx(tx: Tx, userId: string): Promise<void> {
  await tx.execute(sql`
    INSERT INTO user_wallets (user_id, token_balance)
    VALUES (${userId}, ${DEFAULT_WALLET_TOKENS})
    ON CONFLICT (user_id) DO NOTHING
  `);
}

async function deductTokens(
  tx: Tx,
  userId: string,
  amount: number,
): Promise<void> {
  await ensureWalletTx(tx, userId);
  const result = await tx.execute(sql`
    UPDATE user_wallets
    SET token_balance = token_balance - ${amount}, updated_at = NOW()
    WHERE user_id = ${userId} AND token_balance >= ${amount}
    RETURNING user_id
  `);
  if (!result.rows.length) {
    throw new Error(INSUFFICIENT_TOKENS);
  }
}

async function creditTokens(
  tx: Tx,
  userId: string,
  amount: number,
): Promise<void> {
  await ensureWalletTx(tx, userId);
  await tx.execute(sql`
    UPDATE user_wallets
    SET token_balance = token_balance + ${amount}, updated_at = NOW()
    WHERE user_id = ${userId}
  `);
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
    stakeTokens: number,
  ): Promise<GridRushMatch> {
    const stake = assertStake(stakeTokens);
    const now = new Date();

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Seed wallet for first-time players (1000 free tokens).
      await client.query(
        `INSERT INTO user_wallets (user_id, token_balance)
         VALUES ($1, $2)
         ON CONFLICT (user_id) DO NOTHING`,
        [userId, DEFAULT_WALLET_TOKENS],
      );

      const waiting = await client.query<{
        id: string;
        player_1_id: string;
        stake_tokens: number;
      }>(
        `SELECT id, player_1_id, stake_tokens
         FROM grid_rush_matches
         WHERE status = 'WAITING'
           AND player_2_id IS NULL
           AND stake_tokens = $1
           AND player_1_id != $2
         ORDER BY created_at ASC
         LIMIT 1
         FOR UPDATE SKIP LOCKED`,
        [stake, userId],
      );

      const deductTokens = async () => {
        const deduct = await client.query(
          `UPDATE user_wallets
           SET token_balance = token_balance - $1, updated_at = NOW()
           WHERE user_id = $2 AND token_balance >= $1
           RETURNING user_id`,
          [stake, userId],
        );
        if (!deduct.rows.length) throw new Error(INSUFFICIENT_TOKENS);
      };

      if (waiting.rows.length > 0) {
        const row = waiting.rows[0];
        await deductTokens();

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

      await deductTokens();

      const created = await client.query(
        `INSERT INTO grid_rush_matches (player_1_id, stake_tokens, status)
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

  static async getWalletBalance(userId: string): Promise<number> {
    await db.execute(sql`
      INSERT INTO user_wallets (user_id, token_balance)
      VALUES (${userId}, ${DEFAULT_WALLET_TOKENS})
      ON CONFLICT (user_id) DO NOTHING
    `);
    const result = await db.execute(
      sql`SELECT token_balance FROM user_wallets WHERE user_id = ${userId}`,
    );
    const row = result.rows[0] as { token_balance?: number } | undefined;
    return Number(row?.token_balance ?? 0);
  }

  static async createInvite(
    userId: string,
    stakeTokens: number,
  ): Promise<GridRushMatch> {
    const stake = assertStake(stakeTokens);

    return await db.transaction(async (tx) => {
      await deductTokens(tx, userId, stake);

      const [match] = await tx
        .insert(gridRushMatches)
        .values({
          player1Id: userId,
          stakeTokens: stake,
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

      await deductTokens(tx, userId, match.stakeTokens);

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

      // GG gift: loser's staked tokens transfer to the winner (winner keeps own stake + gift).
      if (winnerId) {
        await creditTokens(tx, winnerId, match.stakeTokens * 2);
      } else if (match.player2Id) {
        await creditTokens(tx, match.player1Id, match.stakeTokens);
        await creditTokens(tx, match.player2Id, match.stakeTokens);
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

      await creditTokens(tx, userId, match.stakeTokens);

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
    stakeCennes: (row.stake_cennes as number) ?? 500,
    stakeTokens: (row.stake_tokens as number) ?? 500,
    winnerId: (row.winner_id as string) ?? null,
    startedAt: row.started_at ? new Date(row.started_at as string) : null,
    endsAt: row.ends_at ? new Date(row.ends_at as string) : null,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  };
}
