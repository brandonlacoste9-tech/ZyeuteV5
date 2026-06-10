import React, { useCallback, useEffect, useRef, useState } from "react";
import { Match3Engine } from "./engine";
import { loadCarteSucreeAssets } from "./asset-loader";
import type { CarteSucreeTextures } from "./asset-loader";
import { PixiBoard } from "./pixi-board";
import type { LevelConfig, TileKind } from "./types";
import { EMOJI_MAP } from "./types";
import type { LevelProgress } from "@/services/carteSucreeService";
import {
  arcadeBtnGhost,
  arcadeBtnPrimary,
  arcadeBtnSecondary,
  arcadeCard,
  arcadeCardYellow,
  arcadeTextMuted,
  arcadeTextYellow,
} from "@/components/arcade/arcade-ui";

type GamePhase = "map" | "playing" | "won" | "lost";

interface CarteSucreeGameProps {
  levels: LevelConfig[];
  progress: LevelProgress[];
  onComplete: (
    levelId: string,
    score: number,
  ) => Promise<{ reward: number; isFirstWinToday: boolean }>;
}

export default function CarteSucreeGame({
  levels,
  progress,
  onComplete,
}: CarteSucreeGameProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const boardRef = useRef<PixiBoard | null>(null);
  const engineRef = useRef<Match3Engine | null>(null);
  const texturesRef = useRef<CarteSucreeTextures | null>(null);

  const [phase, setPhase] = useState<GamePhase>("map");
  const [selectedLevel, setSelectedLevel] = useState<LevelConfig | null>(null);
  const [assetsReady, setAssetsReady] = useState(false);
  const [lastReward, setLastReward] = useState(0);
  const [hud, setHud] = useState({
    score: 0,
    moves: 0,
    collected: 0,
    goal: 0,
    target: "leaf" as TileKind,
  });

  useEffect(() => {
    let cancelled = false;
    void loadCarteSucreeAssets().then((tex) => {
      if (!cancelled) {
        texturesRef.current = tex;
        setAssetsReady(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const finishWin = useCallback(
    async (eng: Match3Engine, lvl: LevelConfig) => {
      setPhase("won");
      boardRef.current?.destroy();
      boardRef.current = null;
      const result = await onComplete(lvl.id, eng.score);
      setLastReward(result.reward);
    },
    [onComplete],
  );

  const updateHud = useCallback(
    (eng: Match3Engine, lvl: LevelConfig) => {
      setHud({
        score: eng.score,
        moves: eng.movesLeft,
        collected: eng.collected,
        goal: lvl.goalCount,
        target: lvl.goalKind,
      });

      if (eng.collected >= lvl.goalCount) {
        void finishWin(eng, lvl);
      } else if (eng.movesLeft <= 0) {
        setPhase("lost");
        boardRef.current?.destroy();
        boardRef.current = null;
      }
    },
    [finishWin],
  );

  useEffect(() => {
    if (phase !== "playing" || !canvasRef.current || !engineRef.current) {
      return;
    }
    if (!texturesRef.current || boardRef.current) return;

    boardRef.current = new PixiBoard(
      canvasRef.current,
      engineRef.current,
      texturesRef.current,
      () => {
        const eng = engineRef.current;
        const lvl = selectedLevel;
        if (!eng || !lvl) return;
        updateHud(eng, lvl);
      },
    );

    return () => {
      boardRef.current?.destroy();
      boardRef.current = null;
    };
  }, [phase, selectedLevel, updateHud]);

  function startLevel(lvl: LevelConfig) {
    boardRef.current?.destroy();
    boardRef.current = null;
    const eng = new Match3Engine(8, 8, lvl.moves, lvl.goalKind, lvl.goalCount);
    engineRef.current = eng;
    setSelectedLevel(lvl);
    setLastReward(0);
    setHud({
      score: 0,
      moves: lvl.moves,
      collected: 0,
      goal: lvl.goalCount,
      target: lvl.goalKind,
    });
    setPhase("playing");
  }

  function returnToMap() {
    boardRef.current?.destroy();
    boardRef.current = null;
    engineRef.current = null;
    setSelectedLevel(null);
    setPhase("map");
  }

  function progressFor(levelId: string) {
    return progress.find((p) => p.levelId === levelId);
  }

  if (!assetsReady) {
    return (
      <p className={`text-center py-12 ${arcadeTextMuted}`}>
        Chargement des bonbons…
      </p>
    );
  }

  if (phase === "map") {
    return (
      <div className="space-y-4 pb-6">
        <p className={`text-sm text-center ${arcadeTextMuted}`}>
          Match-3 québécois — gagne des jetons une fois par niveau par jour.
        </p>
        <div className="grid gap-3">
          {levels.map((lvl) => {
            const prog = progressFor(lvl.id);
            const claimed = prog?.rewardClaimed;
            return (
              <button
                key={lvl.id}
                type="button"
                onClick={() => startLevel(lvl)}
                className={`${arcadeCardYellow} p-4 text-left w-full transition-opacity ${
                  claimed ? "opacity-75" : ""
                }`}
              >
                <div className="flex justify-between items-start gap-3">
                  <div>
                    <span
                      className={`text-xs uppercase font-bold ${arcadeTextMuted}`}
                    >
                      {lvl.region}
                    </span>
                    <h4 className="font-black text-lg text-white mt-1">
                      {lvl.name}
                    </h4>
                    <p className={`text-xs mt-1 ${arcadeTextMuted}`}>
                      But: {lvl.goalCount} {EMOJI_MAP[lvl.goalKind]}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className={`font-black ${arcadeTextYellow}`}>
                      +{lvl.rewardTokens} jetons
                    </div>
                    {claimed ? (
                      <span className="text-xs text-emerald-400 font-bold">
                        Réclamé
                      </span>
                    ) : (
                      <span className={`text-xs ${arcadeTextMuted}`}>
                        {lvl.moves} coups
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 pb-6 w-full max-w-lg mx-auto">
      <div
        className={`w-full ${arcadeCard} p-3 grid grid-cols-3 gap-2 text-center`}
      >
        <div>
          <p className={`text-[10px] uppercase ${arcadeTextMuted}`}>Score</p>
          <p className={`text-2xl font-black ${arcadeTextYellow}`}>
            {hud.score}
          </p>
        </div>
        <div>
          <p className={`text-[10px] uppercase ${arcadeTextMuted}`}>
            Objectif {EMOJI_MAP[hud.target]}
          </p>
          <p className="text-2xl font-black text-white">
            {hud.collected}{" "}
            <span className={`text-base ${arcadeTextMuted}`}>/ {hud.goal}</span>
          </p>
        </div>
        <div>
          <p className={`text-[10px] uppercase ${arcadeTextMuted}`}>Coups</p>
          <p className="text-2xl font-black text-white">{hud.moves}</p>
        </div>
      </div>

      <div className={`relative ${arcadeCard} p-2`}>
        <canvas ref={canvasRef} className="block rounded-sm max-w-full" />

        {phase === "won" && (
          <div className="absolute inset-0 bg-black/75 flex flex-col justify-center items-center rounded-sm z-10 p-4 text-center">
            <h3 className={`text-3xl font-black ${arcadeTextYellow} mb-2`}>
              Sucré!
            </h3>
            <p className={`text-sm mb-6 ${arcadeTextMuted}`}>
              {lastReward > 0
                ? `+${lastReward} jetons récoltés`
                : "Niveau complété — récompense déjà réclamée aujourd'hui"}
            </p>
            <button
              type="button"
              onClick={returnToMap}
              className={`${arcadeBtnPrimary} max-w-xs`}
            >
              Continuer
            </button>
          </div>
        )}

        {phase === "lost" && (
          <div className="absolute inset-0 bg-black/75 flex flex-col justify-center items-center rounded-sm z-10 p-4 text-center">
            <h3 className="text-3xl font-black text-red-400 mb-2">Oups!</h3>
            <p className={`text-sm mb-6 ${arcadeTextMuted}`}>
              Plus aucun mouvement…
            </p>
            <div className="flex flex-col gap-2 w-full max-w-xs">
              <button
                type="button"
                onClick={() => selectedLevel && startLevel(selectedLevel)}
                className={arcadeBtnSecondary}
              >
                Réessayer
              </button>
              <button
                type="button"
                onClick={returnToMap}
                className={arcadeBtnGhost}
              >
                Carte des niveaux
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
