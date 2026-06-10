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
      resolution: Math.min(window.devicePixelRatio || 1, 2),
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
    
    const boardWidth = this.engine.cols * (TILE_SIZE + PADDING) + PADDING;
    const boardHeight = this.engine.rows * (TILE_SIZE + PADDING) + PADDING;

    const tray = new PIXI.Graphics();
    
    // Tray outer border shadow
    tray.beginFill(0x000000, 0.4)
      .drawRoundedRect(0, 4, boardWidth, boardHeight, 20)
      .endFill();
      
    // Tray main border (rich purple)
    tray.beginFill(0x2d1b4e)
      .drawRoundedRect(0, 0, boardWidth, boardHeight, 20)
      .endFill();
      
    // Tray inner area (darker background)
    tray.beginFill(0x1a0f2e)
      .drawRoundedRect(8, 8, boardWidth - 16, boardHeight - 16, 16)
      .endFill();

    // Top border highlight for glossy effect
    tray.beginFill(0xffffff, 0.15)
      .drawRoundedRect(8, 2, boardWidth - 16, 6, 4)
      .endFill();

    this.boardContainer.addChild(tray);

    for (let r = 0; r < this.engine.rows; r++) {
      for (let c = 0; c < this.engine.cols; c++) {
        const slot = new PIXI.Graphics();
        const isAlternate = (r + c) % 2 === 0;
        
        const x = c * (TILE_SIZE + PADDING) + PADDING;
        const y = r * (TILE_SIZE + PADDING) + PADDING;
        
        slot
          .beginFill(isAlternate ? 0x3d2b5e : 0x4d3b6e, 0.7)
          .drawRoundedRect(x, y, TILE_SIZE, TILE_SIZE, 12)
          .endFill();
          
        // Inner shadow effect
        slot.lineStyle(2, 0x000000, 0.25)
          .drawRoundedRect(x + 1, y + 1, TILE_SIZE - 2, TILE_SIZE - 2, 11)
          .lineStyle(0);
          
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

  bindTileClick(wrapper: PIXI.Container, tile: Tile) {
    wrapper.interactive = true;
    wrapper.cursor = "pointer";
    wrapper.hitArea = new PIXI.Rectangle(0, 0, TILE_SIZE, TILE_SIZE);
    wrapper.on("pointerdown", () => {
      const pos = this.engine.findPosByTileId(tile.id);
      if (pos) void this.handleTileClick(pos.r, pos.c);
    });
  }

  spawnTileSprite(tile: Tile, r: number, c: number, fromAbove = false) {
    const wrapper = createTileDisplay(tile, TILE_SIZE, this.textures);
    wrapper.x = cX(c);
    wrapper.y = fromAbove ? rY(-2) : rY(r);
    wrapper.pivot.set(TILE_SIZE / 2, TILE_SIZE / 2);

    this.bindTileClick(wrapper, tile);
    this.tileContainer.addChild(wrapper);
    this.sprites.set(tile.id, wrapper);

    if (fromAbove) {
      this.animateDrop(wrapper, rY(r));
    }
  }

  syncSpritesToGrid() {
    const liveIds = new Set<number>();

    for (let r = 0; r < this.engine.rows; r++) {
      for (let c = 0; c < this.engine.cols; c++) {
        const tile = this.engine.grid[r]![c];
        if (!tile) continue;
        liveIds.add(tile.id);

        let sprite = this.sprites.get(tile.id);
        if (!sprite) {
          this.spawnTileSprite(tile, r, c);
          sprite = this.sprites.get(tile.id);
        }
        if (sprite) {
          sprite.x = cX(c);
          sprite.y = rY(r);
          sprite.scale.set(1);
        }
      }
    }

    for (const [id, sprite] of this.sprites.entries()) {
      if (!liveIds.has(id)) {
        this.tileContainer.removeChild(sprite);
        this.sprites.delete(id);
        sprite.destroy();
      }
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
      return;
    }

    if (this.selectedPos.r === r && this.selectedPos.c === c) {
      const tile = this.engine.grid[r]![c];
      const s = tile ? this.sprites.get(tile.id) : undefined;
      if (s) s.scale.set(1);
      this.selectedPos = null;
      return;
    }

    this.isAnimating = true;
    const a = this.selectedPos;
    const b = { r, c };
    this.selectedPos = null;

    const tileA = this.engine.grid[a.r]![a.c];
    const sa = tileA ? this.sprites.get(tileA.id) : undefined;
    if (sa) sa.scale.set(1);

    const swapped = this.engine.commitSwap(a, b);
    if (swapped) {
      playSFX("swap");
      await this.animateSwap(a, b);
      const firstWave = this.engine.processFirstWave();
      if (firstWave) {
        await this.runCascade(firstWave);
      }
    } else {
      playSFX("fail");
      if (sa) {
        const tileB = this.engine.grid[b.r]![b.c];
        const sb = tileB ? this.sprites.get(tileB.id) : undefined;
        this.animateBounce(sa, sb);
      }
    }

    this.isAnimating = false;
    this.syncSpritesToGrid();
    this.onUpdateHUD();
  }

  async runCascade(firstWave: MatchResult) {
    let wave: MatchResult | null = firstWave;
    let nextCombo = 2;

    while (wave) {
      await this.processMatchWave(wave);
      this.onUpdateHUD();
      wave = this.engine.stepCascade(nextCombo);
      nextCombo++;
    }
  }

  animateSwap(a: Pos, b: Pos): Promise<void> {
    return new Promise((resolve) => {
      const tileAtA = this.engine.grid[a.r]![a.c];
      const tileAtB = this.engine.grid[b.r]![b.c];
      const sa = tileAtA ? this.sprites.get(tileAtA.id) : undefined;
      const sb = tileAtB ? this.sprites.get(tileAtB.id) : undefined;

      if (sa) {
        sa.x = cX(b.c);
        sa.y = rY(b.r);
      }
      if (sb) {
        sb.x = cX(a.c);
        sb.y = rY(a.r);
      }

      setTimeout(resolve, 180);
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

  async processMatchWave(res: MatchResult) {
    playSFX("match");
    this.shakeScreen(res.cleared.length);

    let midX = 0;
    let midY = 0;
    let count = 0;

    for (const tileId of res.clearedTileIds) {
      const s = this.sprites.get(tileId);
      if (s) {
        midX += s.x;
        midY += s.y;
        count++;
        this.spawnParticles(s.x, s.y);
        this.tileContainer.removeChild(s);
        this.sprites.delete(tileId);
        s.destroy();
      }
    }

    if (count > 0) {
      midX /= count;
      midY /= count;
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

    await new Promise<void>((r) => setTimeout(r, 180));
    await this.animateGravityDrop();
  }

  spawnFloatingText(x: number, y: number, text: string, color: string) {
    const popup = new PIXI.Text(text, {
      fontFamily: "'Fredoka One', 'Varela Round', 'Comic Sans MS', sans-serif",
      fontSize: 28,
      fontWeight: "900",
      fill: color,
      align: "center",
      stroke: "#000000",
      strokeThickness: 5,
      dropShadow: true,
      dropShadowColor: "#000000",
      dropShadowBlur: 4,
      dropShadowAngle: Math.PI / 3,
      dropShadowDistance: 4,
      lineJoin: "round",
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
    for (let i = 0; i < 15; i++) {
      let p: PIXI.Container;
      if (starTex) {
        const sprite = new PIXI.Sprite(starTex);
        sprite.anchor.set(0.5);
        sprite.width = 16;
        sprite.height = 16;
        p = sprite;
      } else {
        const g = new PIXI.Graphics();
        const colors = [0xffd700, 0xff69b4, 0x00ffff, 0xffffff, 0x7fff00];
        const color = colors[Math.floor(Math.random() * colors.length)];
        g.beginFill(color).drawCircle(0, 0, Math.random() * 5 + 3).endFill();
        p = g;
      }
      p.x = x;
      p.y = y;
      this.particleContainer.addChild(p);

      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 6 + 3;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      const gravity = 0.2;

      let frames = 0;
      let currVy = vy;
      const ticker = (delta: number) => {
        frames += delta;
        currVy += gravity * delta;
        p.x += vx * delta;
        p.y += currVy * delta;
        
        const scale = 1 - frames / 40;
        p.scale.set(Math.max(0, scale));
        
        if (frames > 40) {
          this.particleContainer.removeChild(p);
          this.app.ticker.remove(ticker);
          p.destroy();
        }
      };
      this.app.ticker.add(ticker);
    }
  }

  destroy() {
    this.app.destroy(true, {
      children: true,
      texture: false,
      baseTexture: false,
    });
  }
}
