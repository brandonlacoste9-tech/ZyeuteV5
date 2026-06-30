const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const demoPrompts = {
  'demo-1': 'A breathtaking 8k cinematic drone shot of the Saint-Lawrence river at sunset, beautiful vibrant orange and purple colors',
  'demo-2': 'A cinematic photorealistic shot of the first winter snow falling over the streets of old Montreal, transforming it into a magical winter wonderland',
  'demo-3': 'A majestic moose with massive antlers standing peacefully in a misty Quebec pine forest at sunrise, photorealistic 8k',
  'demo-4': 'A steaming hot delicious serving of Quebec poutine, fresh cheese curds melting, crispy fries and rich brown gravy, 8k food photography macro shot',
  'demo-5': 'A brilliant night time firework display exploding over the Jacques-Cartier bridge in Montreal, reflecting in the water below'
};

const outputDir = path.join(process.cwd(), 'frontend', 'public', 'assets', 'videos');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const generatedUrls = {};

console.log("Generating Demo Videos with Higgsfield Kling 3.0...");

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
console.log('Generated URLs to replace in LaZyeute.tsx:');
console.log(JSON.stringify(generatedUrls, null, 2));
