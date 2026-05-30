/**
 * Alert Service for TI-GUY Cost Monitoring
 * Sends Slack and email notifications when spending thresholds are hit
 */

import { sendEmail } from "../resend-client.js";

// Slack configuration (Replicating structure for compatibility)
const SLACK_TOKEN = process.env.SLACK_BOT_TOKEN;
const SLACK_CHANNEL = process.env.SLACK_ALERT_CHANNEL || "#alerts";

export class AlertService {
  private static instance: AlertService;

  private constructor() {}

  static getInstance(): AlertService {
    if (!AlertService.instance) {
      AlertService.instance = new AlertService();
    }
    return AlertService.instance;
  }

  /**
   * Send an alert when a cost threshold is hit
   */
  async sendThresholdAlert(data: {
    totalCost: number;
    limit: number;
    threshold: number;
  }) {
    const { totalCost, limit, threshold } = data;
    console.log(
      `🚨 [Alert] Budget threshold hit: ${threshold * 100}% ($${totalCost.toFixed(4)})`,
    );

    // 1. Send Slack notification - [DISABLED: Missing dependency]
    /*
    if (SLACK_TOKEN) {
      // Logic for slack would go here if @slack/web-api was installed
    }
    */

    // 2. Send email notification via Resend
    const emailHtml = `
      <div style="font-family: sans-serif; padding: 20px; border: 2px solid #D4AF37; border-radius: 10px;">
        <h2 style="color: #D4AF37;">⚜️ Zyeuté Budget Alert: ${threshold * 100}%</h2>
        <p>Your TI-GUY AI spending has hit a critical threshold.</p>
        <div style="background: #f4f4f4; padding: 15px; border-radius: 5px;">
          <p><strong>Total Spent:</strong> $${totalCost.toFixed(4)}</p>
          <p><strong>Daily Limit:</strong> $${limit.toFixed(2)}</p>
          <p><strong>Threshold:</strong> ${threshold * 100}%</p>
        </div>
        <p>System status: <em>Vigilance accrue activée.</em></p>
      </div>
    `;

    try {
      await sendEmail({
        to: process.env.ADMIN_EMAIL || "admin@zyeute.com",
        subject: `🚨 [Zyeute] Budget Alert: ${threshold * 100}% Threshold Hit`,
        html: emailHtml,
      });
    } catch (err) {
      console.error("[Alert] Email failed:", err);
    }
  }

  /**
   * Send a daily summary report
   */
  async sendDailySummary(data: {
    totalCost: number;
    dialogflowCost: number;
    genAICost: number;
    queriesToday: number;
    cap: number;
  }) {
    const title = "📊 Zyeuté AI - Daily Cost Summary";
    const percentUsed = (data.totalCost / data.cap) * 100;

    const emailHtml = `
      <div style="font-family: sans-serif; padding: 20px;">
        <h2 style="color: ${percentUsed > 80 ? "#FF0000" : "#D4AF37"};">${title}</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Dialogflow</strong></td>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">$${data.dialogflowCost.toFixed(2)}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>GenAI (LLMs)</strong></td>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">$${data.genAICost.toFixed(2)}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Total Spent</strong></td>
            <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>$${data.totalCost.toFixed(2)}</strong></td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Queries</strong></td>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">${data.queriesToday}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Monthly Cap</strong></td>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">$${data.cap}</td>
          </tr>
        </table>
        <p style="margin-top: 20px; font-size: 12px; color: #666;">Zyeuté Cost Monitor Hub • Montréal</p>
      </div>
    `;

    try {
      await sendEmail({
        to: process.env.ADMIN_EMAIL || "admin@zyeute.com",
        subject: `📊 [Zyeute] Daily AI Cost Summary: $${data.totalCost.toFixed(2)}`,
        html: emailHtml,
      });
    } catch (err) {
      console.error("[Alert] Daily summary failed:", err);
    }
  }
}

export const alertService = AlertService.getInstance();

/**
 * Backward compatible wrapper for cost monitoring
 */
export async function sendCostAlert(
  totalCost: number,
  limit: number,
  threshold: number,
) {
  return alertService.sendThresholdAlert({ totalCost, limit, threshold });
}
