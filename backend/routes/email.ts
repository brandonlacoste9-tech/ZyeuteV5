import { Router, Request, Response, NextFunction } from "express";
import { storage } from "../storage.js";
import emailAutomation from "../email-automation.js";

const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.userId) return res.status(401).json({ error: "Unauthorized" });
  next();
};

async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const user = await storage.getUser(req.userId);
  if (!user || !(user as any).isAdmin) {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
}

const router = Router();

// Get pending emails (admin only)
router.get("/pending", requireAdmin, async (req, res) => {
  try {
    const pendingEmails = emailAutomation.getPendingEmails();
    res.json({
      count: pendingEmails.length,
      emails: pendingEmails.map((e) => ({
        id: e.id,
        type: e.emailType,
        scheduledFor: e.scheduledFor,
        status: e.status,
      })),
    });
  } catch (error: any) {
    console.error("Email pending error:", error);
    res.status(500).json({ error: "Failed to get pending emails" });
  }
});

// Process email queue (admin only)
router.post("/process-queue", requireAdmin, async (req, res) => {
  try {
    const sentCount = await emailAutomation.processEmailQueue();
    res.json({
      success: true,
      processed: sentCount,
      message: `Processed ${sentCount} emails`,
    });
  } catch (error: any) {
    console.error("Email queue processing error:", error);
    res.status(500).json({ error: "Failed to process email queue" });
  }
});

// Send test welcome email
router.post("/send-welcome", requireAuth, async (req, res) => {
  try {
    const userId = req.userId!;
    const result = await emailAutomation.sendEmailNow(userId, "welcome");

    if (result.success) {
      res.json({ success: true, message: "Welcome email sent!" });
    } else {
      res.status(500).json({ error: result.error || "Failed to send email" });
    }
  } catch (error: any) {
    console.error("Send welcome email error:", error);
    res.status(500).json({ error: "Failed to send welcome email" });
  }
});

// Resend webhook handler
router.post("/webhook", async (req, res) => {
  try {
    const event = req.body;
    console.log(`[Resend Webhook] Event received:`, event.type);

    switch (event.type) {
      case "email.sent":
        console.log(`[Resend] Email sent: ${event.data?.email_id}`);
        break;
      case "email.delivered":
        console.log(`[Resend] Email delivered: ${event.data?.email_id}`);
        break;
      case "email.opened":
        console.log(`[Resend] Email opened: ${event.data?.email_id}`);
        break;
      case "email.clicked":
        console.log(`[Resend] Email link clicked: ${event.data?.email_id}`);
        break;
      case "email.bounced":
        console.error(`[Resend] Email bounced: ${event.data?.email_id}`);
        break;
      case "email.complained":
        console.error(`[Resend] Email spam complaint: ${event.data?.email_id}`);
        break;
      default:
        console.log(`[Resend] Unknown event: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error: any) {
    console.error("Webhook error:", error);
    res.status(500).json({ error: "Webhook processing failed" });
  }
});

// Preview email content
router.post("/preview", requireAuth, async (req, res) => {
  try {
    const { emailType, username } = req.body;
    if (!emailType || !username) {
      return res.status(400).json({ error: "emailType and username required" });
    }
    const content = await emailAutomation.generatePersonalizedContent(
      emailType,
      username,
      req.body.context,
    );
    res.json(content);
  } catch (error: any) {
    console.error("Email preview error:", error);
    res.status(500).json({ error: "Failed to generate email preview" });
  }
});

// Manually trigger onboarding sequence
router.post("/trigger-onboarding", requireAuth, async (req, res) => {
  try {
    const userId = req.userId!;
    emailAutomation.scheduleOnboardingSequence(userId);
    res.json({ success: true, message: "Onboarding sequence scheduled" });
  } catch (error: any) {
    console.error("Email trigger error:", error);
    res.status(500).json({ error: "Failed to trigger onboarding" });
  }
});

// Cancel pending emails
router.delete("/cancel", requireAuth, async (req, res) => {
  try {
    const userId = req.userId!;
    const { emailType } = req.body;
    const cancelled = emailAutomation.cancelPendingEmails(userId, emailType);
    res.json({
      success: true,
      cancelled,
      message: `Cancelled ${cancelled} pending emails`,
    });
  } catch (error: any) {
    console.error("Email cancel error:", error);
    res.status(500).json({ error: "Failed to cancel emails" });
  }
});

export default router;
