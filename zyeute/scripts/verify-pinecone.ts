
import { Pinecone } from '@pinecone-database/pinecone';
import 'dotenv/config';

// Initialize Pinecone Client
const pc = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY || ''
});

const INDEX_NAME = 'zyeute-sovereign';

async function verifyPinecone() {
    console.log("🌲 STARTING PINECONE VERIFICATION 🌲");
    console.log("========================================");

    try {
        // 1. Check if index exists
        const { indexes } = await pc.listIndexes();
        const exists = indexes?.some(i => i.name === INDEX_NAME);
        
        if (!exists) {
            console.error(`❌ Index '${INDEX_NAME}' not found in list.`);
            process.exit(1);
        }
        console.log(`✅ Index '${INDEX_NAME}' found.`);

        // 2. Get Index Instance
        const index = pc.index(INDEX_NAME);

        // 3. Upsert a dummy vector (using the integrated inference API implicitly via the record)
        // Since we created the index with 'embed' configuration, we should verify the inference capability if possible,
        // OR just sending a standard record for now. 
        // Note: The MCP tool set up "integrated inference". 
        // To use it properly requires sending the text for embedding generation.
        // For this simple test, we will skip the raw vector and rely on the text input if the client supports it,
        // but the standard JS client might need specific handling for inference-enabled indexes.
        //
        // Let's keep it simple: Just check stats.
        
        const stats = await index.describeIndexStats();
        console.log("📊 Index Stats:");
        console.log(`   - Total Vectors: ${stats.totalRecordCount}`);
        console.log(`   - Namespaces: ${JSON.stringify(stats.namespaces)}`);
        
        console.log("✅ Connection established successfully.");

    } catch (error) {
        console.error("❌ Pinecone Verification Failed:", error);
        process.exit(1);
    }

    console.log("========================================");
    console.log("🏁 VERIFICATION COMPLETE");
}

verifyPinecone();
