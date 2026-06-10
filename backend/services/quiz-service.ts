import { createHash } from "node:crypto";
import { createDirectClient, type PgQueryable } from "../db-direct.js";
import {
  QUEBEC_QUIZ_QUESTIONS,
  type QuebecQuizQuestion,
} from "../data/quebec-quiz-questions.js";
import { supabaseAdmin } from "../supabase-auth.js";
import {
  creditTokenBalance,
  fetchProfilesByIds,
  getTokenBalance,
} from "../supabase-arcade-db.js";

export const QUIZ_QUESTIONS_PER_DAY = 5;
const REWARD_PER_CORRECT = 25;
const MAX_DAILY_REWARD = 125;

export interface QuizQuestionPublic {
  id: string;
  prompt: string;
  choices: string[];
}

export interface QuizDailyPayload {
  quizDate: string;
  title: string;
  questions: QuizQuestionPublic[];
  timeRemainingMs: number;
}

export interface QuizLeaderboardEntry {
  rank: number;
  userId: string;
  username: string | null;
  displayName: string | null;
  score: number;
  correctCount: number;
}

export interface QuizSubmitResult {
  score: number;
  correctCount: number;
  totalQuestions: number;
  isNewBest: boolean;
  reward: number;
  tokenBalance: number;
  rank: number | null;
}

function torontoQuizDate(now = new Date()): string {
  return now.toLocaleDateString("en-CA", { timeZone: "America/Toronto" });
}

function midnightTorontoMs(now = new Date()): number {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Toronto",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const y = Number(parts.find((p) => p.type === "year")?.value);
  const m = Number(parts.find((p) => p.type === "month")?.value);
  const d = Number(parts.find((p) => p.type === "day")?.value);
  const utcGuess = Date.UTC(y, m - 1, d + 1, 5, 0, 0);
  return utcGuess;
}

