import * as PIXI from "pixi.js";
import type { Tile, TileKind } from "./types";
import { CANDY_COLORS, EMOJI_MAP } from "./types";

const ASSET_BASE = "/assets/arcade/carte-sucree";

const TILE_PATHS: Record<TileKind, string> = {
  puck: `${ASSET_BASE}/tiles/puck.png`,
  leaf: `${ASSET_BASE}/tiles/leaf.png`,
  curd: `${ASSET_BASE}/tiles/curd.png`,
  lys: `${ASSET_BASE}/tiles/lys.png`,
  cone: `${ASSET_BASE}/tiles/cone.png`,
  mic: `${ASSET_BASE}/tiles/mic.png`,
};

export interface CarteSucreeTextures {
  tiles: Partial<Record<TileKind, PIXI.Texture>>;
  star: PIXI.Texture | null;
}

let cachedTextures: CarteSucreeTextures | null = null;

async function loadTexture(url: string): Promise<PIXI.Texture | null> {
  try {
    return await PIXI.Assets.load(url);
  } catch {
    return null;
  }
}

export async function loadCarteSucreeAssets(): Promise<CarteSucreeTextures> {
  if (cachedTextures) return cachedTextures;

  const entries = await Promise.all(
    (Object.entries(TILE_PATHS) as [TileKind, string][]).map(
      async ([kind, path]) => {
        const texture = await loadTexture(path);
        return [kind, texture] as const;
      },
    ),
  );

  const tiles: Partial<Record<TileKind, PIXI.Texture>> = {};
  for (const [kind, texture] of entries) {
    if (texture) tiles[kind] = texture;
  }

  const star = await loadTexture(`${ASSET_BASE}/fx/star.png`);

  cachedTextures = { tiles, star };
  return cachedTextures;
}

export function hasRealAssets(textures: CarteSucreeTextures): boolean {
  return (Object.keys(TILE_PATHS) as TileKind[]).every(
    (k) => textures.tiles[k] != null,
  );
}

function drawFallbackCandy(g: PIXI.Graphics, tile: Tile, size: number) {
  const color = CANDY_COLORS[tile.kind];
  const s = size - 8;
  const cx = size / 2;
  const cy = size / 2;

  g.clear();
  
  // Drop shadow
  g.beginFill(0x000000, 0.4)
    .drawCircle(cx + 2, cy + 4, s / 2 - 2)
    .endFill();

  // Main body
  g.beginFill(color)
    .drawCircle(cx, cy, s / 2)
    .endFill();

  // Inner shadow for depth
  g.lineStyle(4, 0x000000, 0.15)
    .drawCircle(cx, cy, s / 2 - 2)
    .lineStyle(0);

  // Specular highlight (top curve)
  g.beginFill(0xffffff, 0.6)
    .drawEllipse(cx, cy - s / 3 + 2, s / 3, s / 8)
    .endFill();
    
  // Bottom reflection
  g.beginFill(0xffffff, 0.2)
    .drawEllipse(cx, cy + s / 3 - 2, s / 4, s / 12)
    .endFill();

  if (tile.special === "rowClear") {
    g.beginFill(0xffffff, 0.9)
      .drawRoundedRect(cx - s / 2 + 4, cy - 3, s - 8, 6, 3)
      .endFill();
  } else if (tile.special === "colClear") {
    g.beginFill(0xffffff, 0.9)
      .drawRoundedRect(cx - 3, cy - s / 2 + 4, 6, s - 8, 3)
      .endFill();
  } else if (tile.special === "colorBomb") {
    g.lineStyle(4, 0xffffff, 0.95)
      .drawCircle(cx, cy, s / 2 - 6)
      .lineStyle(0);
    g.beginFill(0xffffff, 0.9).drawCircle(cx, cy, 4).endFill();
  }
}

export function createTileDisplay(
  tile: Tile,
  size: number,
  textures: CarteSucreeTextures,
): PIXI.Container {
  const wrapper = new PIXI.Container();
  const texture = textures.tiles[tile.kind];

  if (texture) {
    const sprite = new PIXI.Sprite(texture);
    sprite.anchor.set(0.5);
    sprite.width = size - 8;
    sprite.height = size - 8;
    sprite.x = size / 2;
    sprite.y = size / 2;
    wrapper.addChild(sprite);

    if (tile.special !== "none") {
      const overlay = new PIXI.Graphics();
      overlay.x = 0;
      overlay.y = 0;
      const s = size - 8;
      const cx = size / 2;
      const cy = size / 2;
      
      if (tile.special === "rowClear") {
        overlay
          .beginFill(0xffffff, 0.8)
          .drawRoundedRect(cx - s / 2 + 4, cy - 3, s - 8, 6, 3)
          .endFill();
      } else if (tile.special === "colClear") {
        overlay
          .beginFill(0xffffff, 0.8)
          .drawRoundedRect(cx - 3, cy - s / 2 + 4, 6, s - 8, 3)
          .endFill();
      } else if (tile.special === "colorBomb") {
        overlay
          .lineStyle(3, 0xffffff, 0.95)
          .drawCircle(cx, cy, s / 2 - 6)
          .lineStyle(0);
      }
      wrapper.addChild(overlay);
    }
  } else {
    const g = new PIXI.Graphics();
    drawFallbackCandy(g, tile, size);
    wrapper.addChild(g);

    const emoji = new PIXI.Text(EMOJI_MAP[tile.kind], { 
      fontSize: 26,
      dropShadow: true,
      dropShadowDistance: 2,
      dropShadowAlpha: 0.5,
      dropShadowBlur: 2
    });
    emoji.anchor.set(0.5);
    emoji.x = size / 2;
    emoji.y = size / 2;
    wrapper.addChild(emoji);
  }

  return wrapper;
}
