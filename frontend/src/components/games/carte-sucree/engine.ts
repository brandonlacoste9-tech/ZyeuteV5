import type { MatchResult, Pos, SpecialKind, Tile, TileKind } from "./types";
import { KINDS } from "./types";

let tileIdCounter = 0;

let audioCtx: AudioContext | null = null;

export function playSFX(type: "swap" | "match" | "fail") {
  if (typeof window === "undefined") return;
  if (!audioCtx) {
    audioCtx = new (
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext
    )();
  }

  if (audioCtx.state === "suspended") {
    void audioCtx.resume();
  }

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);

  const now = audioCtx.currentTime;

  if (type === "swap") {
    osc.type = "sine";
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(660, now + 0.05);
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    osc.start(now);
    osc.stop(now + 0.1);
  } else if (type === "match") {
    osc.type = "sine";
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(1200, now + 0.1);
    gain.gain.setValueAtTime(0.0, now);
    gain.gain.linearRampToValueAtTime(0.25, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    
    const osc2 = audioCtx.createOscillator();
    osc2.type = "triangle";
    osc2.frequency.setValueAtTime(1200, now);
    osc2.frequency.exponentialRampToValueAtTime(2400, now + 0.1);
    osc2.connect(gain);
    osc2.start(now);
    osc2.stop(now + 0.3);
    
    osc.start(now);
    osc.stop(now + 0.3);
  } else {
    osc.type = "sine";
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(50, now + 0.15);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    osc.start(now);
    osc.stop(now + 0.15);
  }
}

export class Match3Engine {
  rows: number;
  cols: number;
  grid: (Tile | null)[][];
  score = 0;
  movesLeft: number;
  goalKind: TileKind;
  goalCount: number;
  collected = 0;

  constructor(
    rows: number,
    cols: number,
    moves: number,
    goalKind: TileKind,
    goalCount: number,
  ) {
    this.rows = rows;
    this.cols = cols;
    this.movesLeft = moves;
    this.goalKind = goalKind;
    this.goalCount = goalCount;
    this.grid = Array.from({ length: rows }, () =>
      new Array<Tile | null>(cols).fill(null),
    );
    this.fillGrid();
  }

  randomTile(): Tile {
    const isSpecial = Math.random() < 0.05;
    let special: SpecialKind = "none";

    if (isSpecial) {
      const r = Math.random();
      if (r < 0.4) special = "rowClear";
      else if (r < 0.8) special = "colClear";
      else special = "colorBomb";
    }

    return {
      id: ++tileIdCounter,
      kind: KINDS[Math.floor(Math.random() * KINDS.length)]!,
      special,
    };
  }

