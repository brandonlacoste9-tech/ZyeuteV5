/**
 * Video System Integration Tests
 * Tests video player selection logic for different sources
 */

import { describe, it, expect } from 'vitest';

// Simulate the player selection logic from VideoCard.tsx
function getVideoPlayerType(url: string, hasMuxPlaybackId: boolean = false): 'mux' | 'hls' | 'native' {
  if (hasMuxPlaybackId) return 'mux';
  
  const isCloudflareStream = url.includes('cloudflarestream.com') || 
                             url.includes('cloudflare-stream.com');
  const isHLS = url.includes('.m3u8') || isCloudflareStream;
  
  return isHLS ? 'hls' : 'native';
}

// Simulate proxy detection
function needsMediaProxy(url: string): boolean {
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

describe('Video Player Selection', () => {
  describe('Cloudflare Stream', () => {
    it('should use HLS player for Cloudflare Stream HLS URLs', () => {
      const url = 'https://cloudflarestream.com/abc123/manifest/video.m3u8';
      expect(getVideoPlayerType(url)).toBe('hls');
    });

    it('should use HLS player for Cloudflare Stream subdomain URLs', () => {
      const url = 'https://customer-abc.cloudflarestream.com/xyz/video.m3u8';
      expect(getVideoPlayerType(url)).toBe('hls');
    });

    it('should use HLS player for Cloudflare Stream MP4 (when no manifest)', () => {
      const url = 'https://cloudflarestream.com/abc123/downloads/video.mp4';
      expect(getVideoPlayerType(url)).toBe('hls'); // Cloudflare always uses HLS player
    });

    it('should require proxy for Cloudflare Stream', () => {
      expect(needsMediaProxy('https://cloudflarestream.com/abc/video.m3u8')).toBe(true);
      expect(needsMediaProxy('https://customer-abc.cloudflarestream.com/xyz/video.m3u8')).toBe(true);
    });
  });

  describe('Mux', () => {
    it('should use Mux player when playback ID exists', () => {
      const url = 'https://stream.mux.com/abc123/playlist.m3u8';
      expect(getVideoPlayerType(url, true)).toBe('mux');
    });

    it('should use HLS player for Mux HLS without playback ID', () => {
      const url = 'https://stream.mux.com/abc123/playlist.m3u8';
      expect(getVideoPlayerType(url, false)).toBe('hls');
    });

    it('should NOT require proxy for Mux', () => {
      expect(needsMediaProxy('https://stream.mux.com/abc/playlist.m3u8')).toBe(false);
      expect(needsMediaProxy('https://image.mux.com/abc/thumbnail.jpg')).toBe(false);
    });
  });

  describe('Pexels', () => {
    it('should use native player for Pexels MP4 videos', () => {
      const url = 'https://videos.pexels.com/video-files/123/456.mp4';
      expect(getVideoPlayerType(url)).toBe('native');
    });

    it('should require proxy for Pexels videos', () => {
      expect(needsMediaProxy('https://videos.pexels.com/video-files/123/456.mp4')).toBe(true);
    });

    it('should require proxy for Pexels images', () => {
      expect(needsMediaProxy('https://images.pexels.com/photos/123/photo.jpg')).toBe(true);
    });
  });

  describe('Direct MP4', () => {
    it('should use native player for direct MP4 URLs', () => {
      const url = 'https://example.com/video.mp4';
      expect(getVideoPlayerType(url)).toBe('native');
    });

    it('should NOT require proxy for unknown domains', () => {
      expect(needsMediaProxy('https://example.com/video.mp4')).toBe(false);
    });
  });

  describe('HLS Streams', () => {
    it('should use HLS player for .m3u8 URLs', () => {
      expect(getVideoPlayerType('https://example.com/playlist.m3u8')).toBe('hls');
    });

    it('should use HLS player for master playlist', () => {
      expect(getVideoPlayerType('https://cdn.example.com/master.m3u8')).toBe('hls');
    });
  });
});

describe('Media Proxy Configuration', () => {
  it('should allow Cloudflare Stream through proxy', () => {
    expect(needsMediaProxy('https://cloudflarestream.com/abc/video.m3u8')).toBe(true);
  });

  it('should allow Cloudflare Stream subdomains', () => {
    expect(needsMediaProxy('https://sub.cloudflarestream.com/abc/video.m3u8')).toBe(true);
  });

  it('should block Mux from proxy (direct access)', () => {
    expect(needsMediaProxy('https://stream.mux.com/abc/playlist.m3u8')).toBe(false);
  });

  it('should block unknown domains from proxy', () => {
    expect(needsMediaProxy('https://unknown-site.com/video.mp4')).toBe(false);
  });
});
