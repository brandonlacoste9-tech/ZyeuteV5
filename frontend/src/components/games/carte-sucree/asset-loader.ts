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
  g.clear();
  g.beginFill(0x000000, 0.3)
    .drawRoundedRect(4, 6, size - 8, size - 8, 16)
    .endFill();
  g.beginFill(color)
    .drawRoundedRect(2, 2, size - 4, size - 4, 18)
    .endFill();

  if (tile.special === "rowClear") {
    g.beginFill(0xffffff, 0.6)
      .drawRect(2, size / 2 - 4, size - 4, 8)
      .endFill();
  } else if (tile.special === "colClear") {
    g.beginFill(0xffffff, 0.6)
      .drawRect(size / 2 - 4, 2, 8, size - 4)
      .endFill();
  } else if (tile.special === "colorBomb") {
    g.lineStyle(4, 0xffffff, 0.9)
      .drawCircle(size / 2, size / 2, size / 2 - 8)
      .lineStyle(0);
  }

  g.beginFill(0xffffff, 0.4)
    .drawRoundedRect(size * 0.15, size * 0.1, size * 0.7, size * 0.25, 10)
    .endFill();
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
      if (tile.special === "rowClear") {
        overlay
          .beginFill(0xffffff, 0.55)
          .drawRect(4, size / 2 - 3, size - 8, 6)
          .endFill();
      } else if (tile.special === "colClear") {
        overlay
          .beginFill(0xffffff, 0.55)
          .drawRect(size / 2 - 3, 4, 6, size - 8)
          .endFill();
      } else if (tile.special === "colorBomb") {
        overlay
          .lineStyle(3, 0xffffff, 0.95)
          .drawCircle(size / 2, size / 2, size / 2 - 6)
          .lineStyle(0);
      }
      wrapper.addChild(overlay);
    }
  } else {
    const g = new PIXI.Graphics();
    drawFallbackCandy(g, tile, size);
    wrapper.addChild(g);

    const emoji = new PIXI.Text(EMOJI_MAP[tile.kind], { fontSize: 28 });
    emoji.anchor.set(0.5);
    emoji.x = size / 2;
    emoji.y = size / 2;
    wrapper.addChild(emoji);
  }

  return wrapper;
}
