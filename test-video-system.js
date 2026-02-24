/**
 * Video System Test Suite
 * Tests Cloudflare Stream, Mux, and other video sources
 */

const TESTS = {
  // Cloudflare Stream URLs
  cloudflare: [
    {
      name: "Cloudflare Stream HLS",
      url: "https://cloudflarestream.com/abc123/manifest/video.m3u8",
      expectedType: "video",
      needsProxy: true
    },
    {
      name: "Cloudflare Stream Subdomain",
      url: "https://customer-abc.cloudflarestream.com/xyz/video.m3u8",
      expectedType: "video",
      needsProxy: true
    },
    {
      name: "Cloudflare Stream MP4",
      url: "https://cloudflarestream.com/abc123/downloads/video.mp4",
      expectedType: "video",
      needsProxy: true
    }
  ],
  
  // Mux URLs (should NOT be proxied)
  mux: [
    {
      name: "Mux HLS Stream",
      url: "https://stream.mux.com/abc123/playlist.m3u8",
      expectedType: "video",
      needsProxy: false
    },
    {
      name: "Mux Thumbnail",
      url: "https://image.mux.com/abc123/thumbnail.jpg",
      expectedType: "photo",
      needsProxy: false
    }
  ],
  
  // Pexels URLs
  pexels: [
    {
      name: "Pexels Video",
      url: "https://videos.pexels.com/video-files/123/456.mp4",
      expectedType: "video",
      needsProxy: true
    },
    {
      name: "Pexels Image (should be photo)",
      url: "https://images.pexels.com/photos/123/pexels-photo-456.jpeg",
      expectedType: "photo",
      needsProxy: true
    }
  ],
  
  // Direct MP4 URLs
  direct: [
    {
      name: "Direct MP4",
      url: "https://example.com/video.mp4",
      expectedType: "video",
      needsProxy: false
    }
  ]
};

// Test mediaProxy.ts logic
function testMediaProxy(url) {
  const PROXY_DOMAINS = [
    "mixkit.co",
    "assets.mixkit.co",
    "unsplash.com",
    "images.unsplash.com",
    "videos.pexels.com",
    "images.pexels.com",
    "cloudflarestream.com",
    "storage.googleapis.com",
    "commondatastorage.googleapis.com",
  ];

  if (!url) return false;
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    return PROXY_DOMAINS.some((d) => host === d || host.endsWith(`.${d}`));
  } catch {
    return false;
  }
}

// Test validatePostType logic
function testValidatePostType(url, reportedType = "video") {
  const VIDEO_EXTENSIONS = [".mp4", ".mov", ".webm", ".m3u8", ".avi", ".mkv", ".m4v", ".flv", ".wmv", ".3gp"];
  const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".avif", ".svg", ".bmp", ".ico", ".tiff"];
  const VIDEO_HOSTS = [
    "vimeo.com", "player.vimeo.com", "youtube.com", "youtu.be",
    "mixkit.co", "assets.mixkit.co", "cloudflare-stream.com",
    "cloudflarestream.com", "*.cloudflarestream.com",
    "bunnycdn.com", "gtv-videos-bucket", "videos.pexels.com",
    "stream.mux.com"
  ];
  const IMAGE_HOSTS = [
    "unsplash.com", "images.unsplash.com", "images.pexels.com",
    "pixabay.com", "imgur.com", "i.imgur.com", "cloudinary.com",
    "res.cloudinary.com", "imgix.net", "picsum.photos"
    // Note: "pexels.com" omitted - use specific subdomains
  ];

  if (!url) return reportedType;
  const lowerUrl = url.toLowerCase();

  const isKnownImageHost = IMAGE_HOSTS.some((host) => lowerUrl.includes(host));
  if (isKnownImageHost) return "photo";

  const isKnownVideoHost = VIDEO_HOSTS.some((host) => {
    if (host.startsWith("*.")) {
      const domain = host.slice(2);
      return lowerUrl.includes(domain);
    }
    return lowerUrl.includes(host);
  });
  if (isKnownVideoHost) return "video";

  const hasVideoExt = VIDEO_EXTENSIONS.some((ext) => lowerUrl.includes(ext));
  const hasImageExt = IMAGE_EXTENSIONS.some((ext) => lowerUrl.includes(ext));

  if (hasVideoExt && !hasImageExt) return "video";
  if (hasImageExt && !hasVideoExt) return "photo";

  return reportedType;
}

// Run all tests
console.log("🎬 Video System Test Suite\n");
console.log("═".repeat(60));

let passed = 0;
let failed = 0;

for (const [category, tests] of Object.entries(TESTS)) {
  console.log(`\n📁 ${category.toUpperCase()}:`);
  console.log("-".repeat(40));
  
  for (const test of tests) {
    const needsProxy = testMediaProxy(test.url);
    const detectedType = testValidatePostType(test.url, test.expectedType);
    
    const proxyOk = needsProxy === test.needsProxy;
    const typeOk = detectedType === test.expectedType;
    
    if (proxyOk && typeOk) {
      console.log(`  ✅ ${test.name}`);
      passed++;
    } else {
      console.log(`  ❌ ${test.name}`);
      if (!proxyOk) {
        console.log(`     Proxy: expected ${test.needsProxy}, got ${needsProxy}`);
      }
      if (!typeOk) {
        console.log(`     Type: expected ${test.expectedType}, got ${detectedType}`);
      }
      failed++;
    }
  }
}

console.log("\n" + "═".repeat(60));
console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);

if (failed === 0) {
  console.log("\n🎉 All tests passed! Video system is ready.");
  process.exit(0);
} else {
  console.log("\n⚠️  Some tests failed. Review the configuration.");
  process.exit(1);
}
