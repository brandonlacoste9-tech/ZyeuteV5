import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
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
  const [canvasMounted, setCanvasMounted] = useState(false);
  const boardRef = useRef<PixiBoard | null>(null);
  const engineRef = useRef<Match3Engine | null>(null);
  const texturesRef = useRef<CarteSucreeTextures | null>(null);
  const winHandledRef = useRef(false);

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
      if (winHandledRef.current) return;
      winHandledRef.current = true;
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

  const assignCanvasRef = useCallback((node: HTMLCanvasElement | null) => {
    canvasRef.current = node;
    setCanvasMounted(Boolean(node));
  }, []);

  useLayoutEffect(() => {
    if (phase !== "playing" || !canvasMounted || !engineRef.current) {
      return;
    }
    if (!texturesRef.current) return;

    boardRef.current?.destroy();
    boardRef.current = null;

    if (!canvasRef.current) return;

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
  }, [phase, canvasMounted, selectedLevel, updateHud]);

  function startLevel(lvl: LevelConfig) {
    boardRef.current?.destroy();
    boardRef.current = null;
    winHandledRef.current = false;
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
      <div className="space-y-6 pb-6 bg-gradient-to-b from-indigo-900 via-purple-900 to-pink-900 p-6 rounded-3xl shadow-2xl border-4 border-purple-500/50">
        <h2 className="text-3xl font-black text-center text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-pink-400 drop-shadow-sm">
          Carte des Niveaux
        </h2>
        <p className={`text-sm text-center text-purple-200 font-medium`}>
          Match-3 québécois — gagne des jetons une fois par niveau par jour.
        </p>
        <div className="grid gap-4 relative">
          <div className="absolute left-1/2 top-0 bottom-0 w-2 bg-pink-500/30 rounded-full -translate-x-1/2 z-0 blur-sm" />
          {levels.map((lvl, index) => {
            const prog = progressFor(lvl.id);
            const claimed = prog?.rewardClaimed;
            const isRight = index % 2 === 1;
            return (
              <button
                key={lvl.id}
                type="button"
                onClick={() => startLevel(lvl)}
                className={`relative z-10 bg-gradient-to-br from-[#2d1b4e] to-[#1a0f2e] border-4 ${
                  claimed ? "border-purple-500/50 opacity-80" : "border-pink-500 hover:border-yellow-400 hover:scale-105 shadow-[0_0_15px_rgba(236,72,153,0.5)]"
                } p-4 rounded-3xl w-[85%] transition-all shadow-xl ${
                  isRight ? "ml-auto" : "mr-auto"
                }`}
              >
                <div className="flex justify-between items-center gap-3">
                  <div className="text-left">
                    <span
                      className={`text-xs uppercase font-black text-pink-400 tracking-wider`}
                    >
                      {lvl.region}
                    </span>
                    <h4 className="font-black text-xl text-white mt-1 drop-shadow-md">
                      {lvl.name}
                    </h4>
                    <p className={`text-sm mt-1 text-purple-200 font-medium`}>
                      But: {lvl.goalCount} {EMOJI_MAP[lvl.goalKind]}
                    </p>
                  </div>
                  <div className="text-right shrink-0 bg-black/40 p-3 rounded-2xl border border-white/10">
                    <div className={`font-black text-yellow-400 text-lg`}>
                      +{lvl.rewardTokens} 🪙
                    </div>
                    {claimed ? (
                      <span className="text-xs text-emerald-400 font-bold uppercase tracking-wider block mt-1">
                        Réclamé
                      </span>
                    ) : (
                      <span className={`text-xs text-pink-300 font-bold block mt-1`}>
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
        className={`w-full bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 p-1 rounded-3xl shadow-lg mb-2`}
      >
        <div className="bg-[#1a0f2e] rounded-[22px] p-3 grid grid-cols-3 gap-2 text-center items-center">
          <div className="bg-[#2d1b4e] rounded-2xl p-2 border-2 border-[#4d3b6e] shadow-inner">
            <p className={`text-[10px] uppercase text-pink-300 font-bold tracking-wider`}>Score</p>
            <p className={`text-2xl font-black text-yellow-400 drop-shadow-md`}>
              {hud.score}
            </p>
          </div>
          <div className="bg-[#2d1b4e] rounded-2xl p-2 border-2 border-[#4d3b6e] shadow-inner scale-110 z-10 bg-gradient-to-b from-[#3d2b5e] to-[#2d1b4e]">
            <p className={`text-[10px] uppercase text-purple-300 font-bold tracking-wider`}>
              Objectif {EMOJI_MAP[hud.target]}
            </p>
            <p className="text-3xl font-black text-white drop-shadow-lg">
              {hud.collected}{" "}
              <span className={`text-lg text-purple-200`}>/ {hud.goal}</span>
            </p>
          </div>
          <div className="bg-[#2d1b4e] rounded-2xl p-2 border-2 border-[#4d3b6e] shadow-inner">
            <p className={`text-[10px] uppercase text-indigo-300 font-bold tracking-wider`}>Coups</p>
            <p className="text-2xl font-black text-white drop-shadow-md">{hud.moves}</p>
          </div>
        </div>
      </div>

      <div className={`relative ${arcadeCard} p-2 overflow-x-auto max-w-full`}>
        <canvas
          ref={assignCanvasRef}
          className="block rounded-sm touch-none"
          style={{ maxWidth: "100%", height: "auto" }}
        />

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
