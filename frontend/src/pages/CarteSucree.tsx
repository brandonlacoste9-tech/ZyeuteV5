import React, { useCallback, useEffect, useState } from "react";
import { Candy } from "lucide-react";
import { ArcadeShell } from "@/components/arcade/ArcadeShell";
import { ArcadeLoading } from "@/components/arcade/ArcadeLoading";
import CarteSucreeGame from "@/components/games/carte-sucree/CarteSucreeGame";
import type { LevelConfig } from "@/components/games/carte-sucree/types";
import {
  completeLevel,
  getLevels,
  getProgress,
  type LevelProgress,
} from "@/services/carteSucreeService";

function toLevelConfig(
  levels: Awaited<ReturnType<typeof getLevels>>,
): LevelConfig[] {
  return levels.map((l) => ({
    id: l.id,
    region: l.region,
    name: l.name,
    moves: l.moves,
    goalKind: l.goalKind as LevelConfig["goalKind"],
    goalCount: l.goalCount,
    rewardTokens: l.rewardTokens,
  }));
}

export default function CarteSucreePage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [levels, setLevels] = useState<LevelConfig[]>([]);
  const [progress, setProgress] = useState<LevelProgress[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [levelData, progressData] = await Promise.all([
        getLevels(),
        getProgress(),
      ]);
      setLevels(toLevelConfig(levelData));
      setProgress(progressData);
    } catch {
      setError("Impossible de charger Carte Sucrée.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleComplete = useCallback(async (levelId: string, score: number) => {
    const { data, error: apiError } = await completeLevel(levelId, score);
    if (apiError || !data) {
      return { reward: 0, isFirstWinToday: false };
    }
    void getProgress().then(setProgress);
    return {
      reward: data.reward,
      isFirstWinToday: data.isFirstWinToday,
    };
  }, []);

  if (loading) {
    return <ArcadeLoading icon={Candy} label="Chargement de Carte Sucrée…" />;
  }

  return (
    <ArcadeShell
      title="Carte Sucrée"
      subtitle="Match-3 du Québec"
      icon={<Candy className="w-5 h-5 shrink-0" />}
    >
      {error && (
        <p className="text-red-400 text-sm text-center mb-4 bg-red-500/10 border border-red-500/20 rounded-xl p-3">
          {error}
        </p>
      )}
      {levels.length > 0 ? (
        <CarteSucreeGame
          levels={levels}
          progress={progress}
          onComplete={handleComplete}
        />
      ) : (
        <p className={`text-center ${error ? "hidden" : ""} arcade-text-muted`}>
          Aucun niveau disponible.
        </p>
      )}
    </ArcadeShell>
  );
}
