# 🧠 Ti-Guy - The Brain of Zyeuté

Ti-Guy is the AI orchestrator that enforces Quebec-first development principles.

## 🎯 Philosophy

Ti-Guy ensures every feature built for Zyeuté is:

- 🇨🇦 **Quebec-first**: French/Joual language, Quebec culture
- 🎨 **Branded**: Quebec Blue (#003399) everywhere
- 🤲 **Informed**: Real-time Quebec market data
- ✅ **Validated**: Design compliance before deployment

## 🛠️ Available Tools

### 1. search_trends

Discovers trending Quebec content across platforms.

```typescript
const trends = await searchTrendsTool.execute({
  platform: 'tiktok',      // google, tiktok, instagram, youtube
  region: 'montreal'       // montreal, quebec-city, all
});

// Returns:
{
  success: true,
  platform: 'tiktok',
  region: 'montreal',
  trends: [
    {
      title: 'Poutine Week MTL',
      description: '...',
      cultural_score: 0.95,
      hashtags: ['#PoutineWeek', '#MTL']
    }
  ]
}
```

### 2. analyze_competitor

Analyzes competitor's Quebec cultural authenticity.

```typescript
const analysis = await analyzeCompetitorTool.execute({
  url: 'https://tiktok.com/@quebecmemes',
  metrics: ['followers', 'engagement', 'cultural_score']
});

// Returns:
{
  success: true,
  analysis: {
    followers: '45.2k',
    engagement_rate: '8.3%',
    cultural_score: 0.87,
    uses_joual: true,
    quebec_locations: ['Montreal', 'Quebec City']
  }
}
```

### 3. validate_design

Validates UI code for Quebec compliance.

```typescript
const validation = await validateDesignTool.execute({
  component_code: '<Button>Submit</Button>',
  component_type: 'button'
});

// Returns:
{
  compliant: false,
  suggestions: [
    "❌ Replace 'submit' with 'Envoyer' (Form submission)"
  ],
  quebec_colors: { ... }
}
```

## 🎨 Design System Rules

### Joual Translations (MANDATORY)

| ❌ English | ✅ Joual               | Context            |
| ---------- | ---------------------- | ------------------ |
| Loading... | Ça charge...           | Loading states     |
| Submit     | Envoyer                | Form submission    |
| Send       | Grouille-toi           | Urgent action      |
| Delete     | Sacrer ça aux vidanges | Destructive action |
| Add Friend | Ajouter aux chums      | Social connection  |
| Error      | Oups, y'a un bobo      | Error message      |

### Quebec Color Palette (MANDATORY)

```typescript
const QUEBEC_COLORS = {
  "quebec-blue": "#003399", // Primary buttons, CTAs
  "snow-white": "#F8F9FA", // Backgrounds, cards
  "alert-red": "#DC3545", // Destructive actions
  "hydro-yellow": "#FFCC00", // Highlights, notifications
};
```

### Tailwind Classes

```css
/* Use these classes */
bg-zyeute-blue      /* Primary actions */
bg-zyeute-snow      /* Backgrounds */
bg-zyeute-alert     /* Destructive actions */
bg-zyeute-hydro     /* Highlights */
text-zyeute-blue    /* Primary text */
border-zyeute-blue  /* Borders */
```

## 🔄 Ti-Guy Workflow

### Correct Workflow

```typescript
// Step 1: Write component
const component = `
  <Button className="bg-zyeute-blue">
    Envoyer
  </Button>
`;

// Step 2: Validate
const validation = await validateDesignTool.execute({
  component_code: component,
});

// Step 3: Check compliance
if (validation.compliant) {
  // ✅ Deploy to production
} else {
  // ❌ Fix issues
  console.log(validation.suggestions);
}
```

### ❌ Wrong Workflow

```typescript
// DON'T DO THIS - No validation!
const component = `<Button>Submit</Button>`;
// Deploys English text to production ❌
```

## 🚀 Integration Examples

### Example 1: Component with Trend Data

```typescript
import { searchTrendsTool } from '@/backend/ai/orchestrator';

export default async function TrendingFeed() {
  // Fetch Quebec trends
  const { trends } = await searchTrendsTool.execute({
    platform: 'tiktok',
    region: 'montreal'
  });

  return (
    <Card className="bg-zyeute-snow">
      <CardHeader>
        <h2 className="text-zyeute-blue">Tendances à Montréal</h2>
      </CardHeader>
      <CardContent>
        {trends.map(trend => (
          <TrendCard
            key={trend.title}
            {...trend}
            culturalScore={trend.cultural_score}
          />
        ))}
      </CardContent>
    </Card>
  );
}
```

### Example 2: Competitor Dashboard

```typescript
import { analyzeCompetitorTool } from '@/backend/ai/orchestrator';

export default async function CompetitorDashboard() {
  const competitors = [
    'https://tiktok.com/@quebecmemes',
    'https://instagram.com/mtl_culture'
  ];

  const analyses = await Promise.all(
    competitors.map(url =>
      analyzeCompetitorTool.execute({ url })
    )
  );

  return (
    <div className="space-y-4">
      {analyses.map(({ analysis, url }) => (
        <CompetitorCard
          key={url}
          url={url}
          culturalScore={analysis.cultural_score}
          engagement={analysis.engagement_rate}
        />
      ))}
    </div>
  );
}
```

### Example 3: Pre-commit Hook

```typescript
// scripts/validate-ui.ts
import { validateDesignTool } from "@/backend/ai/orchestrator";
import { readFileSync } from "fs";

const componentFile = process.argv[2];
const code = readFileSync(componentFile, "utf-8");

const validation = await validateDesignTool.execute({
  component_code: code,
});

if (!validation.compliant) {
  console.error("❌ Quebec compliance check failed:");
  validation.suggestions.forEach((s) => console.error(s));
  process.exit(1);
}

console.log("✅ Quebec compliance check passed!");
```

## 🎓 Quebec Cultural Scoring

Content is scored 0.0 to 1.0 based on:

### Language (up to +0.3)

- Joual detected: +0.3
- Quebec French: +0.2
- English with Quebec context: +0.05

### Location (up to +0.2)

- Montreal mentioned: +0.2
- Quebec City: +0.15
- Other Quebec cities: +0.1

### Cultural References (up to +0.3)

- Food (poutine, tourtière): +0.05 each
- Sports (Habs, hockey): +0.05 each
- Slang (tabarnak, tsé): +0.03 each

### Penalties (down to -0.5)

- English-only content: -0.5
- Non-Quebec location: -0.3

**Minimum acceptable score: 0.3**
**Recommended score: 0.7+**

## 🔧 Configuration

Ti-Guy uses environment variables:

```bash
# AI Model (choose one)
AI_MODEL=deepseek-chat           # DeepSeek V3 ($0.14/1M tokens)
# AI_MODEL=gemini-2.0-flash-exp  # Gemini 2.0 Flash (free tier)

# API Keys
DEEPSEEK_API_KEY=your-key
# GOOGLE_API_KEY=your-key

# Browser Service
BROWSER_SERVICE_URL=http://localhost:8000
```

## 📊 Monitoring

Track Ti-Guy's impact:

```typescript
// Track design compliance rate
const validation = await validateDesignTool.execute({ ... });
analytics.track('design_validation', {
  compliant: validation.compliant,
  suggestions_count: validation.suggestions.length
});

// Track cultural scores
const trends = await searchTrendsTool.execute({ ... });
const avgScore = trends.trends.reduce((sum, t) =>
  sum + t.cultural_score, 0
) / trends.trends.length;

analytics.track('cultural_score_avg', { score: avgScore });
```

## 🐝 Remember

> Ti-Guy isn't just an AI - it's Quebec's digital sovereignty guardian!

Every line of code, every button, every word must serve Quebec culture first.

**Fait au Québec, pour le Québec! 🇨🇦⚡**
