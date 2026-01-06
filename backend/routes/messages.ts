import { Router } from "express";
import { z } from "zod";
import { storage } from "../storage.js";

const router = Router();

// Helper for simple Ti-Guy replies
function generateTiGuyReply(userContent: string): string {
  const responses = [
    "C'est malade! 🔥",
    "Ben voyons donc! 😮",
    "Je t'entends, mon ami. 🦫",
    "Enweye donc!",
    "Ça, c'est du solide! 💪",
    "T'as ben raison!",
    "On lâche pas! 🚀"
  ];
  return responses[Math.floor(Math.random() * responses.length)];
}

// GET /api/messages/:threadId - List messages in a thread
router.get("/:threadId", async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const { threadId } = req.params;
    
    // Optional: Add verification that thread belongs to user
    // const thread = await storage.getThread(threadId);
    // if (!thread || thread.userId !== userId) return res.status(403)...

    const messages = await storage.getMessages(threadId);
    res.json({ messages });
  } catch (error) {
    console.error("Get messages error:", error);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

// POST /api/messages - Send a message
router.post("/", async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const schema = z.object({
      threadId: z.string(),
      content: z.string().min(1),
      sender: z.string().default("user"), // 'user' or 'ti-guy'
    });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.errors[0].message });
    }

    // 1. Save User Message
    const message = await storage.createMessage({
      threadId: parsed.data.threadId,
      sender: parsed.data.sender,
      content: parsed.data.content,
    });

    // 2. Ti-Guy Auto-Reply Hook
    // Only reply if sender is 'user'
    if (parsed.data.sender === "user") {
      // Fire-and-forget the reply logic
      setTimeout(async () => {
        try {
          const replyContent = generateTiGuyReply(parsed.data.content);
          
          await storage.createMessage({
            threadId: parsed.data.threadId,
            sender: "ti-guy",
            content: replyContent
          });
          
          console.log(`[Ti-Guy] Auto-replied to thread ${parsed.data.threadId}`);
        } catch (err) {
          console.error("[Ti-Guy] Auto-reply failed:", err);
        }
      }, 1000); // 1 second "thinking" delay
    }

    res.status(201).json({ message });
  } catch (error) {
    console.error("Create message error:", error);
    res.status(500).json({ error: "Failed to create message" });
  }
});

export default router;
