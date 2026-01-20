/**
 * TypeScript Environment Variable Declarations
 */

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      // Supabase
      NEXT_PUBLIC_SUPABASE_URL: string;
      NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
      SUPABASE_SERVICE_ROLE_KEY: string;

      // AI Models
      DEEPSEEK_API_KEY?: string;
      GOOGLE_API_KEY?: string;
      OPENAI_API_KEY?: string;
      AI_MODEL?: "deepseek-chat" | "gemini-2.0-flash-exp" | "gpt-4o";

      // Browser Service
      BROWSER_SERVICE_URL?: string;
      BROWSER_USE_API_KEY?: string;
      USE_BROWSER_CLOUD?: string;

      // App Config
      NODE_ENV: "development" | "production" | "test";
      NEXT_PUBLIC_APP_URL?: string;
    }
  }
}

export {};
