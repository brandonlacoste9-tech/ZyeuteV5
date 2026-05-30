/**
 * Patches SingleVideoView.tsx to add social embed detection helpers
 * Run once with: node scripts/patch-social-embed.js
 */
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'frontend', 'src', 'components', 'features', 'SingleVideoView.tsx');
let content = fs.readFileSync(filePath, 'utf8');

const MARKER = 'let videoSrc = "";';

if (content.includes('isSocialEmbedUrl')) {
  console.log('Already patched, skipping');
  process.exit(0);
}

const helper = `// Detect social embed URLs that need an iframe, not a <video> tag
    const isSocialEmbedUrl = (url: string): boolean => {
      if (!url) return false;
      const u = url.toLowerCase();
      return (
        (u.includes("tiktok.com") && u.includes("/video/")) ||
        u.includes("instagram.com/reel/") ||
        u.includes("instagram.com/p/") ||
        (u.includes("youtube.com") && u.includes("watch")) ||
        u.includes("youtu.be/")
      );
    };
    const getSocialEmbedUrl = (url: string): string | null => {
      const u = url.toLowerCase();
      if (u.includes("tiktok.com") && u.includes("/video/")) {
        const m = url.match(/\/video\/(\d+)/);
        return m ? "https://www.tiktok.com/embed/v2/" + m[1] : null;
      }
      if (u.includes("youtube.com") || u.includes("youtu.be")) {
        const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:.*v=|\/embed\/|\/v\/))([^?&"'>]+)/);
        return m ? "https://www.youtube.com/embed/" + m[1] + "?autoplay=0&rel=0" : null;
      }
      return null;
    };
    let videoSrc = "";`;

if (!content.includes(MARKER)) {
  console.error('MARKER NOT FOUND');
  process.exit(1);
}

content = content.replace(MARKER, helper);
fs.writeFileSync(filePath, content, 'utf8');
console.log('Patched SingleVideoView.tsx with social embed helpers');
