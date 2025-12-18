
import dotenv from 'dotenv';
import path from 'path';

// Load env FIRST
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function testBridge() {
    console.log("🧪 Testing Python Bridge directly...");

    // Dynamically import to ensure env vars are loaded before storage.ts initializes
    const { executePythonBee } = await import('../server/ai/python-bridge');

    const taskId = `test-task-${Date.now()}`;
    const beeId = 'finance-bee';
    const payload = {
        query: "Direct bridge test",
        timestamp: Date.now()
    };

    console.log(`Sending task to ${beeId}:`, JSON.stringify(payload));

    try {
        const result = await executePythonBee(beeId, {
            id: taskId,
            type: 'test',
            payload,
            priority: 5
        });

        console.log("✅ Bridge Result:", JSON.stringify(result, null, 2));

        if (result.success && result.data?.status === 'queued') {
            console.log("🎉 SUCCESS: Task successfully queued via Python Bridge!");
        } else {
            console.error("❌ FAILURE: Task was not queued correctly.");
            process.exit(1);
        }

    } catch (error) {
        console.error("❌ ERROR:", error);
        process.exit(1);
    }

    process.exit(0);
}

testBridge();
