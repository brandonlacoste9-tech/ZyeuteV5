#!/usr/bin/env node

/**
 * Claude Skill: Check Deployment Status
 * Usage: /status
 */

async function checkStatus() {
  const backendUrl = 'https://zyeutev5-production.up.railway.app';
  const frontendUrl = 'https://zyeute.vercel.app'; // Update with your Vercel URL

  console.log('📊 Checking deployment status...\n');
  console.log('━'.repeat(60));

  // Check Backend
  console.log('\n🖥️  BACKEND (Railway)');
  try {
    const start = Date.now();
    const response = await fetch(`${backendUrl}/api/health`);
    const latency = Date.now() - start;
    const data = await response.json();

    console.log(`   Status: ✅ Online (${latency}ms)`);
    console.log(`   Health: ${data.status === 'healthy' ? '✅ Healthy' : '⚠️ Degraded'}`);
    console.log(`   Database: ${data.database === 'connected' ? '✅' : '❌'} ${data.database}`);
    console.log(`   Redis: ${data.redis?.status === 'connected' ? '✅ Connected' :
                           data.redis?.status === 'not_configured' ? '⚪ Not configured' :
                           '❌ Disconnected'}`);
    if (data.redis?.latency) {
      console.log(`   Redis Latency: ${data.redis.latency}ms`);
    }
    console.log(`   URL: ${backendUrl}`);

  } catch (error) {
    console.log(`   Status: ❌ Offline`);
    console.log(`   Error: ${error.message}`);
  }

  // Check Frontend
  console.log('\n🌐 FRONTEND (Vercel)');
  try {
    const start = Date.now();
    const response = await fetch(frontendUrl, { method: 'HEAD' });
    const latency = Date.now() - start;

    console.log(`   Status: ✅ Online (${latency}ms)`);
    console.log(`   URL: ${frontendUrl}`);

  } catch (error) {
    console.log(`   Status: ❌ Offline or not deployed`);
    console.log(`   Note: Update frontendUrl in .claude/skills/status.js`);
  }

  // Git Status
  const { execSync } = require('child_process');
  console.log('\n📝 GIT STATUS');
  try {
    const branch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
    const status = execSync('git status --short', { encoding: 'utf8' });

    console.log(`   Branch: ${branch}`);
    console.log(`   Changes: ${status ? '⚠️ Uncommitted changes' : '✅ Clean'}`);

    if (status) {
      console.log('\n   Modified files:');
      status.split('\n').forEach(line => {
        if (line) console.log(`     ${line}`);
      });
    }
  } catch (error) {
    console.log(`   Error: ${error.message}`);
  }

  console.log('\n━'.repeat(60));
  console.log('\n💡 Quick commands:');
  console.log('   /redis-health  - Detailed Redis status');
  console.log('   /deploy        - Deploy latest changes');
  console.log('   /logs          - View Railway logs');
}

checkStatus().catch(console.error);
