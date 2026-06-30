const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const items = {
  'poutine': 'High-end luxury 3d render of a Quebec poutine, gold and marble accents, dark cinematic background, photorealistic, 8k',
  'caribou': 'High-end luxury 3d render of a majestic caribou, gold and marble accents, dark cinematic background, photorealistic, 8k',
  'fleur-de-lys': 'High-end luxury 3d render of a glowing Fleur-de-lys symbol, gold and marble accents, dark cinematic background, photorealistic, 8k',
  'cone-orange': 'High-end luxury 3d render of a traffic orange cone, gold and marble accents, dark cinematic background, photorealistic, 8k',
  'sirop-erable': 'High-end luxury 3d render of a maple syrup bottle, gold and marble accents, dark cinematic background, photorealistic, 8k',
  'tourtiere': 'High-end luxury 3d render of a Quebec meat pie (tourtiere), gold and marble accents, dark cinematic background, photorealistic, 8k',
  'biere': 'High-end luxury 3d render of a frosty beer glass, gold and marble accents, dark cinematic background, photorealistic, 8k',
  'hockey': 'High-end luxury 3d render of a hockey stick, gold and marble accents, dark cinematic background, photorealistic, 8k'
};

const outputDir = path.join(process.cwd(), 'frontend', 'public', 'assets', 'emojis');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

for (const [id, prompt] of Object.entries(items)) {
  if (id === 'poutine' && fs.existsSync(path.join(outputDir, 'poutine.png'))) continue;
  console.log(`Generating ${id}...`);
  try {
    const createOut = execSync(`higgsfield generate create flux_2 --prompt "${prompt}" --json`).toString();
    const jobId = JSON.parse(createOut)[0];
    console.log(`Job ID: ${jobId}. Waiting...`);
    
    let result = null;
    while (!result || result.status !== 'completed') {
      const waitOut = execSync(`higgsfield generate wait ${jobId} --json`).toString();
      result = JSON.parse(waitOut);
      if (result.status === 'failed') throw new Error('Job failed');
    }
    
    console.log(`Completed! Downloading ${result.result_url}`);
    execSync(`curl -s -L -o "${path.join(outputDir, id + '.png')}" "${result.result_url}"`);
  } catch (err) {
    console.error(`Failed on ${id}:`, err.message);
  }
}
console.log('All done!');
