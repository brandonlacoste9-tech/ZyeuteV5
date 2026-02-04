import express from "express";
import { storage } from "../storage.js";
import { logger } from "../utils/logger.js";

const router = express.Router();

/**
 * Dialogflow CX Webhook Handler
 *
 * This endpoint receives webhook calls from Dialogflow CX when intents are detected.
 * It handles video search, navigation, and other Ti-Guy voice commands.
 *
 * POST /api/dialogflow/webhook
 *
 * Dialogflow CX sends requests in this format:
 * {
 *   "detectIntentResponse": {
 *     "queryResult": {
 *       "intent": { "displayName": "search_videos" },
 *       "parameters": { "query": "motoneige à Gaspé" },
 *       "fulfillmentText": "..."
 *     },
 *     "session": "projects/.../sessions/..."
 *   }
 * }
 */
router.post("/webhook", async (req, res) => {
  try {
    const detectIntentResponse = req.body.detectIntentResponse || req.body;
    const queryResult =
      detectIntentResponse.queryResult || detectIntentResponse;
    const intent = queryResult.intent?.displayName || queryResult.intent;
    const parameters =
      queryResult.parameters?.fields || queryResult.parameters || {};
    const session = detectIntentResponse.session || req.body.session;

    logger.info(`[DialogflowWebhook] Intent: ${intent}, Session: ${session}`);

    // Extract parameter values (Dialogflow sends them as objects with stringValue)
    const extractParam = (param: any): string => {
      if (!param) return "";
      if (typeof param === "string") return param;
      return param.stringValue || param.numberValue?.toString() || "";
    };

    // Handle different intents
    switch (intent) {
      case "search_videos":
      case "find_videos": {
        const query = extractParam(parameters.query || parameters.search_query);
        const location = extractParam(parameters.location);
        const limit = parseInt(extractParam(parameters.limit)) || 10;

        logger.info(
          `[DialogflowWebhook] Searching videos: query="${query}", location="${location}"`,
        );

        // Search posts in database
        let posts;
        if (location) {
          // Location-based search
          posts = await storage.getExplorePosts(0, limit);
          // Filter by location (simple text match for now)
          posts = posts.filter(
            (post: any) =>
              post.location?.toLowerCase().includes(location.toLowerCase()) ||
              post.caption?.toLowerCase().includes(location.toLowerCase()),
          );
        } else if (query) {
          // Text search in captions/content
          posts = await storage.getExplorePosts(0, limit * 2);
          // Filter by query (simple text match - could be enhanced with vector search)
          posts = posts
            .filter(
              (post: any) =>
                post.caption?.toLowerCase().includes(query.toLowerCase()) ||
                post.content?.toLowerCase().includes(query.toLowerCase()) ||
                post.aiDescription?.toLowerCase().includes(query.toLowerCase()),
            )
            .slice(0, limit);
        } else {
          // No query, return trending posts
          posts = await storage.getExplorePosts(0, limit);
        }

        const videoCount = posts.length;
        const fulfillmentText =
          videoCount > 0
            ? `J'ai trouvé ${videoCount} vidéo${videoCount > 1 ? "s" : ""} pour "${query || location || "toi"}"! Je t'affiche ça maintenant.`
            : `Désolé, je n'ai pas trouvé de vidéos pour "${query || location}". Essaie avec d'autres mots-clés!`;

        // Return Dialogflow CX webhook response format
        return res.json({
          fulfillmentResponse: {
            messages: [
              {
                text: {
                  text: [fulfillmentText],
                },
              },
            ],
            // Custom payload for frontend to display videos
            payload: {
              action: "show_videos",
              videos: posts.map((post: any) => ({
                id: post.id,
                caption: post.caption,
                mediaUrl: post.mediaUrl,
                location: post.location,
                reactionsCount: post.reactionsCount || 0,
              })),
              query: query || location,
              count: videoCount,
            },
          },
        });
      }

      case "show_feed":
      case "open_feed": {
        return res.json({
          fulfillmentResponse: {
            messages: [
              {
                text: {
                  text: ["Je t'ouvre le feed maintenant!"],
                },
              },
            ],
            payload: {
              action: "navigate",
              route: "/feed",
            },
          },
        });
      }

      case "show_profile":
      case "open_profile": {
        return res.json({
          fulfillmentResponse: {
            messages: [
              {
                text: {
                  text: ["Voici ton profil!"],
                },
              },
            ],
            payload: {
              action: "navigate",
              route: "/profile",
            },
          },
        });
      }

      case "show_montreal_videos":
      case "montreal_content": {
        const limit = parseInt(extractParam(parameters.limit)) || 10;
        const posts = await storage.getExplorePosts(0, limit * 2);
        const montrealPosts = posts
          .filter(
            (post: any) =>
              post.location?.toLowerCase().includes("montreal") ||
              post.location?.toLowerCase().includes("montréal") ||
              post.caption?.toLowerCase().includes("montreal") ||
              post.caption?.toLowerCase().includes("montréal"),
          )
          .slice(0, limit);

        return res.json({
          fulfillmentResponse: {
            messages: [
              {
                text: {
                  text: [
                    `J'ai trouvé ${montrealPosts.length} vidéo${montrealPosts.length > 1 ? "s" : ""} de Montréal!`,
                  ],
                },
              },
            ],
            payload: {
              action: "show_videos",
              videos: montrealPosts.map((post: any) => ({
                id: post.id,
                caption: post.caption,
                mediaUrl: post.mediaUrl,
                location: post.location,
              })),
              location: "Montreal",
              count: montrealPosts.length,
            },
          },
        });
      }

      case "greeting":
      case "quebec_slang_greeting": {
        return res.json({
          fulfillmentResponse: {
            messages: [
              {
                text: {
                  text: [
                    "Salut là! Comment ça va? Je suis Ti-Guy, ton assistant Zyeuté. Que veux-tu voir aujourd'hui?",
                  ],
                },
              },
            ],
          },
        });
      }

      default: {
        logger.warn(`[DialogflowWebhook] Unknown intent: ${intent}`);
        return res.json({
          fulfillmentResponse: {
            messages: [
              {
                text: {
                  text: [
                    "Désolé, je n'ai pas compris. Peux-tu répéter? Tu peux me demander de chercher des vidéos, ouvrir le feed, ou montrer ton profil.",
                  ],
                },
              },
            ],
          },
        });
      }
    }
  } catch (error: any) {
    logger.error("[DialogflowWebhook] Error processing webhook:", error);

    return res.status(500).json({
      fulfillmentResponse: {
        messages: [
          {
            text: {
              text: [
                "Désolé, j'ai eu un problème technique. Réessaye dans quelques secondes!",
              ],
            },
          },
        ],
      },
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

export default router;
