import { apiCall } from "./api";

export interface QuizQuestion {
  id: string;
  prompt: string;
  choices: string[];
}

export interface QuizDaily {
  quizDate: string;
  title: string;
  questions: QuizQuestion[];
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

export async function getTodayQuiz(): Promise<QuizDaily | null> {
  const { data } = await apiCall<QuizDaily>("/quiz/today");
  return data?.quizDate ? data : null;
}

export async function getQuizLeaderboard(limit = 10) {
  const { data } = await apiCall<QuizLeaderboardEntry[]>(
    `/quiz/leaderboard?limit=${limit}`,
  );
  return Array.isArray(data) ? data : [];
}

export async function getMyQuizScore() {
  const { data } = await apiCall<{
    score: number | null;
    correctCount: number | null;
  }>("/quiz/my-score");
  return data;
}

export async function submitQuiz(answers: Record<string, number>) {
  return apiCall<QuizSubmitResult>("/quiz/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ answers }),
  });
}
