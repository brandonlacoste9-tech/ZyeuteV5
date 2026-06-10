import * as PIXI from "pixi.js";
import type { Tile, TileKind } from "./types";
import { CANDY_COLORS } from "./types";

const ASSET_BASE = "/assets/arcade/carte-sucree";

export interface CarteSucreeTextures {
  tiles: Partial<Record<TileKind, PIXI.Texture>>;
  star: PIXI.Texture | null;
}

let cachedTextures: CarteSucreeTextures | null = null;

// Premium 3D Glossy SVG Data URIs for the Candies
const SVG_ASSETS: Record<TileKind, string> = {
  puck: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
    <defs>
      <radialGradient id="gradPuck" cx="30%" cy="30%" r="70%">
        <stop offset="0%" stop-color="#ff7eb3"/>
        <stop offset="50%" stop-color="#ff2e63"/>
        <stop offset="100%" stop-color="#a6002f"/>
      </radialGradient>
      <filter id="shadowPuck" x="-20%" y="-20%" width="150%" height="150%">
        <feDropShadow dx="0" dy="6" stdDeviation="4" flood-color="#000" flood-opacity="0.4"/>
      </filter>
    </defs>
    <circle cx="50" cy="50" r="42" fill="url(%23gradPuck)" filter="url(%23shadowPuck)"/>
    <ellipse cx="50" cy="25" rx="20" ry="8" fill="#ffffff" opacity="0.6"/>
    <path d="M 20 50 Q 50 85 80 50" fill="none" stroke="#ffffff" stroke-width="4" opacity="0.3" stroke-linecap="round"/>
  </svg>`,
  
  leaf: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
    <defs>
      <radialGradient id="gradLeaf" cx="30%" cy="30%" r="70%">
        <stop offset="0%" stop-color="#84ffc9"/>
        <stop offset="50%" stop-color="#11998e"/>
        <stop offset="100%" stop-color="#005040"/>
      </radialGradient>
      <filter id="shadowLeaf" x="-20%" y="-20%" width="150%" height="150%">
        <feDropShadow dx="0" dy="6" stdDeviation="4" flood-color="#000" flood-opacity="0.4"/>
      </filter>
    </defs>
    <path d="M 50 10 L 90 50 L 50 90 L 10 50 Z" fill="url(%23gradLeaf)" filter="url(%23shadowLeaf)"/>
    <path d="M 50 20 L 75 50 L 50 80 L 25 50 Z" fill="none" stroke="#ffffff" stroke-width="4" opacity="0.4"/>
    <ellipse cx="50" cy="25" rx="15" ry="5" fill="#ffffff" opacity="0.7"/>
  </svg>`,

  curd: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
    <defs>
      <radialGradient id="gradCurd" cx="30%" cy="30%" r="70%">
        <stop offset="0%" stop-color="#fff185"/>
        <stop offset="50%" stop-color="#fbc31b"/>
        <stop offset="100%" stop-color="#a87c00"/>
      </radialGradient>
      <filter id="shadowCurd" x="-20%" y="-20%" width="150%" height="150%">
        <feDropShadow dx="0" dy="6" stdDeviation="4" flood-color="#000" flood-opacity="0.4"/>
      </filter>
    </defs>
    <rect x="15" y="15" width="70" height="70" rx="20" fill="url(%23gradCurd)" filter="url(%23shadowCurd)"/>
    <rect x="25" y="25" width="50" height="50" rx="12" fill="none" stroke="#ffffff" stroke-width="4" opacity="0.3"/>
    <ellipse cx="35" cy="30" rx="15" ry="6" fill="#ffffff" opacity="0.7"/>
  </svg>`,

  lys: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
    <defs>
      <radialGradient id="gradLys" cx="30%" cy="30%" r="70%">
        <stop offset="0%" stop-color="#7bf2ff"/>
        <stop offset="50%" stop-color="#06b6d4"/>
        <stop offset="100%" stop-color="#004a80"/>
      </radialGradient>
      <filter id="shadowLys" x="-20%" y="-20%" width="150%" height="150%">
        <feDropShadow dx="0" dy="6" stdDeviation="4" flood-color="#000" flood-opacity="0.4"/>
      </filter>
    </defs>
    <path d="M 50 5 L 65 35 L 95 40 L 70 60 L 80 90 L 50 75 L 20 90 L 30 60 L 5 40 L 35 35 Z" fill="url(%23gradLys)" filter="url(%23shadowLys)" stroke-linejoin="round"/>
    <ellipse cx="50" cy="25" rx="10" ry="5" fill="#ffffff" opacity="0.8"/>
  </svg>`,

  cone: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
    <defs>
      <radialGradient id="gradCone" cx="30%" cy="30%" r="70%">
        <stop offset="0%" stop-color="#ffb347"/>
        <stop offset="50%" stop-color="#f97316"/>
        <stop offset="100%" stop-color="#a13b00"/>
      </radialGradient>
      <filter id="shadowCone" x="-20%" y="-20%" width="150%" height="150%">
        <feDropShadow dx="0" dy="6" stdDeviation="4" flood-color="#000" flood-opacity="0.4"/>
      </filter>
    </defs>
    <path d="M 50 15 L 85 80 Q 50 95 15 80 Z" fill="url(%23gradCone)" filter="url(%23shadowCone)"/>
    <path d="M 50 25 L 75 75 Q 50 85 25 75 Z" fill="none" stroke="#ffffff" stroke-width="4" opacity="0.3"/>
    <ellipse cx="50" cy="30" rx="8" ry="12" fill="#ffffff" opacity="0.7"/>
  </svg>`,

  mic: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
    <defs>
      <radialGradient id="gradMic" cx="30%" cy="30%" r="70%">
        <stop offset="0%" stop-color="#e2a0ff"/>
        <stop offset="50%" stop-color="#8b5cf6"/>
        <stop offset="100%" stop-color="#3b0080"/>
      </radialGradient>
      <filter id="shadowMic" x="-20%" y="-20%" width="150%" height="150%">
        <feDropShadow dx="0" dy="6" stdDeviation="4" flood-color="#000" flood-opacity="0.4"/>
      </filter>
    </defs>
    <path d="M 30 15 A 25 25 0 1 1 70 15 A 25 25 0 1 1 85 50 A 25 25 0 1 1 70 85 A 25 25 0 1 1 30 85 A 25 25 0 1 1 15 50 A 25 25 0 1 1 30 15 Z" fill="url(%23gradMic)" filter="url(%23shadowMic)"/>
    <circle cx="50" cy="50" r="20" fill="none" stroke="#ffffff" stroke-width="5" opacity="0.3"/>
    <ellipse cx="35" cy="30" rx="10" ry="10" fill="#ffffff" opacity="0.7"/>
  </svg>`
};

