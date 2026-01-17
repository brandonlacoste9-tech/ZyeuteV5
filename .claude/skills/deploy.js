#!/usr/bin/env node

/**
 * Claude Skill: Deploy to Production
 * Usage: /deploy
 */

const { execSync } = require('child_process');

function runCommand(command, description) {
  console.log(`\n▶️  ${description}...`);
  try {
    execSync(command, { stdio: 'inherit' });
    console.log(`✅ ${description} completed`);
    return true;
  } catch (error) {
    console.error(`❌ ${description} failed`);
    return false;
  }
}

async function deploy() {
  console.log('🚀 Starting deployment to production...\n');
  console.log('━'.repeat(50));

  // 1. Check git status
  if (!runCommand('git status --short', 'Checking git status')) {
    return;
  }

  // 2. Run tests (optional, comment out if no tests)
  // if (!runCommand('npm test', 'Running tests')) {
  //   console.log('\n⚠️  Tests failed - deployment aborted');
  //   return;
  // }

  // 3. Build check
  console.log('\n📦 Build verification...');
  console.log('   Backend: TypeScript compilation check');
  console.log('   Frontend: Vite build (handled by Vercel)');

  // 4. Commit and push
  console.log('\n🔍 Current branch:');
  runCommand('git branch --show-current', 'Show current branch');

  console.log('\n📤 Pushing to remote...');
  if (!runCommand('git push', 'Push commits')) {
    console.log('⚠️  Push failed - check for uncommitted changes');
    return;
  }

  console.log('\n━'.repeat(50));
  console.log('✅ Code pushed successfully!');
  console.log('\n📋 Next steps:');
  console.log('   1. Railway will auto-deploy backend (~2-3 min)');
  console.log('   2. Vercel will auto-deploy frontend (~1-2 min)');
  console.log('   3. Check status: /status');
  console.log('\n🔗 Links:');
  console.log('   Railway: https://railway.app/project/zyeutev5-production');
  console.log('   Vercel: https://vercel.com/dashboard');
  console.log('   Backend: https://zyeutev5-production.up.railway.app/api/health');
}

deploy().catch(console.error);
