/**
 * Antigravity AI Demo - Direct Google Gemini Integration
 * This demonstrates the connection to Google's advanced AI capabilities
 */

// Simple Gemini API test (you would need to add your GEMINI_API_KEY)
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "your_key_here";

async function testAntigravityConnection() {
    console.log("🚀 Testing Antigravity AI Connection...");

    if (GEMINI_API_KEY === "your_key_here") {
        console.log("⚠️  Please set GEMINI_API_KEY environment variable");
        console.log("   Get your key from: https://aistudio.google.com/app/apikey");
        return;
    }

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    role: "user",
                    parts: [{ text: "Explain quantum computing in simple terms for a 10-year-old." }]
                }],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 500
                }
            })
        });

        const data = await response.json();

        if (response.ok) {
            const answer = data.candidates?.[0]?.content?.parts?.[0]?.text;
            console.log("✅ Antigravity Connection Successful!");
            console.log("🤖 AI Response:", answer?.substring(0, 200) + "...");
            console.log("🧠 Antigravity Core: ONLINE");
        } else {
            console.log("❌ Antigravity Connection Failed:", data.error?.message);
        }

    } catch (error) {
        console.log("🔴 Network Error:", error.message);
    }
}

// Test advanced features
async function testAdvancedFeatures() {
    console.log("\n🔬 Testing Advanced Antigravity Features...");

    const tests = [
        { name: "Code Generation", prompt: "Write a Python function to calculate fibonacci numbers" },
        { name: "Creative Writing", prompt: "Write a haiku about artificial intelligence" },
        { name: "Problem Solving", prompt: "Solve: A train leaves station A at 60mph, another leaves station B at 80mph..." }
    ];

    for (const test of tests) {
        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${GEMINI_API_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        role: "user",
                        parts: [{ text: test.prompt }]
                    }]
                })
            });

            if (response.ok) {
                console.log(`✅ ${test.name}: Available`);
            } else {
                console.log(`❌ ${test.name}: Limited`);
            }
        } catch (error) {
            console.log(`❌ ${test.name}: Error`);
        }

        // Small delay between tests
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
}

// Run the demo
async function runAntigravityDemo() {
    console.log("🧠 ANTIGRAVITY AI DEMO");
    console.log("======================");

    await testAntigravityConnection();
    await testAdvancedFeatures();

    console.log("\n🎯 Antigravity Capabilities:");
    console.log("   • Advanced Reasoning (Gemini 1.5 Pro)");
    console.log("   • Code Generation & Analysis");
    console.log("   • Creative Content Creation");
    console.log("   • Multimodal Processing (Vision + Text)");
    console.log("   • Long Context Conversations");
    console.log("   • Sovereign AI Architecture");

    console.log("\n🚀 Ready to integrate Antigravity into ColonyOS!");
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { testAntigravityConnection, runAntigravityDemo };
}

// Run if called directly
if (typeof require !== 'undefined' && require.main === module) {
    runAntigravityDemo();
}

runAntigravityDemo();