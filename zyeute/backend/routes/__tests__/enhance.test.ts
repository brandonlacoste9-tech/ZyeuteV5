import { describe, it, expect, vi, beforeEach } from "vitest";
import { enhancePostHandler } from "../enhance";
import { db } from "../../storage"; // For type checking if needed, but we mock it

// Mock DB
vi.mock("../../storage", () => ({
  db: {
    update: vi.fn(),
    insert: vi.fn(),
  },
}));

// Mock schema
vi.mock("../../../shared/schema", () => ({
  posts: {
    id: "posts",
    processingStatus: "processingStatus",
    enhanceStartedAt: "enhanceStartedAt",
    visualFilter: "visualFilter",
  },
  colonyTasks: {
    id: "colonyTasks",
    command: "command",
    origin: "origin",
    status: "status",
    priority: "priority",
    metadata: "metadata",
  },
}));

// Mock Drizzle ORM
vi.mock("drizzle-orm", () => ({
  eq: vi.fn(),
}));

describe("enhancePostHandler", () => {
  let req: any;
  let res: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock Request and Response
    req = {
      params: { id: "123" },
      body: { filter: "sepia(1)" },
    };

    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };

    // Default chain for valid post update
    const mockUpdateChain = {
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([
            {
              id: "123",
              mediaUrl: "http://video.mp4",
              visualFilter: "sepia(1)",
            },
          ]),
        }),
      }),
    };
    (db.update as any).mockReturnValue(mockUpdateChain);

    // Default chain for insert task
    const mockInsertChain = {
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([
          {
            id: "task-1",
          },
        ]),
      }),
    };
    (db.insert as any).mockReturnValue(mockInsertChain);
  });

  it("should successfully queue enhancement job", async () => {
    await enhancePostHandler(req, res);

    expect(db.update).toHaveBeenCalled();
    expect(db.insert).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "success",
        data: expect.objectContaining({
          taskId: "task-1",
        }),
      }),
    );
  });

  it("should return 404 if post not found", async () => {
    // Mock update returning empty array (not found)
    const mockNotFoundChain = {
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([]),
        }),
      }),
    };
    (db.update as any).mockReturnValue(mockNotFoundChain);

    await enhancePostHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: "Post not found" });
  });

  it("should return 400 if post has no video url", async () => {
    // Mock update returning post without url
    const mockNoUrlChain = {
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([
            {
              id: "123",
              mediaUrl: null,
              originalUrl: null,
            },
          ]),
        }),
      }),
    };
    (db.update as any).mockReturnValue(mockNoUrlChain);

    await enhancePostHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "Post has no video URL" });
  });

  it("should handle db errors gracefully", async () => {
    (db.update as any).mockImplementation(() => {
      throw new Error("DB Error");
    });

    await enhancePostHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: "Failed to queue enhancement",
    });
  });
});