const STAR_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <path d="M 50 5 L 65 35 L 95 40 L 70 60 L 80 90 L 50 75 L 20 90 L 30 60 L 5 40 L 35 35 Z" fill="#ffeb3b" filter="drop-shadow(0px 0px 8px #ffeb3b)"/>
</svg>`;

async function loadTexture(url: string): Promise<PIXI.Texture | null> {
  try {
    return await PIXI.Assets.load(url);
  } catch {
    return null;
  }
}

export async function loadCarteSucreeAssets(): Promise<CarteSucreeTextures> {
  if (cachedTextures) return cachedTextures;

  const tiles: Partial<Record<TileKind, PIXI.Texture>> = {};
  
  // Load SVG Textures concurrently
  const entries = await Promise.all(
    (Object.entries(SVG_ASSETS) as [TileKind, string][]).map(
      async ([kind, dataUri]) => {
        const texture = await loadTexture(dataUri);
        return [kind, texture] as const;
      },
    ),
  );

  for (const [kind, texture] of entries) {
    if (texture) tiles[kind] = texture;
  }

  const star = await loadTexture(STAR_SVG);

  cachedTextures = { tiles, star };
  return cachedTextures;
}

export function hasRealAssets(textures: CarteSucreeTextures): boolean {
  return true; // We always use the high fidelity SVGs now!
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
    sprite.width = size - 4; // Maximize size but keep a tiny padding
    sprite.height = size - 4;
    sprite.x = size / 2;
    sprite.y = size / 2;
    wrapper.addChild(sprite);

    // Apply special visual effects (Row Clear, Col Clear, Color Bomb)
    if (tile.special !== "none") {
      const overlay = new PIXI.Graphics();
      overlay.x = 0;
      overlay.y = 0;
      const s = size - 8;
      const cx = size / 2;
      const cy = size / 2;
      
      if (tile.special === "rowClear") {
        overlay
          .beginFill(0xffffff, 0.9)
          .drawRoundedRect(cx - s / 2, cy - 4, s, 8, 4)
          .endFill();
        // Add a glowing trail
        overlay.lineStyle(2, 0xffffff, 0.5).drawRoundedRect(cx - s / 2 - 2, cy - 6, s + 4, 12, 6);
      } else if (tile.special === "colClear") {
        overlay
          .beginFill(0xffffff, 0.9)
          .drawRoundedRect(cx - 4, cy - s / 2, 8, s, 4)
          .endFill();
        overlay.lineStyle(2, 0xffffff, 0.5).drawRoundedRect(cx - 6, cy - s / 2 - 2, 12, s + 4, 6);
      } else if (tile.special === "colorBomb") {
        // Multi-color rainbow pulsing aura around color bomb
        overlay
          .lineStyle(4, 0xffffff, 1)
          .drawCircle(cx, cy, s / 2 - 4)
          .lineStyle(2, 0xffff00, 0.8)
          .drawCircle(cx, cy, s / 2 - 2)
          .lineStyle(0);
        
        // Inner intense core
        overlay.beginFill(0xffffff, 1).drawCircle(cx, cy, 6).endFill();
      }
      wrapper.addChild(overlay);
    }
  }

  return wrapper;
}
