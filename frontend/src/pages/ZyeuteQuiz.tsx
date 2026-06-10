import React, { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Brain, CheckCircle2, Coins, Trophy, Timer } from "lucide-react";
import { ArcadeShell } from "@/components/arcade/ArcadeShell";
import { ArcadeLoading } from "@/components/arcade/ArcadeLoading";
import {
  arcadeBtnPrimary,
  arcadeBtnSecondary,
  arcadeCard,
  arcadeChoiceBtn,
} from "@/components/arcade/arcade-ui";
import { useAuth } from "@/contexts/AuthContext";
import { useHaptics } from "@/hooks/useHaptics";
import {
  getMyQuizScore,
  getQuizLeaderboard,
  getTodayQuiz,
  submitQuiz,
  type QuizDaily,
  type QuizLeaderboardEntry,
} from "@/services/quizService";

type Phase = "intro" | "playing" | "results";

function formatTimeRemaining(ms: number): string {
  if (ms <= 0) return "Terminé";
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export default function ZyeuteQuiz() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { tap, impact } = useHaptics();

  const [quiz, setQuiz] = useState<QuizDaily | null>(null);
  const [leaderboard, setLeaderboard] = useState<QuizLeaderboardEntry[]>([]);
  const [bestScore, setBestScore] = useState<number | null>(null);
  const [phase, setPhase] = useState<Phase>("intro");
  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [selected, setSelected] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    score: number;
    correctCount: number;
    reward: number;
    rank: number | null;
    tokenBalance: number;
  } | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [daily, board] = await Promise.all([
        getTodayQuiz(),
        getQuizLeaderboard(5),
      ]);
      if (!daily) {
        setError("Quiz indisponible pour le moment.");
        return;
      }
      setQuiz(daily);
      setLeaderboard(board);
      setTimeLeft(daily.timeRemainingMs);
      if (user) {
        const mine = await getMyQuizScore();
        setBestScore(mine?.score ?? null);
      }
    } catch {
      setError("Impossible de charger le quiz.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const t = setInterval(
      () => setTimeLeft((v) => Math.max(0, v - 1000)),
      1000,
    );
    return () => clearInterval(t);
  }, [timeLeft]);

  const currentQuestion = quiz?.questions[qIndex];

  const startQuiz = () => {
    if (!user) return navigate("/login");
    tap();
    setPhase("playing");
    setQIndex(0);
    setAnswers({});
    setSelected(null);
    setResult(null);
  };

  const confirmAnswer = () => {
    if (!currentQuestion || selected === null) return;
    impact();
    const nextAnswers = { ...answers, [currentQuestion.id]: selected };
    setAnswers(nextAnswers);
    setSelected(null);

    if (!quiz || qIndex >= quiz.questions.length - 1) {
      void finishQuiz(nextAnswers);
      return;
    }
    setQIndex((i) => i + 1);
  };

  const finishQuiz = async (finalAnswers: Record<string, number>) => {
    setSubmitting(true);
    setError(null);
    const { data, error: apiError } = await submitQuiz(finalAnswers);
    setSubmitting(false);

    if (apiError || !data) {
      setError(apiError || "Erreur lors de la soumission");
      return;
    }

    setResult({
      score: data.score,
      correctCount: data.correctCount,
      reward: data.reward,
      rank: data.rank,
      tokenBalance: data.tokenBalance,
    });
    setBestScore(data.score);
    setPhase("results");
    void getQuizLeaderboard(5).then(setLeaderboard);
  };

  if (loading) {
    return <ArcadeLoading icon={Brain} label="Chargement du quiz…" />;
  }

  return (
    <ArcadeShell
      title="Zyeuté Quiz"
      subtitle={quiz?.title}
      icon={<Brain className="w-5 h-5 shrink-0" />}
      headerRight={
        <span className="flex items-center gap-1 text-xs arcade-text-muted shrink-0">
          <Timer className="w-3.5 h-3.5 arcade-text-yellow" />
          {formatTimeRemaining(timeLeft)}
        </span>
      }
    >
      <div className="space-y-6 pb-6">
        {error && (
          <div
            className={`${arcadeCard} border-red-500/40 p-4 text-red-300 text-sm`}
          >
            {error}
          </div>
        )}

        <AnimatePresence mode="wait">
          {phase === "intro" && quiz && (
            <motion.div
              key="intro"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="space-y-6"
            >
              <section className={`${arcadeCard} p-6`}>
                <p className="arcade-text-muted text-sm mb-4">
                  {quiz.questions.length} questions sur le Québec. Un essai par
                  jour — bat ton record et gagne des jetons arcade.
                </p>
                {bestScore != null && (
                  <p className="arcade-text-yellow font-bold mb-4">
                    Ton meilleur score aujourd&apos;hui: {bestScore}%
                  </p>
                )}
                <button
                  type="button"
                  onClick={startQuiz}
                  className={arcadeBtnPrimary}
                >
                  {user ? "Commencer le quiz" : "Connexion requise"}
                </button>
              </section>

              {leaderboard.length > 0 && (
                <section className={`${arcadeCard} p-4`}>
                  <h2 className="text-sm font-bold arcade-text-yellow uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Trophy className="w-4 h-4" />
                    Classement du jour
                  </h2>
                  <ul className="space-y-2">
                    {leaderboard.map((entry) => (
                      <li
                        key={entry.userId}
                        className="flex justify-between text-sm border-b border-white/5 pb-2"
                      >
                        <span>
                          #{entry.rank}{" "}
                          {entry.displayName || entry.username || "Citoyen"}
                        </span>
                        <span className="arcade-text-yellow font-bold">
                          {entry.score}%
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </motion.div>
          )}

          {phase === "playing" && currentQuestion && (
            <motion.div
              key={`q-${qIndex}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <p className="text-xs arcade-text-dim uppercase tracking-widest">
                Question {qIndex + 1} / {quiz?.questions.length}
              </p>
              <h2 className="text-xl font-black text-white">
                {currentQuestion.prompt}
              </h2>
              <div className="space-y-3">
                {currentQuestion.choices.map((choice, idx) => (
                  <button
                    key={choice}
                    type="button"
                    onClick={() => {
                      tap();
                      setSelected(idx);
                    }}
                    className={arcadeChoiceBtn(selected === idx)}
                  >
                    {choice}
                  </button>
                ))}
              </div>
              <button
                type="button"
                disabled={selected === null || submitting}
                onClick={confirmAnswer}
                className={`${arcadeBtnPrimary} disabled:opacity-40`}
              >
                {submitting
                  ? "Envoi..."
                  : qIndex >= (quiz?.questions.length ?? 1) - 1
                    ? "Terminer"
                    : "Suivant"}
              </button>
            </motion.div>
          )}

          {phase === "results" && result && (
            <motion.div
              key="results"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`${arcadeCard} p-6 text-center space-y-4`}
            >
              <CheckCircle2 className="w-16 h-16 arcade-text-yellow mx-auto" />
              <h2 className="text-3xl font-black arcade-text-yellow">
                {result.score}%
              </h2>
              <p className="arcade-text-muted">
                {result.correctCount} bonnes réponses sur{" "}
                {quiz?.questions.length}
              </p>
              {result.rank != null && (
                <p className="text-sm arcade-text-muted">
                  Classement: #{result.rank}
                </p>
              )}
              {result.reward > 0 && (
                <p className="flex items-center justify-center gap-2 text-yellow-300 font-bold">
                  <Coins className="w-4 h-4" />+{result.reward} jetons (solde:{" "}
                  {result.tokenBalance})
                </p>
              )}
              <button
                type="button"
                onClick={() => navigate("/arcade")}
                className={arcadeBtnSecondary}
              >
                Retour à l&apos;arcade
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ArcadeShell>
  );
}
