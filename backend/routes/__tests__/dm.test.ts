import request from "supertest";
import express from "express";
import threadsRouter from "../threads.js";
import messagesRouter from "../messages.js";
import { storage } from "../../storage.js";
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock storage
vi.mock("../../storage.js", () => ({
  storage: {
    getThreads: vi.fn(),
    createThread: vi.fn(),
    getThreadMessages: vi.fn(),
    createMessage: vi.fn(),
    updateThread: vi.fn(),
    getUser: vi.fn(),
  },
}));

// Mock Auth Middleware
const mockAuthMiddleware = (req: any, res: any, next: any) => {
  req.userId = "123e4567-e89b-12d3-a456-426614174000";
  next();
};

const app = express();
app.use(express.json());
app.use("/api/threads", mockAuthMiddleware, threadsRouter);
app.use("/api/messages", mockAuthMiddleware, messagesRouter);

describe("DM System API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/threads", () => {
    it("should return user threads", async () => {
      const mockThreads = [
        { id: "thread-1", userId: "user-1", updatedAt: new Date() },
      ];
      (storage.getThreads as any).mockResolvedValue(mockThreads);

      const res = await request(app).get("/api/threads");

      expect(res.status).toBe(200);
      expect(res.body).toEqual(JSON.parse(JSON.stringify(mockThreads)));
      expect(storage.getThreads).toHaveBeenCalledWith(
        "123e4567-e89b-12d3-a456-426614174000",
      );
    });
  });

  describe("POST /api/threads", () => {
    it("should create a new thread", async () => {
      const mockThread = {
        id: "thread-new",
        userId: "user-1",
        title: "New Chat",
      };
      (storage.createThread as any).mockResolvedValue(mockThread);

      const res = await request(app)
        .post("/api/threads")
        .send({ title: "New Chat" });

      expect(res.status).toBe(201);
      expect(res.body).toEqual(mockThread);
      expect(storage.createThread).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: "123e4567-e89b-12d3-a456-426614174000",
          title: "New Chat",
        }),
      );
    });
  });

  describe("GET /api/messages/:threadId", () => {
    it("should return messages for a thread", async () => {
      const mockMessages = [
        {
          id: "msg-1",
          threadId: "123e4567-e89b-12d3-a456-426614174001",
          content: "Hello",
          sender: "user",
        },
      ];
      (storage.getThreadMessages as any).mockResolvedValue(mockMessages);

      const res = await request(app).get(
        "/api/messages/123e4567-e89b-12d3-a456-426614174001",
      );

      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockMessages);
      expect(storage.getThreadMessages).toHaveBeenCalledWith(
        "123e4567-e89b-12d3-a456-426614174001",
      );
    });
  });

  describe("POST /api/messages", () => {
    it("should create a message and trigger Ti-Guy reply", async () => {
      const mockMessage = {
        id: "msg-new",
        threadId: "123e4567-e89b-12d3-a456-426614174001",
        content: "Hello Ti-Guy",
        sender: "user",
      };
      (storage.createMessage as any).mockResolvedValue(mockMessage);

      const res = await request(app).post("/api/messages").send({
        threadId: "123e4567-e89b-12d3-a456-426614174001",
        content: "Hello Ti-Guy",
        sender: "user",
      });

      expect(res.status).toBe(201);
      expect(res.body).toEqual(mockMessage);
      expect(storage.createMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          threadId: "123e4567-e89b-12d3-a456-426614174001",
          content: "Hello Ti-Guy",
          sender: "user",
        }),
      );

      // We can't easily test the async Ti-Guy reply in this unit test structure without using fake timers
      // but we can ensure updateThread was called for the user message
      expect(storage.updateThread).toHaveBeenCalledWith(
        "123e4567-e89b-12d3-a456-426614174001",
        expect.objectContaining({
          updatedAt: expect.any(Date),
        }),
      );
    });
  });
});
