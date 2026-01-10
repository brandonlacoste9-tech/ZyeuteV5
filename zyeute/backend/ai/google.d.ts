import { GoogleGenerativeAI } from "@google/generative-ai";
export declare const genAI: GoogleGenerativeAI | null;
/**
 * Gets the specified Gemini model.
 * Defaults to Flash for cost/speed efficiency.
 */
export declare function getGeminiModel(modelName?: "gemini-1.5-flash" | "gemini-1.5-pro", systemInstruction?: string): import("@google/generative-ai").GenerativeModel | null;
/**
 * Generates embeddings for the given text using Gemini's embedding model.
 */
export declare function getEmbeddings(text: string): Promise<number[]>;
//# sourceMappingURL=google.d.ts.map