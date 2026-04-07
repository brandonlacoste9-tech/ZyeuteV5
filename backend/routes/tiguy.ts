import express from "express";
import { TIGUY_SYSTEM_PROMPT } from "../ai/orchestrator";
import { getGeminiModel } from "../ai/google.js";

const router = express.Router();

const DEEPSEEK_CHAT_COMPLETIONS_URL =
  "https://api.deepseek.com/chat/completions";

function buildLocalTiGuyReply(prompt: string) {
  const lower = prompt.toLowerCase();

  if (lower.includes("caption") || lower.includes("légende")) {
    return "Ayoye, essaie ça mon chum: ‘Montréal brille fort à soir ⚜️✨ #MTL #Zyeute #Qc’";
  }
  if (lower.includes("image") || lower.includes("photo")) {
    return "J'vois le vibe que tu cherches! Donne-moi le mood, les couleurs, pis le style, pis j'te guide comme du monde. 🎨";
  }
  if (lower.includes("vidéo") || lower.includes("video")) {
    return "Pour ton vidéo, garde ça court, punché, pis vertical. Hook dans les 2 premières secondes, sinon le monde swipe! 🎬";
  }
  if (lower.includes("habs") || lower.includes("hockey")) {
    return "Les Habs, c'est une religion icitte mon loup! Donne-moi ton angle pis j'te monte une réponse de partisan solide. 🏒";
  }
  if (lower.includes("météo") || lower.includes("meteo") || lower.includes("temps")) {
    return "J'ai pas le radar live en ce moment, mais au Québec faut toujours prévoir une petite surprise du ciel, hein! 🌤️";
  }
  if (lower.includes("poutine") || lower.includes("resto") || lower.includes("bouffe")) {
    return "Si on parle bouffe, vise quelque chose de décadent, local, pis sans fla-fla. Une bonne poutine, ça règle bien des affaires. 🍟";
  }

  return "Salut mon chum! Chu là, pis j'suis prêt à t'aider avec Zyeuté, tes captions, tes idées de vidéos, ou juste jaser un brin. 🦫";
}

async function generateTiGuyReply(prompt: string) {
  if (process.env.DEEPSEEK_API_KEY) {
    try {
      const response = await fetch(DEEPSEEK_CHAT_COMPLETIONS_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [
            { role: "system", content: TIGUY_SYSTEM_PROMPT },
            { role: "user", content: prompt },
          ],
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`DeepSeek ${response.status}: ${text || "request failed"}`);
      }

      const data = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const text = data.choices?.[0]?.message?.content?.trim();
      if (text) {
        return { text, provider: "deepseek-v3" };
      }
    } catch (error) {
      console.warn("[TI-GUY] DeepSeek failed, trying Gemini fallback:", error);
    }
  }

  try {
    const geminiModel = getGeminiModel("gemini-1.5-flash", TIGUY_SYSTEM_PROMPT);
    const result = await geminiModel.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();
    if (text) {
      return { text, provider: "gemini-1.5-flash" };
    }
  } catch (error) {
    console.warn("[TI-GUY] Gemini fallback failed:", error);
  }

  return {
    text: buildLocalTiGuyReply(prompt),
    provider: "fallback-local",
  };
}

router.post("/chat", async (req, res) => {
  try {
    const { message, history, image, context } = req.body as {
      message?: string;
      history?: Array<{ sender?: "user" | "tiguy"; text?: string }>;
      image?: string;
      context?: {
        userId?: string;
        username?: string;
        fileName?: string;
      };
    };

    if (!message && !image) {
      return res.status(400).json({
        response: "Envoie-moi de quoi, câlisse! (Message empty)",
      });
    }

    const safeHistory = Array.isArray(history)
      ? history
          .filter((entry) => entry && typeof entry.text === "string")
          .slice(-8)
      : [];

    const conversationContext = safeHistory.length
      ? safeHistory
          .map(
            (entry) =>
              `${entry.sender === "tiguy" ? "Ti-Guy" : "Utilisateur"}: ${entry.text}`,
          )
          .join("\n")
      : "";

    const promptParts = [
      context?.username ? `Nom de l'utilisateur: ${context.username}` : "",
      context?.userId ? `User ID: ${context.userId}` : "",
      context?.fileName ? `Fichier partagé: ${context.fileName}` : "",
      conversationContext ? `Historique récent:\n${conversationContext}` : "",
      image
        ? "L'utilisateur a joint une image. Réponds en tenant compte de ce contexte visuel même si l'image n'est pas directement analysée côté modèle."
        : "",
      `Message actuel: ${message || "[image seulement]"}`,
    ]
      .filter(Boolean)
      .join("\n\n");

    const aiResult = await generateTiGuyReply(promptParts);

    res.json({
      response: aiResult.text,
      type: image ? "image" : "text",
      timestamp: new Date().toISOString(),
      isAi: true,
      metadata: {
        model: aiResult.provider,
        historyCount: safeHistory.length,
        hasImage: !!image,
      },
    });
  } catch (error: any) {
    console.error("TI-GUY AI error:", error);

    // Detailed error logging for debugging
    if (error.response) {
      console.error("API Response:", error.response.data);
    }

    res.status(500).json({
      error: "Osti, j'ai eu un problème avec mon cerveau AI! Réessaye mon ami!",
      details: error.message,
    });
  }
});

router.get("/status", (req, res) => {
  res.json({
    status: "online",
    brain: "DeepSeek V3 (Trinity)",
    message: "TI-GUY est ben actif, mon chum!",
    timestamp: new Date().toISOString(),
  });
});

export default router;
