import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import express from "express";
import mediaRouter from "../media";
import { storage } from "../../storage";

// Mock storage
vi.mock("../../storage", () => ({
  storage: {
    createMedia: vi.fn(),
    getMediaFeed: vi.fn(),
    getMedia: vi.fn(),
  },
}));

// Setup Express app for testing
const app = express();
app.use(express.json());
app.use("/api/media", mediaRouter);

describe("Media Routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST /api/media", () => {
    it("should create media successfully", async () => {
      const mockMedia = {
        id: "123e4567-e89b-12d3-a456-426614174000",
        userId: "123e4567-e89b-12d3-a456-426614174000",
        type: "IMAGE",
        thumbnailUrl: "http://thumb.jpg",
        caption: "Test",
        createdAt: new Date().toISOString(),
      };

      (storage.createMedia as any).mockResolvedValue(mockMedia);

      const res = await request(app).post("/api/media").send({
        userId: "123e4567-e89b-12d3-a456-426614174000",
        type: "IMAGE",
        thumbnailUrl: "http://thumb.jpg",
        caption: "Test",
      });

      expect(res.status).toBe(201);
      expect(res.body).toEqual(mockMedia);
      expect(storage.createMedia).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: "123e4567-e89b-12d3-a456-426614174000",
          type: "IMAGE",
        }),
      );
    });

    it("should return 400 on validation error", async () => {
      const res = await request(app).post("/api/media").send({
        // Missing required fields
        caption: "Test",
      });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("error", "Validation error");
    });
  });

  describe("GET /api/media", () => {
    it("should return paginated feed", async () => {
      const mockFeed = {
        items: [{ id: "1" }, { id: "2" }],
        nextCursor: "2023-01-01",
      };

      (storage.getMediaFeed as any).mockResolvedValue(mockFeed);

      const res = await request(app).get("/api/media?limit=10");

      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockFeed);
      expect(storage.getMediaFeed).toHaveBeenCalledWith(undefined, 10);
    });
  });

  describe("GET /api/media/:id", () => {
    it("should return media item", async () => {
      const mockItem = { id: "123", type: "VIDEO" };
      (storage.getMedia as any).mockResolvedValue(mockItem);

      const res = await request(app).get("/api/media/123");

      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockItem);
    });

    it("should return 404 if not found", async () => {
      (storage.getMedia as any).mockResolvedValue(undefined);

      const res = await request(app).get("/api/media/999");

      expect(res.status).toBe(404);
    });
  });
});
