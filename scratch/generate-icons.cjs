const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const items = {
  'icon-fire': 'High-end luxury 3d render of a flame symbol, gold and marble accents, dark cinematic background, photorealistic, 8k',
  'icon-comment': 'High-end luxury 3d render of a speech bubble symbol, gold and marble accents, dark cinematic background, photorealistic, 8k',
  'icon-share': 'High-end luxury 3d render of a share arrow symbol, gold and marble accents, dark cinematic background, photorealistic, 8k',
  'icon-save': 'High-end luxury 3d render of a bookmark symbol, gold and marble accents, dark cinematic background, photorealistic, 8k',
  'icon-gift': 'High-end luxury 3d render of a wrapped gift box, gold and marble accents, dark cinematic background, photorealistic, 8k'
};

const outputDir = path.join(process.cwd(), 'frontend', 'public', 'assets', 'icons');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

for (const [id, prompt] of Object.entries(items)) {
  if (fs.existsSync(path.join(outputDir, id + '.png'))) continue;
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
