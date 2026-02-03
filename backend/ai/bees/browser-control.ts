/**
 * 🌐 Browser Control Bee
 * Enables Ti-Guy to control the browser, navigate websites, and perform web tasks
 * Uses browser-use patterns for automation
 */

import { z } from "zod";

// Browser action types Ti-Guy can perform
export const BrowserActionSchema = z.object({
  action: z.enum([
    "navigate", // Go to a URL
    "click", // Click an element
    "type", // Type text into an input
    "scroll", // Scroll the page
    "screenshot", // Take a screenshot
    "extract", // Extract content from page
    "search", // Search for something
    "fill_form", // Fill out a form
    "wait", // Wait for element/time
  ]),
  target: z.string().optional(), // CSS selector or URL
  value: z.string().optional(), // Text to type or value
  description: z.string().optional(), // Human-readable description
});

export type BrowserAction = z.infer<typeof BrowserActionSchema>;

// Browser service URL (browser-use or Playwright service)
const BROWSER_SERVICE_URL =
  process.env.BROWSER_SERVICE_URL || "http://localhost:8000";

/**
 * Ti-Guy Browser Control Bee
 * Provides browser automation capabilities with Quebec personality
 */
export class BrowserControlBee {
  private sessionId: string | null = null;

  /**
   * Start a new browser session
   */
  async startSession(): Promise<string> {
    try {
      const response = await fetch(
        `${BROWSER_SERVICE_URL}/api/v1/session/start`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            headless: false,
            viewport: { width: 1280, height: 720 },
          }),
        },
      );

      if (!response.ok)
        throw new Error(`Failed to start session: ${response.statusText}`);

      const data = await response.json();
      this.sessionId = data.sessionId;
      return this.sessionId;
    } catch (error) {
      console.error("🦫 Ti-Guy: Oups, le browser veut pas partir!", error);
      throw error;
    }
  }

  /**
   * Execute a browser action
   */
  async executeAction(action: BrowserAction): Promise<{
    success: boolean;
    result?: any;
    screenshot?: string;
    error?: string;
  }> {
    try {
      const response = await fetch(`${BROWSER_SERVICE_URL}/api/v1/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: this.sessionId,
          ...action,
        }),
      });

      if (!response.ok) {
        throw new Error(`Action failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Navigate to a URL
   */
  async navigate(
    url: string,
  ): Promise<{ success: boolean; title?: string; error?: string }> {
    console.log(`🦫 Ti-Guy: J'me rends sur ${url}...`);
    return this.executeAction({
      action: "navigate",
      target: url,
      description: `Navigating to ${url}`,
    });
  }

  /**
   * Search on a platform
   */
  async search(
    platform: "google" | "youtube" | "tiktok",
    query: string,
  ): Promise<any> {
    const urls: Record<string, string> = {
      google: `https://www.google.com/search?q=${encodeURIComponent(query)}`,
      youtube: `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`,
      tiktok: `https://www.tiktok.com/search?q=${encodeURIComponent(query)}`,
    };

    console.log(`🦫 Ti-Guy: J'cherche "${query}" sur ${platform}...`);

    await this.navigate(urls[platform]);

    // Extract search results
    return this.executeAction({
      action: "extract",
      target:
        platform === "google"
          ? ".g"
          : platform === "youtube"
            ? "ytd-video-renderer"
            : "[data-e2e='search-card-desc']",
      description: `Extracting ${platform} search results`,
    });
  }

  /**
   * Take a screenshot of current page
   */
  async screenshot(): Promise<{
    success: boolean;
    image?: string;
    error?: string;
  }> {
    console.log("🦫 Ti-Guy: J'prends une photo de l'écran!");
    return this.executeAction({
      action: "screenshot",
      description: "Taking screenshot",
    });
  }

  /**
   * Extract text content from the page
   */
  async extractContent(
    selector?: string,
  ): Promise<{ success: boolean; content?: string; error?: string }> {
    console.log("🦫 Ti-Guy: J'lis la page pour toi...");
    return this.executeAction({
      action: "extract",
      target: selector || "body",
      description: "Extracting page content",
    });
  }

  /**
   * Fill out a form
   */
  async fillForm(
    fields: Record<string, string>,
  ): Promise<{ success: boolean; error?: string }> {
    console.log("🦫 Ti-Guy: J'remplis le formulaire...");
    return this.executeAction({
      action: "fill_form",
      value: JSON.stringify(fields),
      description: "Filling form fields",
    });
  }

  /**
   * Close the browser session
   */
  async closeSession(): Promise<void> {
    if (this.sessionId) {
      try {
        await fetch(`${BROWSER_SERVICE_URL}/api/v1/session/close`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId: this.sessionId }),
        });
        this.sessionId = null;
        console.log("🦫 Ti-Guy: Browser fermé, merci bonsoir!");
      } catch (error) {
        console.error("Error closing session:", error);
      }
    }
  }
}

/**
 * Bee task runner for Hive Mind integration
 */
export async function run(task: any) {
  const payload = task.payload || {};
  const action = payload.action as BrowserAction["action"];
  const target = payload.target || payload.url;
  const value = payload.value || payload.query;

  const bee = new BrowserControlBee();

  try {
    await bee.startSession();

    let result;

    switch (action) {
      case "navigate":
        result = await bee.navigate(target);
        break;
      case "search":
        result = await bee.search(payload.platform || "google", value);
        break;
      case "screenshot":
        result = await bee.screenshot();
        break;
      case "extract":
        result = await bee.extractContent(target);
        break;
      case "fill_form":
        result = await bee.fillForm(JSON.parse(value));
        break;
      default:
        result = await bee.executeAction({ action, target, value });
    }

    await bee.closeSession();

    return {
      response: formatBrowserResponse(action, result),
      result,
      metadata: { bee: "browser-control", action },
    };
  } catch (error) {
    await bee.closeSession();
    throw error;
  }
}

/**
 * Format browser result into Ti-Guy's voice
 */
function formatBrowserResponse(action: string, result: any): string {
  if (!result.success) {
    return `Oups! J'ai eu un p'tit problème avec le browser: ${result.error}. Réessaye-tu? 🦫`;
  }

  switch (action) {
    case "navigate":
      return `Parfait! J'suis rendu sur la page "${result.title || "là"}". Qu'est-ce tu veux que j'fasse? 🌐`;
    case "search":
      return `J'ai trouvé ça pour toi! Voici les résultats... 🔍`;
    case "screenshot":
      return `Voilà ta capture d'écran! 📸`;
    case "extract":
      return `J'ai lu la page pour toi. Voici c'que j'ai trouvé... 📖`;
    default:
      return `C'est fait! L'action "${action}" a ben marché! ✅`;
  }
}

export const browserControlBee = new BrowserControlBee();
