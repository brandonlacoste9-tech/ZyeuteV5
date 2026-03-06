import { Router, Request, Response, NextFunction } from "express";
import { storage } from "../storage.js";

const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.userId) return res.status(401).json({ error: "Unauthorized" });
  next();
};

const router = Router();

// Support Ticket Management
router.post("/tickets", requireAuth, async (req, res) => {
  try {
    const { subject, description, category, priority = "normal" } = req.body;

    if (!subject || !description) {
      return res
        .status(400)
        .json({ error: "Subject and description are required" });
    }

    const ticket = await storage.createSupportTicket({
      user_id: req.userId,
      subject,
      description,
      category,
      priority,
      status: "open",
    });

    // Add initial message from user
    await storage.addTicketMessage({
      ticket_id: ticket.id,
      sender_type: "user",
      sender_id: req.userId,
      message: description,
    });

    res.status(201).json({
      ticket,
      message: "Votre demande de support a été créée. Ti-Guy va vous aider! 🦫",
    });
  } catch (error: any) {
    console.error("Create support ticket error:", error);
    res.status(500).json({ error: "Failed to create support ticket" });
  }
});

router.get("/tickets", requireAuth, async (req, res) => {
  try {
    const tickets = await storage.getUserSupportTickets(req.userId!);
    res.json({ tickets });
  } catch (error: any) {
    console.error("Get support tickets error:", error);
    res.status(500).json({ error: "Failed to get support tickets" });
  }
});

router.get("/tickets/:ticketId", requireAuth, async (req, res) => {
  try {
    const ticket = await storage.getSupportTicket(
      req.params.ticketId as string,
    );
    if (!ticket) return res.status(404).json({ error: "Ticket not found" });

    // Check if user owns this ticket
    if (ticket.user_id !== req.userId) {
      return res.status(403).json({ error: "Access denied" });
    }

    res.json({ ticket });
  } catch (error: any) {
    console.error("Get support ticket error:", error);
    res.status(500).json({ error: "Failed to get support ticket" });
  }
});

router.post(
  "/tickets/:ticketId/messages",
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const { message } = req.body;
      const ticketId = req.params.ticketId;

      if (!message)
        return res.status(400).json({ error: "Message is required" });

      // Verify ticket ownership
      const ticket = await storage.getSupportTicket(ticketId as string);
      if (!ticket || ticket.user_id !== req.userId) {
        return res.status(403).json({ error: "Access denied" });
      }

      const ticketMessage = await storage.addTicketMessage({
        ticket_id: ticketId,
        sender_type: "user",
        sender_id: req.userId,
        message,
      });

      res.status(201).json({ message: ticketMessage });
    } catch (error: any) {
      console.error("Add ticket message error:", error);
      res.status(500).json({ error: "Failed to add message" });
    }
  },
);

export default router;
