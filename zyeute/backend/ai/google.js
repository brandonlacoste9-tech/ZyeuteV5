import { GoogleGenerativeAI } from "@google/generative-ai";
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
    console.warn("⚠️ GEMINI_API_KEY non trouvée dans .env. Les fonctionnalités de scouting AI seront désactivées.");
}
export const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;
/**
 * Gets the specified Gemini model.
 * Defaults to Flash for cost/speed efficiency.
 */
export function getGeminiModel(modelName = "gemini-1.5-flash", systemInstruction) {
    if (!genAI)
        return null;
    return genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: systemInstruction,
    });
}
/**
 * Generates embeddings for the given text using Gemini's embedding model.
 */
export async function getEmbeddings(text) {
    if (!genAI)
        return new Array(384).fill(0);
    try {
        const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
        const result = await model.embedContent(text);
        // Note: text-embedding-004 usually returns 768 dims.
        // If our schema is 384, we take the first 384 or adjust schema.
        // Given the 384 dims in schema.ts, we'll slice.
        return result.embedding.values.slice(0, 384);
    }
    catch (err) {
        console.error("🚨 [Gemini] Failed to generate embeddings:", err);
        return new Array(384).fill(0);
    }
}
//# sourceMappingURL=google.js.map