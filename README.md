# 🐝 Zyeuté - Le TikTok du Québec

## 🚀 Trinity System Architecture

Zyeuté uses the "Trinity" AI system for Quebec-first development:

- 🧠 **The Brain (Ti‑Guy)**: AI orchestrator enforcing Quebec culture
- 🤲 **The Hands**: Browser automation for trend discovery
- 🎨 **The Soul**: Design system enforcing Joual + Quebec Blue

### Quick Start

```bash
# 1. Install dependencies
npm install
cd zyeute-browser-automation
pip install -r requirements.txt
playwright install chromium

# 2. Configure environment
cp .env.example .env
# Add DEEPSEEK_API_KEY or GOOGLE_API_KEY

# 3. Start browser service
cd zyeute-browser-automation
uvicorn zyeute_automation_api:app --reload

# 4. Start main app (in another terminal)
npm run dev

# 5. Test integration
npx ts-node scripts/test-trinity.ts
```

### AI Models (Cost‑Effective Options)

**Recommended: DeepSeek V3**

- Cost: $0.14 per 1M input tokens, $0.28 per 1M output
- Speed: Fast
- Quality: Excellent for Quebec content

**Alternative: Gemini 2.0 Flash**

- Cost: Free tier available
- Speed: Very fast
- Quality: Good for most tasks

### Trinity Tools

```typescript
import {
  searchTrendsTool,
  validateDesignTool,
} from "@/backend/ai/orchestrator";

// Discover Quebec trends
const trends = await searchTrendsTool.execute({
  platform: "tiktok",
  region: "montreal",
});

// Validate UI design
const validation = await validateDesignTool.execute({
  component_code: "<Button>Submit</Button>",
});
```

See `scripts/test-trinity.ts` for full examples.