  fillGrid() {
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (!this.grid[r]![c]) {
          let tile: Tile;
          do {
            tile = this.randomTile();
          } while (this.createsInitialMatch(r, c, tile.kind));
          this.grid[r]![c] = tile;
        }
      }
    }
  }

  createsInitialMatch(r: number, c: number, kind: TileKind): boolean {
    if (
      r >= 2 &&
      this.grid[r - 1]![c]?.kind === kind &&
      this.grid[r - 2]![c]?.kind === kind
    ) {
      return true;
    }
    if (
      c >= 2 &&
      this.grid[r]![c - 1]?.kind === kind &&
      this.grid[r]![c - 2]?.kind === kind
    ) {
      return true;
    }
    return false;
  }

  /** Swap tiles and consume a move if the swap creates a match. Grid stays swapped until waves clear. */
  commitSwap(a: Pos, b: Pos): boolean {
    if (!this.isAdjacent(a, b)) return false;

    const temp = this.grid[a.r]![a.c];
    this.grid[a.r]![a.c] = this.grid[b.r]![b.c];
    this.grid[b.r]![b.c] = temp;

    const matches = this.findMatches();
    if (matches.size === 0) {
      const temp2 = this.grid[a.r]![a.c];
      this.grid[a.r]![a.c] = this.grid[b.r]![b.c];
      this.grid[b.r]![b.c] = temp2;
      return false;
    }

    this.movesLeft--;
    return true;
  }

  processFirstWave(): MatchResult | null {
    const matches = this.findMatches();
    if (matches.size === 0) return null;
    return this.processOneWave(matches, 1);
  }

  /** Run the next auto-cascade wave (combo 2+) after animations finish. */
  stepCascade(combo: number): MatchResult | null {
    const matches = this.findMatches();
    if (matches.size === 0) return null;
    return this.processOneWave(matches, combo);
  }

  findPosByTileId(tileId: number): Pos | null {
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (this.grid[r]![c]?.id === tileId) return { r, c };
      }
    }
    return null;
  }

  isAdjacent(a: Pos, b: Pos): boolean {
    const dr = Math.abs(a.r - b.r);
    const dc = Math.abs(a.c - b.c);
    return (dr === 1 && dc === 0) || (dr === 0 && dc === 1);
  }

  findMatches(): Set<string> {
    const matched = new Set<string>();

    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols - 2; c++) {
        const k = this.grid[r]![c]?.kind;
        if (!k) continue;
        if (
          this.grid[r]![c + 1]?.kind === k &&
          this.grid[r]![c + 2]?.kind === k
        ) {
          matched.add(`${r},${c}`);
          matched.add(`${r},${c + 1}`);
          matched.add(`${r},${c + 2}`);
        }
      }
    }

    for (let r = 0; r < this.rows - 2; r++) {
      for (let c = 0; c < this.cols; c++) {
        const k = this.grid[r]![c]?.kind;
        if (!k) continue;
        if (
          this.grid[r + 1]![c]?.kind === k &&
          this.grid[r + 2]![c]?.kind === k
        ) {
          matched.add(`${r},${c}`);
          matched.add(`${r + 1},${c}`);
          matched.add(`${r + 2},${c}`);
        }
      }
    }

    return matched;
  }

  processOneWave(matches: Set<string>, combo: number): MatchResult {
    const clearedSet = new Set<string>();

    const triggerExplosion = (r: number, c: number) => {
      const key = `${r},${c}`;
      if (clearedSet.has(key)) return;

      const tile = this.grid[r]?.[c];
      if (!tile) return;

      clearedSet.add(key);

      if (tile.special === "rowClear") {
        for (let cc = 0; cc < this.cols; cc++) {
          if (this.grid[r]![cc]) triggerExplosion(r, cc);
        }
      } else if (tile.special === "colClear") {
        for (let rr = 0; rr < this.rows; rr++) {
          if (this.grid[rr]![c]) triggerExplosion(rr, c);
        }
      } else if (tile.special === "colorBomb") {
        const targetKind = tile.kind;
        for (let rr = 0; rr < this.rows; rr++) {
          for (let cc = 0; cc < this.cols; cc++) {
            if (this.grid[rr]![cc]?.kind === targetKind) {
              triggerExplosion(rr, cc);
            }
          }
        }
      }
    };

    matches.forEach((posStr) => {
      const [r, c] = posStr.split(",").map(Number);
      triggerExplosion(r!, c!);
    });

    const cleared: Pos[] = [];
    const clearedTileIds: number[] = [];

    clearedSet.forEach((posStr) => {
      const [r, c] = posStr.split(",").map(Number);
      const tile = this.grid[r!]![c!];
      if (tile) {
        if (tile.kind === this.goalKind) this.collected++;
        cleared.push({ r: r!, c: c! });
        clearedTileIds.push(tile.id);
        this.grid[r!]![c!] = null;
      }
    });

    const scoreGained = cleared.length * 10 * combo;
    this.score += scoreGained;

    this.applyGravity();
    this.fillGrid();

    return { cleared, clearedTileIds, scoreGained, combo };
  }

  applyGravity() {
    for (let c = 0; c < this.cols; c++) {
      for (let r = this.rows - 1; r >= 0; r--) {
        if (this.grid[r]![c] === null) {
          for (let k = r - 1; k >= 0; k--) {
            if (this.grid[k]![c] !== null) {
              this.grid[r]![c] = this.grid[k]![c];
              this.grid[k]![c] = null;
              break;
            }
          }
        }
      }
    }
  }
}
