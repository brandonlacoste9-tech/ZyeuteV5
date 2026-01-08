
import { Pinecone } from '@pinecone-database/pinecone';
import 'dotenv/config';

// Configuration
const INDEX_NAME = 'zyeute-sovereign';
const MODEL = 'multilingual-e5-large';

// Sample Data (The "Hives")
const SAMPLES = [
    {
        id: 'post_mtl_01',
        text: 'Chilling on Mont-Royal watching the snowy city lights. Total winter vibes in Quebec.',
        metadata: { hive: 'quebec', type: 'video' }
    },
    {
        id: 'post_rio_01',
        text: 'Sunset volleyball at Ipanema beach. The heat is unreal today! Tropical paradise.',
        metadata: { hive: 'brazil', type: 'video' }
    },
    {
        id: 'post_tokyo_01',
        text: 'Neon lights reflect off the rain in Shibuya. Cyberpunk aesthetic is real tonight.',
        metadata: { hive: 'japan', type: 'video' }
    }
];

async function runPineconeFlow() {
    console.log("🌲 STARTING PINECONE END-TO-END FLOW 🌲");
    console.log("=========================================");

    if (!process.env.PINECONE_API_KEY) {
        console.error("❌ PINECONE_API_KEY missing");
        process.exit(1);
    }

    const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
    const index = pc.index(INDEX_NAME);

    try {
        // --- STEP 1: EMBEDDING & UPSERT ---
        console.log("\n1️⃣  GENERATING EMBEDDINGS (INFERENCE)...");
        
        // Extract texts
        const texts = SAMPLES.map(s => s.text);
        
        // Call Inference API
        const embeddingResponse = await pc.inference.embed(
            MODEL,
            texts,
            { inputType: 'passage' } // 'passage' for storing
        );

        if (!embeddingResponse || !embeddingResponse.data) {
            throw new Error("No data received from Pinecone Inference");
        }

        console.log(`✅ Generated ${embeddingResponse.data.length} embeddings.`);

        // Prepare records for upsert
        const records = SAMPLES.map((sample, i) => ({
            id: sample.id,
            values: embeddingResponse.data[i].values, 
            metadata: {
                ...sample.metadata,
                text: sample.text
            }
        }));

        console.log("2️⃣  UPSERTING TO INDEX...");
        await index.upsert(records);
        console.log("✅ Upsert complete. Waiting 10s for indexing...");
        
        // Wait for eventual consistency
        await new Promise(r => setTimeout(r, 10000));


        // --- STEP 2: SEMANTIC SEARCH ---
        console.log("\n3️⃣  TESTING SEMANTIC SEARCH...");
        
        // Query: "Warm weather" (Should match Rio, NOT Montreal)
        const queryText = "Warm tropical weather and sand";
        console.log(`🔎 Query: "${queryText}"`);

        const queryEmbeddingResponse = await pc.inference.embed(
            MODEL,
            [queryText],
            { inputType: 'query' }
        );

        const queryVector = queryEmbeddingResponse.data?.[0]?.values;
        if (!queryVector) throw new Error("Failed to generate query vector");

        const searchResults = await index.query({
            vector: queryVector,
            topK: 1,
            includeMetadata: true
        });

        // --- VALIDATION ---
        const topMatch = searchResults.matches[0];
        console.log(`🏆 Top Match: ${topMatch?.id} (Score: ${topMatch?.score?.toFixed(4)})`);
        console.log(`   Text: "${topMatch?.metadata?.text}"`);

        if (topMatch?.id === 'post_rio_01') {
            console.log("\n✅ SUCCESS: Semantic search correctly identified the tropical post!");
        } else {
            console.error("\n❌ FAILURE: Search returned unexpected result.");
        }

    } catch (error) {
        console.error("\n❌ ERROR:", error);
    }
    
    console.log("=========================================");
    console.log("🏁 TEST COMPLETE");
}

runPineconeFlow();
