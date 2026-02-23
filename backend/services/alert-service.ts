/**
 * Alert Service for TI-GUY Cost Monitoring
 * Sends Slack and email notifications when spending thresholds are hit
 */

import { WebClient } from "@slack/web-api";
import nodemailer from "nodemailer";

// Slack configuration
const SLACK_TOKEN = process.env.SLACK_BOT_TOKEN;
const SLACK_CHANNEL = process.env.SLACK_ALERT_CHANNEL || "#alerts";

// Email configuration
const EMAIL_CONFIG = {
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
};

const ALERT_EMAILS = (process.env.ALERT_EMAILS || "").split(",").filter(Boolean);

class AlertService {
  private slack: WebClient | null = null;
  private emailTransporter: nodemailer.Transporter | null = null;

  constructor() {
    // Initialize Slack if token available
    if (SLACK_TOKEN) {
      this.slack = new WebClient(SLACK_TOKEN);
    }

    // Initialize email if configured
    if (EMAIL_CONFIG.auth.user && EMAIL_CONFIG.auth.pass) {
      this.emailTransporter = nodemailer.createTransport(EMAIL_CONFIG);
    }
  }

  /**
   * Send cost threshold alert
   */
  async sendCostAlert(
    level: "ninety" | "warning" | "critical",
    data: {
      service: string;
      currentSpending: number;
      threshold: number;
      percentUsed: number;
      remaining: number;
      details?: Record<string, any>;
    }
  ): Promise<void> {
    const messages = {
      ninety: `⚡ ${data.service} at 90% of budget`,
      warning: `🚨 ${data.service} WARNING: Budget cap reached!`,
      critical: `🛑 ${data.service} CRITICAL: Hard cap reached! Service disabled.`,
    };

    const title = messages[level];
    const color = level === "critical" ? "#FF0000" : level === "warning" ? "#FFA500" : "#FFD700";

    // Send Slack alert
    await this.sendSlackAlert(title, color, data);

    // Send email alert
    await this.sendEmailAlert(title, level, data);

    // Log to console
    console.error(`[ALERT] ${title}: $${data.currentSpending.toFixed(2)} / $${data.threshold}`);
  }

  /**
   * Send Slack notification
   */
  private async sendSlackAlert(
    title: string,
    color: string,
    data: {
      service: string;
      currentSpending: number;
      threshold: number;
      percentUsed: number;
      remaining: number;
      details?: Record<string, any>;
    }
  ): Promise<void> {
    if (!this.slack) {
      console.log("[Alert] Slack not configured, skipping");
      return;
    }

    try {
      const fields = [
        { title: "Service", value: data.service, short: true },
        { title: "Current Spending", value: `$${data.currentSpending.toFixed(2)}`, short: true },
        { title: "Threshold", value: `$${data.threshold}`, short: true },
        { title: "Percent Used", value: `${data.percentUsed.toFixed(1)}%`, short: true },
        { title: "Remaining", value: `$${data.remaining.toFixed(2)}`, short: true },
      ];

      if (data.details) {
        fields.push({
          title: "Details",
          value: "\n" + Object.entries(data.details)
            .map(([k, v]) => `• ${k}: ${v}`)
            .join("\n"),
          short: false,
        });
      }

      await this.slack.chat.postMessage({
        channel: SLACK_CHANNEL,
        attachments: [
          {
            color,
            title,
            fields,
            footer: "Zyeuté Cost Monitor",
            ts: Math.floor(Date.now() / 1000),
          },
        ],
      });

      console.log("[Alert] Slack notification sent");
    } catch (err) {
      console.error("[Alert] Failed to send Slack notification:", err);
    }
  }

  /**
   * Send email notification
   */
  private async sendEmailAlert(
    title: string,
    level: string,
    data: {
      service: string;
      currentSpending: number;
      threshold: number;
      percentUsed: number;
      remaining: number;
      details?: Record<string, any>;
    }
  ): Promise<void> {
    if (!this.emailTransporter || ALERT_EMAILS.length === 0) {
      console.log("[Alert] Email not configured, skipping");
      return;
    }

    try {
      const emoji = level === "critical" ? "🛑" : level === "warning" ? "🚨" : "⚡";
      
      const html = `
        <h2>${emoji} ${title}</h2>
        <table border="1" cellpadding="10" style="border-collapse: collapse;">
          <tr><td><strong>Service</strong></td><td>${data.service}</td></tr>
          <tr><td><strong>Current Spending</strong></td><td>$${data.currentSpending.toFixed(2)}</td></tr>
          <tr><td><strong>Threshold</strong></td><td>$${data.threshold}</td></tr>
          <tr><td><strong>Percent Used</strong></td><td>${data.percentUsed.toFixed(1)}%</td></tr>
          <tr><td><strong>Remaining</strong></td><td>$${data.remaining.toFixed(2)}</td></tr>
        </table>
        ${data.details ? `
          <h3>Details:</h3>
          <ul>
            ${Object.entries(data.details).map(([k, v]) => `<li><strong>${k}:</strong> ${v}</li>`).join("")}
          </ul>
        ` : ""}
        <hr>
        <p><em>Zyeuté Cost Monitor - ${new Date().toLocaleString("fr-CA")}</em></p>
      `;

      await this.emailTransporter.sendMail({
        from: `"Zyeuté Alerts" <${EMAIL_CONFIG.auth.user}>`,
        to: ALERT_EMAILS.join(","),
        subject: `${emoji} ${title} - $${data.currentSpending.toFixed(2)} / $${data.threshold}`,
        html,
      });

      console.log("[Alert] Email notification sent to:", ALERT_EMAILS.join(", "));
    } catch (err) {
      console.error("[Alert] Failed to send email notification:", err);
    }
  }

  /**
   * Send daily summary
   */
  async sendDailySummary(data: {
    dialogflowCost: number;
    genAICost: number;
    totalCost: number;
    cap: number;
    queriesToday: number;
  }): Promise<void> {
    const title = "📊 Zyeuté AI - Daily Cost Summary";
    const percentUsed = (data.totalCost / data.cap) * 100;

    // Slack summary
    if (this.slack) {
      try {
        await this.slack.chat.postMessage({
          channel: SLACK_CHANNEL,
          attachments: [
            {
              color: percentUsed > 80 ? "#FF0000" : percentUsed > 50 ? "#FFA500" : "#00FF00",
              title,
              fields: [
                { title: "Dialogflow", value: `$${data.dialogflowCost.toFixed(2)}`, short: true },
                { title: "GenAI", value: `$${data.genAICost.toFixed(2)}`, short: true },
                { title: "Total Today", value: `$${data.totalCost.toFixed(2)}`, short: true },
                { title: "Queries", value: data.queriesToday.toString(), short: true },
                { title: "Monthly Cap", value: `$${data.cap}`, short: true },
                { title: "Remaining", value: `$${(data.cap - data.totalCost).toFixed(2)}`, short: true },
              ],
              footer: "Zyeuté Cost Monitor",
              ts: Math.floor(Date.now() / 1000),
            },
          ],
        });
      } catch (err) {
        console.error("[Alert] Failed to send Slack summary:", err);
      }
    }
  }
}

// Singleton
export const alertService = new AlertService();

/**
 * Helper to send cost alert from monitors
 */
export async function sendCostAlert(
  level: "ninety" | "warning" | "critical",
  service: string,
  currentSpending: number,
  threshold: number,
  details?: Record<string, any>
): Promise<void> {
  await alertService.sendCostAlert(level, {
    service,
    currentSpending,
    threshold,
    percentUsed: (currentSpending / threshold) * 100,
    remaining: threshold - currentSpending,
    details,
  });
}