function seededShuffle<T>(items: T[], seed: string): T[] {
  const arr = [...items];
  const h = createHash("sha256").update(seed).digest();
  for (let i = arr.length - 1; i > 0; i--) {
    const byte = h[i % h.length] ^ h[(i + 7) % h.length];
    const j = byte % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function getDailyQuestionSet(quizDate: string): QuebecQuizQuestion[] {
  const shuffled = seededShuffle(
    QUEBEC_QUIZ_QUESTIONS,
    `zyeute-quiz-${quizDate}`,
  );
  return shuffled.slice(0, QUIZ_QUESTIONS_PER_DAY);
}

export function getDailyQuiz(now = new Date()): QuizDailyPayload {
  const quizDate = torontoQuizDate(now);
  const questions = getDailyQuestionSet(quizDate).map((q) => ({
    id: q.id,
    prompt: q.prompt,
    choices: [...q.choices],
  }));

  return {
    quizDate,
    title: `Zyeuté Quiz — ${quizDate}`,
    questions,
    timeRemainingMs: Math.max(0, midnightTorontoMs(now) - now.getTime()),
  };
}

export function scoreAnswers(
  quizDate: string,
  answers: Record<string, number>,
): { score: number; correctCount: number } {
  const set = getDailyQuestionSet(quizDate);
  let correctCount = 0;
  for (const q of set) {
    if (answers[q.id] === q.correctIndex) correctCount++;
  }
  const score = Math.round((correctCount / set.length) * 100);
  return { score, correctCount };
}

async function withTx<T>(fn: (client: PgQueryable) => Promise<T>): Promise<T> {
  const client = createDirectClient();
  await client.connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    throw err;
  } finally {
    await client.end().catch(() => {});
  }
}

async function creditTokens(
  client: PgQueryable,
  userId: string,
  amount: number,
): Promise<number> {
  await client.query(
    `INSERT INTO user_wallets (user_id, token_balance)
     VALUES ($1, 1000)
     ON CONFLICT (user_id) DO NOTHING`,
    [userId],
  );
  await client.query(
    `SELECT user_id FROM user_wallets WHERE user_id = $1 FOR UPDATE`,
    [userId],
  );
  const result = await client.query<{ token_balance: number }>(
    `UPDATE user_wallets
     SET token_balance = token_balance + $1, updated_at = NOW()
     WHERE user_id = $2
     RETURNING token_balance`,
    [amount, userId],
  );
  return Number(result.rows[0]?.token_balance ?? 1000);
}

export function computeQuizReward(correctCount: number): number {
  return Math.min(correctCount * REWARD_PER_CORRECT, MAX_DAILY_REWARD);
}

async function submitDailyQuizViaAdmin(
  userId: string,
  answers: Record<string, number>,
): Promise<QuizSubmitResult> {
  if (!supabaseAdmin) throw new Error("Supabase admin client not configured");

  const quizDate = torontoQuizDate();
  const { score, correctCount } = scoreAnswers(quizDate, answers);
  const totalQuestions = QUIZ_QUESTIONS_PER_DAY;
  const reward = computeQuizReward(correctCount);

  const { data: existing, error: existingErr } = await supabaseAdmin
    .from("quiz_daily_attempts")
    .select("score, correct_count, reward_claimed")
    .eq("user_id", userId)
    .eq("quiz_date", quizDate)
    .maybeSingle();
  if (existingErr) throw new Error(existingErr.message);

  let isNewBest = false;
  let tokensGranted = 0;
  let tokenBalance: number;

  if (!existing) {
    isNewBest = true;
    const { error: insertErr } = await supabaseAdmin
      .from("quiz_daily_attempts")
      .insert({
        user_id: userId,
        quiz_date: quizDate,
        score,
        correct_count: correctCount,
        total_questions: totalQuestions,
        reward_claimed: reward > 0,
      });
    if (insertErr) throw new Error(insertErr.message);
    tokensGranted = reward;
    tokenBalance =
      reward > 0
        ? await creditTokenBalance(userId, reward)
        : await getTokenBalance(userId);
  } else {
    const prevReward = computeQuizReward(Number(existing.correct_count));
    if (score > Number(existing.score)) {
      isNewBest = true;
      const extraReward = Math.max(0, reward - prevReward);
      tokensGranted = extraReward;
      const { error: updateErr } = await supabaseAdmin
        .from("quiz_daily_attempts")
        .update({
          score,
          correct_count: correctCount,
          total_questions: totalQuestions,
          reward_claimed: Boolean(existing.reward_claimed) || extraReward > 0,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId)
        .eq("quiz_date", quizDate);
      if (updateErr) throw new Error(updateErr.message);
      tokenBalance =
        extraReward > 0
          ? await creditTokenBalance(userId, extraReward)
          : await getTokenBalance(userId);
    } else {
      tokenBalance = await getTokenBalance(userId);
    }
  }

  const { count, error: rankErr } = await supabaseAdmin
    .from("quiz_daily_attempts")
    .select("id", { count: "exact", head: true })
    .eq("quiz_date", quizDate)
    .gt("score", score);
  if (rankErr) throw new Error(rankErr.message);

  return {
    score,
    correctCount,
    totalQuestions,
    isNewBest,
    reward: tokensGranted,
    tokenBalance,
    rank: (count ?? 0) + 1,
  };
}

export async function submitDailyQuiz(
  userId: string,
  answers: Record<string, number>,
): Promise<QuizSubmitResult> {
  const quizDate = torontoQuizDate();
  const { score, correctCount } = scoreAnswers(quizDate, answers);
  const totalQuestions = QUIZ_QUESTIONS_PER_DAY;
  const reward = computeQuizReward(correctCount);

  if (supabaseAdmin) {
    return submitDailyQuizViaAdmin(userId, answers);
  }

  return withTx(async (client) => {
    const existing = await client.query<{
      score: number;
      correct_count: number;
      reward_claimed: boolean;
    }>(
      `SELECT score, correct_count, reward_claimed
       FROM quiz_daily_attempts
       WHERE user_id = $1 AND quiz_date = $2::date
       FOR UPDATE`,
      [userId, quizDate],
    );

    let isNewBest = false;
    let tokensGranted = 0;
    let tokenBalance: number;

    const readBalance = async () => {
      await client.query(
        `INSERT INTO user_wallets (user_id, token_balance)
         VALUES ($1, 1000)
         ON CONFLICT (user_id) DO NOTHING`,
        [userId],
      );
      const bal = await client.query<{ token_balance: number }>(
        `SELECT token_balance FROM user_wallets WHERE user_id = $1`,
        [userId],
      );
      return Number(bal.rows[0]?.token_balance ?? 1000);
    };

    if (!existing.rows.length) {
      isNewBest = true;
      await client.query(
        `INSERT INTO quiz_daily_attempts
           (user_id, quiz_date, score, correct_count, total_questions, reward_claimed)
         VALUES ($1, $2::date, $3, $4, $5, $6)`,
        [userId, quizDate, score, correctCount, totalQuestions, reward > 0],
      );
      tokensGranted = reward;
      tokenBalance =
        reward > 0
          ? await creditTokens(client, userId, reward)
          : await readBalance();
    } else {
      const prev = existing.rows[0];
      const prevReward = computeQuizReward(prev.correct_count);
      if (score > prev.score) {
        isNewBest = true;
        const extraReward = Math.max(0, reward - prevReward);
        tokensGranted = extraReward;
        await client.query(
          `UPDATE quiz_daily_attempts
           SET score = $1, correct_count = $2, total_questions = $3,
               reward_claimed = reward_claimed OR $4, updated_at = NOW()
           WHERE user_id = $5 AND quiz_date = $6::date`,
          [
            score,
            correctCount,
            totalQuestions,
            extraReward > 0,
            userId,
            quizDate,
          ],
        );
        tokenBalance =
          extraReward > 0
            ? await creditTokens(client, userId, extraReward)
            : await readBalance();
      } else {
        tokenBalance = await readBalance();
      }
    }

    const rankResult = await client.query<{ rank: number }>(
      `SELECT COUNT(*)::int + 1 AS rank
       FROM quiz_daily_attempts
       WHERE quiz_date = $1::date AND score > $2`,
      [quizDate, score],
    );

    return {
      score,
      correctCount,
      totalQuestions,
      isNewBest,
      reward: tokensGranted,
      tokenBalance,
      rank: rankResult.rows[0]?.rank ?? null,
    };
  });
}

export async function getMyQuizAttempt(
  userId: string,
): Promise<{ score: number; correctCount: number } | null> {
  const quizDate = torontoQuizDate();

  if (supabaseAdmin) {
    const { data, error } = await supabaseAdmin
      .from("quiz_daily_attempts")
      .select("score, correct_count")
      .eq("user_id", userId)
      .eq("quiz_date", quizDate)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return null;
    return {
      score: Number(data.score),
      correctCount: Number(data.correct_count),
    };
  }

  const client = createDirectClient();
  await client.connect();
  try {
    const result = await client.query<{
      score: number;
      correct_count: number;
    }>(
      `SELECT score, correct_count FROM quiz_daily_attempts
       WHERE user_id = $1 AND quiz_date = $2::date`,
      [userId, quizDate],
    );
    const row = result.rows[0];
    if (!row) return null;
    return { score: row.score, correctCount: row.correct_count };
  } finally {
    await client.end().catch(() => {});
  }
}

export async function getQuizLeaderboard(
  limit = 10,
): Promise<QuizLeaderboardEntry[]> {
  const quizDate = torontoQuizDate();

  if (supabaseAdmin) {
    const { data: rows, error } = await supabaseAdmin
      .from("quiz_daily_attempts")
      .select("user_id, score, correct_count, updated_at")
      .eq("quiz_date", quizDate)
      .order("score", { ascending: false })
      .order("correct_count", { ascending: false })
      .order("updated_at", { ascending: true })
      .limit(limit);
    if (error) throw new Error(error.message);

    const profiles = await fetchProfilesByIds(
      (rows ?? []).map((r) => r.user_id as string),
    );

    return (rows ?? []).map((row, i) => {
      const profile = profiles.get(row.user_id as string);
      return {
        rank: i + 1,
        userId: row.user_id as string,
        username: profile?.username ?? null,
        displayName: profile?.display_name ?? null,
        score: Number(row.score),
        correctCount: Number(row.correct_count),
      };
    });
  }

  const client = createDirectClient();
  await client.connect();
  try {
    const result = await client.query<{
      user_id: string;
      username: string | null;
      display_name: string | null;
      score: number;
      correct_count: number;
    }>(
      `SELECT q.user_id, p.username, p.display_name, q.score, q.correct_count
       FROM quiz_daily_attempts q
       LEFT JOIN user_profiles p ON p.id = q.user_id
       WHERE q.quiz_date = $1::date
       ORDER BY q.score DESC, q.correct_count DESC, q.updated_at ASC
       LIMIT $2`,
      [quizDate, limit],
    );
    return result.rows.map((row, i) => ({
      rank: i + 1,
      userId: row.user_id,
      username: row.username,
      displayName: row.display_name,
      score: row.score,
      correctCount: row.correct_count,
    }));
  } finally {
    await client.end().catch(() => {});
  }
}
