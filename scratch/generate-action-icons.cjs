const { execSync, exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const execAsync = promisify(exec);

const outputDir = path.join(__dirname, '..', 'frontend', 'public', 'assets', 'icons');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const icons = {
  'icon-heart': "High-end luxury 3d render of a pulsing ruby-red heart jewel, gold trim and marble accents, dark cinematic background, photorealistic, 8k",
  'icon-comment': "High-end luxury 3d render of a golden chat bubble emblem, gold and marble accents, dark cinematic background, photorealistic, 8k",
  'icon-share': "High-end luxury 3d render of a sleek golden curved arrow emblem pointing right, gold and marble accents, dark cinematic background, photorealistic, 8k",
  'icon-save': "High-end luxury 3d render of a golden bookmark ribbon, gold and marble accents, dark cinematic background, photorealistic, 8k"
};

console.log('Generating Feed Action Icons with Higgsfield FLUX.2...');

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
  console.log('All action icons done!');
});
