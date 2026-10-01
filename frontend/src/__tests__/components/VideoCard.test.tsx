import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { VideoCard } from "@/components/features/VideoCard";
import { normalizePostForFeed } from "@/services/api";

vi.mock("@/components/features/VideoPlayer", () => ({
  VideoPlayer: ({ src }: { src: string }) => (
    <video data-testid="native-player" src={src} />
  ),
}));

vi.mock("@/components/video/MuxVideoPlayer", () => ({
  MuxVideoPlayer: ({ playbackId }: { playbackId: string }) => (
    <div data-testid="mux-player" data-playback-id={playbackId} />
  ),
}));

describe("VideoCard playback", () => {
  it("uses the Mux player for a normalized new upload", () => {
    const playbackId = "new-upload-playback-id";
    const post = normalizePostForFeed({
      id: "new-upload",
      type: "video",
      mux_playback_id: playbackId,
      media_url: `https://stream.mux.com/${playbackId}.m3u8`,
      thumbnail_url: `https://image.mux.com/${playbackId}/thumbnail.jpg`,
    });

    render(<VideoCard post={post!} autoPlay />);

    expect(screen.getByTestId("mux-player")).toHaveAttribute(
      "data-playback-id",
      playbackId,
    );
    expect(screen.queryByTestId("native-player")).toBeNull();
  });

  it("passes a normalized direct upload URL to the native player", () => {
    const mediaUrl = "https://storage.example.com/new-upload.mp4";
    const post = normalizePostForFeed({
      id: "direct-upload",
      type: "video",
      media_url: mediaUrl,
      thumbnail_url: "https://storage.example.com/new-upload.jpg",
    });

    render(<VideoCard post={post!} autoPlay />);

    expect(screen.getByTestId("native-player")).toHaveAttribute(
      "src",
      mediaUrl,
    );
    expect(screen.queryByTestId("mux-player")).toBeNull();
  });
});
