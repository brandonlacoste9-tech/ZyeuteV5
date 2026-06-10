import { apiCall } from "./api";

export interface CarteSucreeLevel {
  id: string;
  region: string;
  name: string;
  moves: number;
  goalKind: string;
  goalCount: number;
  rewardTokens: number;
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

export async function getLevels() {
  const { data } = await apiCall<CarteSucreeLevel[]>("/carte-sucree/levels");
  return Array.isArray(data) ? data : [];
}

export async function getProgress() {
  const { data } = await apiCall<LevelProgress[]>("/carte-sucree/progress");
  return Array.isArray(data) ? data : [];
}

export async function completeLevel(levelId: string, score: number) {
  return apiCall<CompleteLevelResult>("/carte-sucree/complete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ levelId, score }),
  });
}
