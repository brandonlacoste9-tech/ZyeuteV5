import * as PIXI from "pixi.js";
import type { CarteSucreeTextures } from "./asset-loader";
import { createTileDisplay } from "./asset-loader";
import type { MatchResult, Pos, Tile } from "./types";
import { Match3Engine, playSFX } from "./engine";

export const TILE_SIZE = 64;
export const PADDING = 4;

const cX = (c: number) => c * (TILE_SIZE + PADDING) + PADDING + TILE_SIZE / 2;
const rY = (r: number) => r * (TILE_SIZE + PADDING) + PADDING + TILE_SIZE / 2;

export class PixiBoard {
  app: PIXI.Application;
  engine: Match3Engine;
  textures: CarteSucreeTextures;
  boardContainer: PIXI.Container;
  tileContainer: PIXI.Container;
  uiContainer: PIXI.Container;
  particleContainer: PIXI.Container;
  sprites = new Map<number, PIXI.Container>();
  selectedPos: Pos | null = null;
  onUpdateHUD: () => void;
  isAnimating = false;

  constructor(
    canvas: HTMLCanvasElement,
    engine: Match3Engine,
    textures: CarteSucreeTextures,
    onUpdateHUD: () => void,
  ) {
    this.engine = engine;
    this.textures = textures;
    this.onUpdateHUD = onUpdateHUD;

    this.app = new PIXI.Application({
      view: canvas,
      width: engine.cols * (TILE_SIZE + PADDING) + PADDING,
      height: engine.rows * (TILE_SIZE + PADDING) + PADDING,
      backgroundAlpha: 0,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    });

    this.boardContainer = new PIXI.Container();
    this.tileContainer = new PIXI.Container();
    this.uiContainer = new PIXI.Container();
    this.particleContainer = new PIXI.Container();

    this.app.stage.addChild(this.boardContainer);
    this.app.stage.addChild(this.tileContainer);
    this.app.stage.addChild(this.particleContainer);
    this.app.stage.addChild(this.uiContainer);

    this.drawBackground();
    this.drawBoard();
  }

  drawBackground() {
    this.boardContainer.removeChildren();
    for (let r = 0; r < this.engine.rows; r++) {
      for (let c = 0; c < this.engine.cols; c++) {
        const slot = new PIXI.Graphics();
        const isAlternate = (r + c) % 2 === 0;
        slot
          .beginFill(isAlternate ? 0x000000 : 0xffffff, isAlternate ? 0.2 : 0.1)
          .drawRoundedRect(
            c * (TILE_SIZE + PADDING) + PADDING,
            r * (TILE_SIZE + PADDING) + PADDING,
            TILE_SIZE,
            TILE_SIZE,
            16,
          )
          .endFill();
        this.boardContainer.addChild(slot);
      }
    }
  }

  drawBoard() {
    this.tileContainer.removeChildren();
    this.sprites.clear();

    for (let r = 0; r < this.engine.rows; r++) {
      for (let c = 0; c < this.engine.cols; c++) {
        const tile = this.engine.grid[r]![c];
        if (tile) this.spawnTileSprite(tile, r, c);
      }
    }
  }

  spawnTileSprite(tile: Tile, r: number, c: number, fromAbove = false) {
    const wrapper = createTileDisplay(tile, TILE_SIZE, this.textures);
    wrapper.x = cX(c);
    wrapper.y = fromAbove ? rY(-2) : rY(r);
    wrapper.pivot.set(TILE_SIZE / 2, TILE_SIZE / 2);

    wrapper.interactive = true;
    wrapper.cursor = "pointer";
    wrapper.on("pointerdown", () => void this.handleTileClick(r, c));

    this.tileContainer.addChild(wrapper);
    this.sprites.set(tile.id, wrapper);

    if (fromAbove) {
      this.animateDrop(wrapper, rY(r));
    }
  }

  animateDrop(sprite: PIXI.Container, targetY: number) {
    const startY = sprite.y;
    let frames = 0;
    const ticker = (delta: number) => {
      frames += delta;
      const t = Math.min(1, frames / 12);
      sprite.y = startY + (targetY - startY) * t;
      if (t < 1) {
        sprite.scale.y = 1 + (1 - t) * 0.15;
        sprite.scale.x = 1 - (1 - t) * 0.05;
      } else {
        sprite.y = targetY;
        sprite.scale.set(1);
        this.app.ticker.remove(ticker);
      }
    };
    this.app.ticker.add(ticker);
  }

  async handleTileClick(r: number, c: number) {
    if (this.isAnimating) return;

    if (!this.selectedPos) {
      this.selectedPos = { r, c };
      const tile = this.engine.grid[r]![c];
      const s = tile ? this.sprites.get(tile.id) : undefined;
      if (s) s.scale.set(1.15);
    } else {
      this.isAnimating = true;
      const a = this.selectedPos;
      const b = { r, c };
      this.selectedPos = null;

      const tileA = this.engine.grid[a.r]![a.c];
      const sa = tileA ? this.sprites.get(tileA.id) : undefined;
      if (sa) sa.scale.set(1);

      const results = this.engine.trySwap(a, b);
      if (results) {
        playSFX("swap");
        await this.animateSwap(a, b);
        await this.processMatchResults(results);
      } else {
        playSFX("fail");
        if (sa) {
          const tileB = this.engine.grid[b.r]![b.c];
          const sb = tileB ? this.sprites.get(tileB.id) : undefined;
          this.animateBounce(sa, sb);
        }
      }
      this.isAnimating = false;
      this.onUpdateHUD();
    }
  }

