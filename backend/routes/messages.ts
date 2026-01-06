import { Router, Request, Response } from "express";
import { storage } from "../storage.js";
import { insertMessageSchema } from "../../shared/schema.js";
import { z } from "zod";

const router = Router();

// GET /api/messages/:threadId - Get messages for a thread
router.get("/:threadId", async (req: Request, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // TODO: Verify user owns the thread

    const messages = await storage.getThreadMessages(req.params.threadId);
    res.json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

// POST /api/messages - Create a message
router.post("/", async (req: Request, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const messageData = insertMessageSchema.parse(req.body);

    // Save user message
    const message = await storage.createMessage(messageData);

    // Update thread updatedAt
    await storage.updateThread(message.threadId, { updatedAt: new Date() });

    // Ti-Guy Auto-Reply
    if (messageData.sender === "user") {
      // Simulate processing delay
      setTimeout(async () => {
        try {
          const tiGuyReply = "Ben oui, c'est tiguidou! 🦫 (Auto-reply)";

          await storage.createMessage({
            threadId: message.threadId,
            sender: "ti-guy",
            content: tiGuyReply,
          });

          await storage.updateThread(message.threadId, {
            updatedAt: new Date(),
          });
        } catch (err) {
          console.error("Ti-Guy reply error:", err);
        }
      }, 1000);
    }

    res.status(201).json(message);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ error: "Validation error", details: error.errors });
    }
    console.error("Error creating message:", error);
    res.status(500).json({ error: "Failed to create message" });
  }
});

export default router;
