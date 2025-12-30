import { db } from "../db.js";
import { agentMemories, agentFacts } from "../../../../../shared/schema.js";
import { getEmbeddings } from "../../../../../backend/ai/google.js";
import { eq, and, sql, desc } from "drizzle-orm";

/**
 * MemoryService - "The Elephant" (Semantic Long-term Memory)
 */
export class MemoryService {
  /**
   * Stores a new memory for a user
   */
  public async store(userId: string, content: string, importance: number = 1) {
    try {
      const embedding = await getEmbeddings(content);

      await db.insert(agentMemories).values({
        userId,
        content,
        importance,
        embedding,
        createdAt: new Date(),
      });

      console.log(
        `🧠 [Memory] New insight stored for user ${userId}: ${content.substring(0, 50)}...`,
      );
    } catch (err) {
      console.error(`🚨 [MemoryError] Failed to store memory:`, err);
    }
  }

  /**
   * Recalls relevant memories for a user given a query
   */
  public async recall(
    userId: string,
    query: string,
    limit: number = 5,
  ): Promise<string[]> {
    try {
      const queryEmbedding = await getEmbeddings(query);

      const limitFacts = 3;

      const [vectorResults, factResults] = await Promise.all([
        // 1. Semantic Search
        db
          .select({ content: agentMemories.content })
          .from(agentMemories)
          .where(eq(agentMemories.userId, userId))
          .orderBy(
            sql`${agentMemories.embedding} <=> ${JSON.stringify(queryEmbedding)}::vector`,
          )
          .limit(limit),

        // 2. Fact Retrieval (Latest high-value facts)
        db
          .select({
            content: agentFacts.content,
            category: agentFacts.category,
          })
          .from(agentFacts)
          .where(
            and(
              eq(agentFacts.userId, userId),
              sql`${agentFacts.confidence} > 0.7`,
            ),
          )
          .orderBy(desc(agentFacts.createdAt))
          .limit(limitFacts),
      ]);

      const memories = vectorResults.map((r) => r.content);
      const facts = factResults.map(
        (r) => `[FAIT: ${r.category}] ${r.content}`,
      );

      return [...facts, ...memories];
    } catch (err) {
      console.error(`🚨 [MemoryError] Failed to recall memory:`, err);
      return [];
    }
  }
}
