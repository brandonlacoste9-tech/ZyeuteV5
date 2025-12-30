/**
 * Memory Miner Bee
 *
 * "The Gold Panner"
 *
 * Responsibilities:
 * 1. Scans raw 'agent_memories' that haven't been mined yet.
 * 2. Uses DeepSeek to extract structured 'Facts' (preferences, biography, relationships).
 * 3. Stores these facts in 'agent_facts' for high-precision recall.
 *
 * This turns the "Forgetful Elephant" (raw memory dump) into a "Wise Owl" (structured knowledge).
 */

import { db } from "../../storage.js";
import { agentMemories, agentFacts } from "../../../shared/schema.js";
import { deepseek } from "../deepseek.js";
import { eq, sql, and, notExists } from "drizzle-orm";

interface FactExtraction {
  category: "preference" | "bio" | "history" | "relationship";
  content: string;
  confidence: number;
}

export class MemoryMinerBee {
  async run(task: any) {
    const batchSize = 10;
    const userId = task.payload?.userId; // Optional: Mine specific user

    console.log(
      `[Memory Miner] Starting batch mining... User: ${userId || "All"}`,
    );

    // 1. Find raw memories that don't have associated facts yet
    // SELECT * FROM agent_memories m WHERE NOT EXISTS (SELECT 1 FROM agent_facts f WHERE f.source_memory_id = m.id)
    let query = db
      .select()
      .from(agentMemories)
      .where(
        notExists(
          db
            .select()
            .from(agentFacts)
            .where(eq(agentFacts.sourceMemoryId, agentMemories.id)),
        ),
      )
      .limit(batchSize);

    // Add user filter if provided
    if (userId) {
      query = db
        .select()
        .from(agentMemories)
        .where(
          and(
            eq(agentMemories.userId, userId),
            notExists(
              db
                .select()
                .from(agentFacts)
                .where(eq(agentFacts.sourceMemoryId, agentMemories.id)),
            ),
          ),
        )
        .limit(batchSize);
    }

    const rawMemories = await query;

    if (rawMemories.length === 0) {
      return {
        status: "idle",
        message: "No unmined memories found.",
      };
    }

    console.log(
      `[Memory Miner] Found ${rawMemories.length} raw memories to process.`,
    );
    const results = [];

    for (const memory of rawMemories) {
      try {
        // 2. Extract facts using DeepSeek
        const completion = await deepseek.chat.completions.create({
          model: "deepseek-chat",
          messages: [
            {
              role: "system",
              content: `You are an expert Data Analyst for Zyeuté.
                          Your goal is to extract permanent, high-value "Facts" from a raw user-AI interaction memory.
                          
                          Categories: 
                          - 'preference' (e.g., likes hockey, vegan, night owl)
                          - 'bio' (e.g., lives in Montreal, age 25, works in IT)
                          - 'history' (e.g., asked about poutine places previously)
                          - 'relationship' (e.g., mentions brother Pierre)
  
                          Return a JSON object with a 'facts' array. Each fact has: { category, content, confidence (0.0-1.0) }.
                          If no significant facts are found, return empty array.`,
            },
            {
              role: "user",
              content: `Raw Memory: "${memory.content}"`,
            },
          ],
          response_format: { type: "json_object" },
        });

        const content = completion.choices[0].message.content;
        if (!content) continue;

        const data = JSON.parse(content) as { facts: FactExtraction[] };

        // 3. Store facts
        if (data.facts && data.facts.length > 0) {
          for (const fact of data.facts) {
            await db.insert(agentFacts).values({
              userId: memory.userId,
              category: fact.category,
              content: fact.content,
              confidence: fact.confidence.toString(), // Drizzle decimal expects string
              sourceMemoryId: memory.id,
              metadata: {
                minedAt: new Date().toISOString(),
                original_memory: memory.content.substring(0, 50) + "...",
              },
            });
          }
          console.log(
            `[Memory Miner] Extracted ${data.facts.length} facts from memory ${memory.id}`,
          );
          results.push({ memoryId: memory.id, facts: data.facts.length });
        } else {
          // If no facts, insert a 'meta' fact to prevent re-mining
          await db.insert(agentFacts).values({
            userId: memory.userId,
            category: "meta",
            content: "No significant facts found",
            confidence: "1.0",
            sourceMemoryId: memory.id,
          });
        }
      } catch (error: any) {
        console.error(
          `[Memory Miner] Error processing memory ${memory.id}:`,
          error,
        );
      }
    }

    return {
      status: "completed",
      processed: rawMemories.length,
      results,
    };
  }
}
