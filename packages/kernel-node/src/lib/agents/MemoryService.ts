import { db } from '../db.js';
import { agentMemories } from '../../../../../shared/schema.js';
import { getEmbeddings } from '../../../../../server/ai/google.js';
import { eq, and, sql, desc } from 'drizzle-orm';

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
        createdAt: new Date()
      });
      
      console.log(`🧠 [Memory] New insight stored for user ${userId}: ${content.substring(0, 50)}...`);
    } catch (err) {
      console.error(`🚨 [MemoryError] Failed to store memory:`, err);
    }
  }

  /**
   * Recalls relevant memories for a user given a query
   */
  public async recall(userId: string, query: string, limit: number = 5): Promise<string[]> {
    try {
      const queryEmbedding = await getEmbeddings(query);
      
      // Semantic search using pgvector (cosine distance)
      const results = await db.select({
        content: agentMemories.content
      })
      .from(agentMemories)
      .where(eq(agentMemories.userId, userId))
      .orderBy(sql`${agentMemories.embedding} <=> ${JSON.stringify(queryEmbedding)}::vector`)
      .limit(limit);
      
      return results.map(r => r.content);
    } catch (err) {
      console.error(`🚨 [MemoryError] Failed to recall memory:`, err);
      return [];
    }
  }
}
