const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const demoPrompts = {
  'demo-6': 'A cinematic 8k shot of a rustic sugar shack (cabane a sucre) in Quebec during spring, golden maple syrup pouring over fresh pancakes, cozy warm atmosphere',
  'demo-7': 'Breathtaking 8k drone shot of the massive Montmorency Falls in Quebec, powerful waterfall crashing down, lush surroundings, photorealistic',
  'demo-8': 'Acrobats performing a mesmerizing Cirque du Soleil show in Montreal, dramatic stage lighting, cinematic slow motion, 8k photorealistic',
  'demo-9': 'A flock of Canadian geese flying gracefully over the majestic Saint-Lawrence river at dawn, beautiful soft lighting, 8k cinematic wildlife photography',
  'demo-10': 'A vintage car driving along the stunning coastal route 132 in Gaspesie, Quebec, ocean waves crashing against cliffs, golden hour sunset, 8k'
};

const outputDir = path.join(process.cwd(), 'frontend', 'public', 'assets', 'videos');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const generatedUrls = {};

console.log("Generating MORE Demo Videos with Higgsfield Kling 3.0...");

for (const [id, prompt] of Object.entries(demoPrompts)) {
  console.log(`Generating ${id}...`);
  try {
    const createOut = execSync(`higgsfield generate create kling3_0 --prompt "${prompt}" --json`).toString();
    const jobId = JSON.parse(createOut)[0];
    console.log(`Job ID: ${jobId}. Waiting...`);
    
    let result = null;
    while (!result || result.status !== 'completed') {
      const waitOut = execSync(`higgsfield generate wait ${jobId} --json`).toString();
      result = JSON.parse(waitOut);
      if (result.status === 'failed') throw new Error('Job failed');
    }
    
    console.log(`Completed ${id}! URL: ${result.result_url}`);
    generatedUrls[id] = result.result_url;
  } catch (err) {
    console.error(`Failed on ${id}:`, err.message);
  }
}

console.log('All done!');
console.log('Generated URLs to append in LaZyeute.tsx:');
console.log(JSON.stringify(generatedUrls, null, 2));
