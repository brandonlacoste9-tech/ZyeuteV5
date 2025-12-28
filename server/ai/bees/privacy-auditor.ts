import { db } from "../../storage";
import { agentMemories } from "../../../shared/schema";
import { eq, isNull, or, desc, sql } from "drizzle-orm";
import { deepseek } from "../deepseek";

interface AuditResult {
  containsPII: boolean;
  piiTypes: string[];
  safeContent: string;
}

export class PrivacyAuditorBee {
  async run(task: { limit?: number; force?: boolean } = {}) {
    console.log(`[PrivacyAuditorBee] 🕵️ Starting audit cycle...`);

    // 1. Fetch pending memories
    // "Pending" means auditStatus is 'pending' OR null
    const limit = task.limit || 10;

    // Using raw SQL or complex filters might be needed if auditStatus is new and existing rows are null
    const pendingMemories = await db
      .select()
      .from(agentMemories)
      .where(
        or(
          eq(agentMemories.auditStatus, "pending"),
          isNull(agentMemories.auditStatus),
        ),
      )
      .orderBy(desc(agentMemories.createdAt))
      .limit(limit);

    if (pendingMemories.length === 0) {
      console.log(`[PrivacyAuditorBee] ✅ No pending memories to audit.`);
      return { audited: 0 };
    }

    console.log(
      `[PrivacyAuditorBee] 🔍 Auditing ${pendingMemories.length} memories...`,
    );

    for (const memory of pendingMemories) {
      await this.auditMemory(memory);
    }

    return { audited: pendingMemories.length };
  }

  private async auditMemory(memory: typeof agentMemories.$inferSelect) {
    try {
      // 2. Ask LLM to check for PII
      const prompt = `
You are a Privacy Officer Auditing AI memories against Quebec Law 25.
Analyze the following memory fragment for PII (Personally Identifiable Information).
PII includes: Real Names (if full context implies identity), Phone Numbers, Email Addresses, Home Addresses, Health Data, Financial Data.

Memory: "${memory.content}"

Return ONLY a JSON object:
{
  "containsPII": boolean,
  "piiTypes": string[],
  "safeContent": string // The content with PII replaced by [REDACTED] or the original content if safe.
}
`;

      const response = await deepseek.chat.completions.create({
        model: "deepseek-chat",
        messages: [{ role: "user", content: prompt.trim() }],
        temperature: 0,
        response_format: { type: "json_object" },
      });

      const resultContent = response.choices[0].message.content;
      if (!resultContent) throw new Error("Empty response from LLM");

      const audit: AuditResult = JSON.parse(resultContent);

      // 3. Update Record
      if (audit.containsPII) {
        console.warn(
          `[PrivacyAuditorBee] 🚩 PII Detected in Memory ${memory.id}: ${audit.piiTypes.join(", ")}`,
        );

        await db
          .update(agentMemories)
          .set({
            content: audit.safeContent, // Redact strictly
            auditStatus: "redacted",
            lastAuditedAt: new Date(),
            metadata: {
              ...(memory.metadata as any),
              pii_detected: audit.piiTypes,
              original_scanned: true,
            },
          })
          .where(eq(agentMemories.id, memory.id));
      } else {
        await db
          .update(agentMemories)
          .set({
            auditStatus: "safe",
            lastAuditedAt: new Date(),
          })
          .where(eq(agentMemories.id, memory.id));
      }
    } catch (error) {
      console.error(
        `[PrivacyAuditorBee] ❌ Error auditing memory ${memory.id}:`,
        error,
      );
      // Mark as error or retry later? For now, leave as pending or skip.
    }
  }
}