  animateSwap(a: Pos, b: Pos): Promise<void> {
    return new Promise((resolve) => {
      const ta = this.engine.grid[b.r]![b.c];
      const tb = this.engine.grid[a.r]![a.c];
      const sa = ta ? this.sprites.get(ta.id) : undefined;
      const sb = tb ? this.sprites.get(tb.id) : undefined;

      if (sa) {
        sa.x = cX(b.c);
        sa.y = rY(b.r);
      }
      if (sb) {
        sb.x = cX(a.c);
        sb.y = rY(a.r);
      }

      setTimeout(resolve, 200);
    });
  }

  animateBounce(sa: PIXI.Container, sb: PIXI.Container | undefined) {
    const originalX = sa.x;
    sa.x += 10;
    setTimeout(() => {
      sa.x = originalX;
      if (sb) {
        const originalBX = sb.x;
        sb.x -= 10;
        setTimeout(() => {
          sb.x = originalBX;
        }, 50);
      }
    }, 50);
  }

  async processMatchResults(results: MatchResult[]) {
    for (const res of results) {
      playSFX("match");
      this.shakeScreen(res.cleared.length);

      let midX = 0;
      let midY = 0;

      res.cleared.forEach((p) => {
        const id = this.getSpriteIdAt(p);
        if (id) {
          const s = this.sprites.get(id);
          if (s) {
            midX += s.x;
            midY += s.y;
            this.spawnParticles(s.x, s.y);
            this.tileContainer.removeChild(s);
            this.sprites.delete(id);
          }
        }
      });

      if (res.cleared.length > 0) {
        midX /= res.cleared.length;
        midY /= res.cleared.length;
        let textStr = `${res.scoreGained}`;
        if (res.combo > 1) {
          textStr = `Super!\n${textStr} (x${res.combo})`;
        }
        this.spawnFloatingText(
          midX,
          midY,
          textStr,
          res.combo > 1 ? "#fbbf24" : "#ffffff",
        );
      }

      await new Promise<void>((r) => setTimeout(r, 200));
      await this.animateGravityDrop();
    }
  }

  spawnFloatingText(x: number, y: number, text: string, color: string) {
    const popup = new PIXI.Text(text, {
      fontFamily: "sans-serif",
      fontSize: 22,
      fontWeight: "900",
      fill: color,
      align: "center",
    });
    popup.anchor.set(0.5);
    popup.x = x;
    popup.y = y;
    this.uiContainer.addChild(popup);

    let frames = 0;
    const ticker = (delta: number) => {
      frames += delta;
      popup.y -= 1.2;
      popup.alpha -= 0.025;
      if (frames > 55) {
        this.uiContainer.removeChild(popup);
        this.app.ticker.remove(ticker);
        popup.destroy();
      }
    };
    this.app.ticker.add(ticker);
  }

  animateGravityDrop(): Promise<void> {
    return new Promise((resolve) => {
      for (let r = 0; r < this.engine.rows; r++) {
        for (let c = 0; c < this.engine.cols; c++) {
          const tile = this.engine.grid[r]![c];
          if (!tile) continue;

          let s = this.sprites.get(tile.id);
          const targetY = rY(r);
          const targetX = cX(c);

          if (!s) {
            this.spawnTileSprite(tile, r, c, true);
            s = this.sprites.get(tile.id);
          }
          if (s) {
            s.x = targetX;
            this.animateDrop(s, targetY);
          }
        }
      }
      setTimeout(resolve, 220);
    });
  }

  shakeScreen(intensity: number) {
    if (intensity < 4) return;
    const originalX = this.app.stage.x;
    this.app.stage.x += 6;
    setTimeout(() => {
      this.app.stage.x = originalX;
    }, 60);
  }

  spawnParticles(x: number, y: number) {
    const starTex = this.textures.star;
    for (let i = 0; i < 8; i++) {
      let p: PIXI.Container;
      if (starTex) {
        const sprite = new PIXI.Sprite(starTex);
        sprite.anchor.set(0.5);
        sprite.width = 12;
        sprite.height = 12;
        p = sprite;
      } else {
        const g = new PIXI.Graphics();
        g.beginFill(0xffffff).drawCircle(0, 0, 4).endFill();
        p = g;
      }
      p.x = x;
      p.y = y;
      this.particleContainer.addChild(p);

      const vx = (Math.random() - 0.5) * 6;
      const vy = (Math.random() - 0.5) * 6;

      let frames = 0;
      const ticker = (delta: number) => {
        frames += delta;
        p.x += vx;
        p.y += vy;
        p.alpha -= 0.06;
        if (frames > 18) {
          this.particleContainer.removeChild(p);
          this.app.ticker.remove(ticker);
          p.destroy();
        }
      };
      this.app.ticker.add(ticker);
    }
  }

  getSpriteIdAt(p: Pos): number | null {
    for (const [id, s] of this.sprites.entries()) {
      const c = Math.round(
        (s.x - PADDING - TILE_SIZE / 2) / (TILE_SIZE + PADDING),
      );
      const r = Math.round(
        (s.y - PADDING - TILE_SIZE / 2) / (TILE_SIZE + PADDING),
      );
      if (r === p.r && c === p.c) return id;
    }
    return null;
  }

  destroy() {
    this.app.destroy(true, {
      children: true,
      texture: true,
      baseTexture: true,
    });
  }
}
