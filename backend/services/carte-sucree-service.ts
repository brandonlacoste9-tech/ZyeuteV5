import { supabaseAdmin } from "../supabase-auth.js";
import { creditTokenBalance, getTokenBalance } from "../supabase-arcade-db.js";

export interface CarteSucreeLevel {
  id: string;
  region: string;
  name: string;
  moves: number;
  goalKind: string;
  goalCount: number;
  rewardTokens: number;
}

export const CARTE_SUCREE_LEVELS: CarteSucreeLevel[] = [
  {
    id: "mtl-1",
    region: "Montréal",
    name: "Centre Bell",
    moves: 20,
    goalKind: "puck",
    goalCount: 12,
    rewardTokens: 50,
  },
  {
    id: "qc-1",
    region: "Capitale",
    name: "Cabane à Sucre",
    moves: 25,
    goalKind: "leaf",
    goalCount: 18,
    rewardTokens: 100,
  },
  {
    id: "laval-1",
    region: "Laval",
    name: "Carrefour",
    moves: 30,
    goalKind: "lys",
    goalCount: 24,
    rewardTokens: 150,
  },
];

const LEVEL_BY_ID = new Map(CARTE_SUCREE_LEVELS.map((l) => [l.id, l]));

export function torontoPlayDate(now = new Date()): string {
  return now.toLocaleDateString("en-CA", { timeZone: "America/Toronto" });
}

export interface LevelProgress {
  levelId: string;
  completedToday: boolean;
  rewardClaimed: boolean;
  bestScore: number | null;
}

export interface CompleteLevelResult {
  reward: number;
  tokenBalance: number;
  isFirstWinToday: boolean;
  bestScore: number;
}

export function getPublicLevels(): CarteSucreeLevel[] {
  return CARTE_SUCREE_LEVELS;
}

export async function getProgressForUser(
  userId: string,
): Promise<LevelProgress[]> {
  const playDate = torontoPlayDate();
  const rows = await fetchCompletionsForDate(userId, playDate);

  return CARTE_SUCREE_LEVELS.map((level) => {
    const row = rows.find((r) => r.level_id === level.id);
    return {
      levelId: level.id,
      completedToday: Boolean(row),
      rewardClaimed: Boolean(row?.reward_claimed),
      bestScore: row ? Number(row.score) : null,
    };
  });
}

type CompletionRow = {
  level_id: string;
  score: number;
  reward_claimed: boolean;
  reward_amount: number;
};

async function fetchCompletionsForDate(
  userId: string,
  playDate: string,
): Promise<CompletionRow[]> {
  if (!supabaseAdmin) return [];

  const { data, error } = await supabaseAdmin
    .from("carte_sucree_completions")
    .select("level_id, score, reward_claimed, reward_amount")
    .eq("user_id", userId)
    .eq("play_date", playDate);

  if (error) throw new Error(error.message);
  return (data ?? []) as CompletionRow[];
}

export async function completeLevel(
  userId: string,
  levelId: string,
  score: number,
): Promise<CompleteLevelResult> {
  const level = LEVEL_BY_ID.get(levelId);
  if (!level) throw new Error("Niveau invalide");

  const safeScore = Math.max(0, Math.floor(score));
  const playDate = torontoPlayDate();

  if (!supabaseAdmin) {
    throw new Error("Service indisponible");
  }

  const { data: existing, error: readErr } = await supabaseAdmin
    .from("carte_sucree_completions")
    .select("id, score, reward_claimed, reward_amount")
    .eq("user_id", userId)
    .eq("play_date", playDate)
    .eq("level_id", levelId)
    .maybeSingle();

  if (readErr) throw new Error(readErr.message);

  if (!existing) {
    const reward = level.rewardTokens;
    const { error: insertErr } = await supabaseAdmin
      .from("carte_sucree_completions")
      .insert({
        user_id: userId,
        play_date: playDate,
        level_id: levelId,
        score: safeScore,
        reward_claimed: true,
        reward_amount: reward,
      });
    if (insertErr) throw new Error(insertErr.message);

    const tokenBalance = await creditTokenBalance(userId, reward);
    return {
      reward,
      tokenBalance,
      isFirstWinToday: true,
      bestScore: safeScore,
    };
  }

  const prevScore = Number(existing.score ?? 0);
  const bestScore = Math.max(prevScore, safeScore);

  if (safeScore > prevScore) {
    const { error: updateErr } = await supabaseAdmin
      .from("carte_sucree_completions")
      .update({
        score: safeScore,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);
    if (updateErr) throw new Error(updateErr.message);
  }

  const tokenBalance = await getTokenBalance(userId);
  return {
    reward: 0,
    tokenBalance,
    isFirstWinToday: false,
    bestScore,
  };
}
