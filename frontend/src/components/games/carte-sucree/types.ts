export type TileKind = "puck" | "leaf" | "curd" | "lys" | "cone" | "mic";
export type SpecialKind = "none" | "rowClear" | "colClear" | "colorBomb";

export interface Pos {
  r: number;
  c: number;
}

export interface Tile {
  id: number;
  kind: TileKind;
  special: SpecialKind;
}

export interface MatchResult {
  cleared: Pos[];
  clearedTileIds: number[];
  scoreGained: number;
  combo: number;
}

export interface LevelConfig {
  id: string;
  region: string;
  name: string;
  moves: number;
  goalKind: TileKind;
  goalCount: number;
  rewardTokens: number;
}

export const KINDS: TileKind[] = ["puck", "leaf", "curd", "lys", "cone", "mic"];

export const EMOJI_MAP: Record<TileKind, string> = {
  puck: "🏒",
  leaf: "🍁",
  curd: "🧀",
  lys: "⚜️",
  cone: "🌲",
  mic: "🎤",
};

export const CANDY_COLORS: Record<TileKind, number> = {
  puck: 0x475569,
  leaf: 0xf43f5e,
  curd: 0xfbbf24,
  lys: 0x3b82f6,
  cone: 0x10b981,
  mic: 0xd946ef,
};
