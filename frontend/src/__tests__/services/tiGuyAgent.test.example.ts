/**
 * Ti-Guy Agent Test Examples
 *
 * This file demonstrates how to test the TiGuyAgent service.
 * It's not a formal test suite, but shows expected behavior.
 *
 * To run these examples in your app:
 * 1. Import this file in a component
 * 2. Call the test functions
 * 3. Check console output
 */

import {
  TiGuyAgent,
  type TiGuyInput,
  type TiGuyResponse,
} from "../../services/tiGuyAgent";

/**
 * Test: Generate content for a joke
 */
export async function testJoke() {
  console.log("🧪 Testing Ti-Guy Agent - Joke Intent");

  const input: TiGuyInput = {
    text: "J'ai vu 3 cônes orange sur le chemin ce matin!",
    intent: "joke",
  };

  const response = await TiGuyAgent(input);

  if (response) {
    console.log("✅ Joke Response:");
    console.log("Caption:", response.caption);
    console.log("Emojis:", response.emojis);
    console.log("Tags:", response.tags);
    console.log("Flagged:", response.flagged);
    console.log("Reply:", response.reply);
  } else {
    console.log("❌ No response received");
  }

  return response;
}

/**
 * Test: Generate content for an event
 */
export async function testEvent() {
  console.log("🧪 Testing Ti-Guy Agent - Event Intent");

  const input: TiGuyInput = {
    text: "Party sur la terrasse du Plateau ce soir! DJ live + poutine gratuite!",
    intent: "event",
  };

  const response = await TiGuyAgent(input);

  if (response) {
    console.log("✅ Event Response:");
    console.log("Caption:", response.caption);
    console.log("Emojis:", response.emojis);
    console.log("Tags:", response.tags);
    console.log("Flagged:", response.flagged);
    console.log("Reply:", response.reply);
  } else {
    console.log("❌ No response received");
  }

  return response;
}

/**
 * Test: Generate content for a rant
 */
export async function testRant() {
  console.log("🧪 Testing Ti-Guy Agent - Rant Intent");

  const input: TiGuyInput = {
    text: "La construction sur le pont Jacques-Cartier ENCORE! Ça fait 3 mois!",
    intent: "rant",
  };

  const response = await TiGuyAgent(input);

  if (response) {
    console.log("✅ Rant Response:");
    console.log("Caption:", response.caption);
    console.log("Emojis:", response.emojis);
    console.log("Tags:", response.tags);
    console.log("Flagged:", response.flagged);
    console.log("Reply:", response.reply);
  } else {
    console.log("❌ No response received");
  }

  return response;
}

/**
 * Test: Generate content for an ad
 */
export async function testAd() {
  console.log("🧪 Testing Ti-Guy Agent - Ad Intent");

  const input: TiGuyInput = {
    text: "Nouveau café québécois sur Mont-Royal! 50% de rabais cette semaine!",
    intent: "ad",
  };

  const response = await TiGuyAgent(input);

  if (response) {
    console.log("✅ Ad Response:");
    console.log("Caption:", response.caption);
    console.log("Emojis:", response.emojis);
    console.log("Tags:", response.tags);
    console.log("Flagged:", response.flagged);
    console.log("Reply:", response.reply);
  } else {
    console.log("❌ No response received");
  }

  return response;
}

/**
 * Test: Generate content for a poem
 */
export async function testPoem() {
  console.log("🧪 Testing Ti-Guy Agent - Poem Intent");

  const input: TiGuyInput = {
    text: "L'hiver québécois, frette mais magnifique, sous la neige qui tombe...",
    intent: "poem",
  };

  const response = await TiGuyAgent(input);

  if (response) {
    console.log("✅ Poem Response:");
    console.log("Caption:", response.caption);
    console.log("Emojis:", response.emojis);
    console.log("Tags:", response.tags);
    console.log("Flagged:", response.flagged);
    console.log("Reply:", response.reply);
  } else {
    console.log("❌ No response received");
  }

  return response;
}

/**
 * Run all tests
 */
export async function runAllTests() {
  console.log("🚀 Running all Ti-Guy Agent tests...\n");

  await testJoke();
  console.log("\n---\n");

  await testEvent();
  console.log("\n---\n");

  await testRant();
  console.log("\n---\n");

  await testAd();
  console.log("\n---\n");

  await testPoem();

  console.log("\n✅ All tests completed!");
}

/**
 * Test response structure
 */
export function validateResponse(response: TiGuyResponse | null): boolean {
  if (!response) {
    console.error("❌ Response is null");
    return false;
  }

  const checks = [
    {
      name: "caption",
      valid:
        typeof response.caption === "string" && response.caption.length > 0,
    },
    {
      name: "emojis",
      valid:
        Array.isArray(response.emojis) &&
        response.emojis.length >= 3 &&
        response.emojis.length <= 5,
    },
    {
      name: "tags",
      valid:
        Array.isArray(response.tags) &&
        response.tags.length >= 1 &&
        response.tags.length <= 3,
    },
    { name: "flagged", valid: typeof response.flagged === "boolean" },
    {
      name: "reply",
      valid: typeof response.reply === "string" && response.reply.length > 0,
    },
  ];

  let allValid = true;
  for (const check of checks) {
    if (!check.valid) {
      console.error(`❌ Invalid field: ${check.name}`);
      allValid = false;
    } else {
      console.log(`✅ Valid field: ${check.name}`);
    }
  }

  return allValid;
}

/**
 * Example: Use in a React component
 *
 * ```typescript
 * import { testJoke, testEvent } from '../services/tiGuyAgent.test.example';
 *
 * function MyComponent() {
 *   const handleTest = async () => {
 *     const response = await testJoke();
 *     if (response) {
 *       // Use the response
 *       console.log(response.caption);
 *     }
 *   };
 *
 *   return <button onClick={handleTest}>Test Ti-Guy</button>;
 * }
 * ```
 */
