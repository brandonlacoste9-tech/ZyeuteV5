const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const promptPrefix = "High-end luxury 3d render of a";
const promptSuffix = "gold and marble accents, dark cinematic background, photorealistic, 8k";

const items = {
  // Header Icons
  'icon-trophy': `${promptPrefix} magnificent golden trophy cup, ${promptSuffix}`,
  'icon-bell': `${promptPrefix} beautiful golden notification bell, ${promptSuffix}`,
  'icon-gear': `${promptPrefix} sleek golden settings gear mechanism, ${promptSuffix}`,
  'icon-search': `${promptPrefix} elegant magnifying glass with gold rim, ${promptSuffix}`,
  
  // Bottom Nav Icons
  'icon-home': `${promptPrefix} minimalist modern luxury house symbol, ${promptSuffix}`,
  'icon-messages': `${promptPrefix} sealed letter envelope with gold wax seal, ${promptSuffix}`,
  'icon-upload': `${promptPrefix} golden plus sign emblem, ${promptSuffix}`,
  'icon-arcade': `${promptPrefix} retro arcade gamepad controller, ${promptSuffix}`,
  'icon-profile': `${promptPrefix} elegant person silhouette profile avatar, ${promptSuffix}`
};

const outputDir = path.join(process.cwd(), 'frontend', 'public', 'assets', 'icons');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Generate in parallel to speed things up
console.log("Generating Navigation Icons with Higgsfield FLUX.2...");

const promises = Object.entries(items).map(async ([id, prompt]) => {
  if (fs.existsSync(path.join(outputDir, id + '.png'))) {
    console.log(`Skipping ${id}, already exists.`);
    return;
  }
  console.log(`Generating ${id}...`);
  try {
    // Note: since this is node, we'll wrap the execSync in a promise or just use exec
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);
    
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
  console.log('All done!');
});
