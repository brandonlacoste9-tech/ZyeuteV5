const { execSync, exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const execAsync = promisify(exec);

const outputDir = path.join(__dirname, '..', 'frontend', 'public', 'assets', 'emojis');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const icons = {
  'icon-badge-1': "High-end luxury 3d render of a number 1 platinum and gold medallion badge with diamond accents, dark cinematic background, photorealistic, 8k",
  'icon-badge-2': "High-end luxury 3d render of a number 2 silver and marble medallion badge, dark cinematic background, photorealistic, 8k",
  'icon-badge-3': "High-end luxury 3d render of a number 3 bronze and dark wood medallion badge, dark cinematic background, photorealistic, 8k",
  'icon-gem': "High-end luxury 3d render of a glowing brilliant cut diamond gem, gold trim, dark cinematic background, photorealistic, 8k"
};

console.log('Generating Gamification Emojis with Higgsfield FLUX.2...');

const promises = Object.entries(icons).map(async ([id, prompt]) => {
  if (fs.existsSync(path.join(outputDir, id + '.png'))) {
    console.log(`Skipping ${id}, already exists.`);
    return;
  }
  console.log(`Generating ${id}...`);
  try {
    const { stdout: createOut } = await execAsync(`higgsfield generate create flux_2 --prompt "${prompt}" --json`);
    const jobId = JSON.parse(createOut)[0];
    console.log(`[${id}] Job ID: ${jobId}. Waiting...`);
    
    let result = null;
    while (!result || result.status !== 'completed') {
      await new Promise(r => setTimeout(r, 5000));
      const { stdout: waitOut } = await execAsync(`higgsfield generate wait ${jobId} --json`);
      result = JSON.parse(waitOut);
      if (result.status === 'failed') throw new Error('Job failed');
    }
    
    console.log(`[${id}] Completed! Downloading ${result.result_url}`);
    await execAsync(`curl -s -L -o "${path.join(outputDir, id + '.png')}" "${result.result_url}"`);
  } catch (err) {
    console.error(`Failed on ${id}:`, err.message);
  }
});

Promise.all(promises).then(() => {
  console.log('All gamification emojis done!');
});
