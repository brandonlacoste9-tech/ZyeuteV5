import { z } from "zod";

/**
 * Zyeuté AI Response Schemas
 * Standardized validation for all AI endpoints to ensure frontend stability
 */

// Ti-Guy Chat response
export const TiGuyChatResponseSchema = z.object({
  response: z.string(),
});

export type TiGuyChatResponse = z.infer<typeof TiGuyChatResponseSchema>;

// AI Image generation response
export const AIImageResponseSchema = z.object({
  imageUrl: z.string().url(),
  prompt: z.string(),
});

export type AIImageResponse = z.infer<typeof AIImageResponseSchema>;

// AI Video generation response
export const AIVideoResponseSchema = z.object({
  videoUrl: z.string().url(),
  prompt: z.string(),
});

export type AIVideoResponse = z.infer<typeof AIVideoResponseSchema>;

// V3 Microcopy response
export const V3MicrocopyResponseSchema = z.object({
  text: z.string(),
});

export type V3MicrocopyResponse = z.infer<typeof V3MicrocopyResponseSchema>;

// V3 Feed Item structure
export const V3FeedItemSchema = z.object({
  content_type: z.string(),
  title: z.string(),
  body: z.string(),
  tags: z.array(z.string()),
  suggested_tone: z.string(),
  suggested_image_prompt: z.string().optional(),
});

export type V3FeedItem = z.infer<typeof V3FeedItemSchema>;

// V3 Flow result
export const V3FlowResponseSchema = z.object({
  type: z.enum(["text", "image", "feed_item", "error"]),
  content: z.string(),
  metadata: z.record(z.any()).optional(),
});

export type V3FlowResponse = z.infer<typeof V3FlowResponseSchema>;

// Helper function to validate AI response
export function validateAIResponse<T>(schema: z.Schema<T>, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (error) {
    console.error("AI Response Validation Error:", error);
    if (error instanceof z.ZodError) {
      throw new Error(
        `Invalid AI response: ${error.errors.map((e) => e.message).join(", ")}`,
      );
    }
    throw error;
  }
}
