import { db } from "../db.js";
// import { agentMemories, agentFacts } from "../../../../../shared/schema.js"; // TODO: Add schema
// import { getEmbeddings } from "../../../../../backend/ai/google.js"; // TODO: Add embeddings
const agentMemories: any = {};
const agentFacts: any = {}; // Stubs for build
const getEmbeddings = async (_text: any) => ({}); // Stub for build
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

      await (db.insert(agentMemories as any) as any).values({
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
        (db as any)
          .select({ content: agentMemories.content })
          .from(agentMemories)
          .where(eq(agentMemories.userId as any, userId))
          .orderBy(
            sql`${agentMemories.embedding} <=> ${JSON.stringify(queryEmbedding)}::vector`,
          )
          .limit(limit),

        // 2. Fact Retrieval (Latest high-value facts)
        (db as any)
          .select({
            content: agentFacts.content,
            category: agentFacts.category,
          })
          .from(agentFacts)
          .where(
            and(
              eq(agentFacts.userId as any, userId),
              sql`${agentFacts.confidence} > 0.7`,
            ),
          )
          .orderBy(desc(agentFacts.createdAt as any))
          .limit(limitFacts),
      ]);

      const memories = vectorResults.map((r: any) => r.content);
      const facts = factResults.map(
        (r: any) => `[FAIT: ${r.category}] ${r.content}`,
      );

      return [...facts, ...memories] as string[];
    } catch (err) {
      console.error(`🚨 [MemoryError] Failed to recall memory:`, err);
      return [];
    }
  }
}
