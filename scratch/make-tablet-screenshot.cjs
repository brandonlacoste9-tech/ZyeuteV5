/**
 * Converts the 1024×1024 generated image to a true 1920×1080 PNG.
 * Strategy: scale up to 1080×1080, then extend left/right with the
 * brand dark background (#0D0A06) to reach 1920 wide.
 */
const sharp = require('sharp');
const path = require('path');

const INPUT  = path.join(__dirname, '../frontend/public/zyeute_tablet_1920x1080.png');
const TEMP   = path.join(__dirname, '../frontend/public/zyeute_tablet_1920x1080_tmp.png');
const OUTPUT = INPUT;

const TARGET_W = 1920;
const TARGET_H = 1080;
// Brand dark background: #0D0A06 → R:13 G:10 B:6
const BG = { r: 13, g: 10, b: 6, alpha: 1 };

async function main() {
  const meta = await sharp(INPUT).metadata();
  console.log(`Input: ${meta.width}×${meta.height}`);

  // Step 1: scale the square image to TARGET_H×TARGET_H (1080×1080)
  // Step 2: extend left and right to reach TARGET_W (1920)
  const padLeft  = Math.floor((TARGET_W - TARGET_H) / 2); // 420
  const padRight = TARGET_W - TARGET_H - padLeft;          // 420

  await sharp(INPUT)
    .resize(TARGET_H, TARGET_H, { fit: 'fill' })   // 1080×1080
    .extend({
      left:       padLeft,
      right:      padRight,
      top:        0,
      bottom:     0,
      background: BG,
    })
    .toFile(TEMP);

  // Overwrite original with resized version
  const fs = require('fs');
  fs.renameSync(TEMP, OUTPUT);

  const out = await sharp(OUTPUT).metadata();
  console.log(`Output: ${out.width}×${out.height} → ${OUTPUT}`);
}

main().catch(e => { console.error(e); process.exit(1); });
