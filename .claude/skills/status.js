#!/usr/bin/env node

/**
 * Claude Skill: Check Deployment Status
 * Usage: /status
 */

const https = require('https');

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

function checkUrl(url) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      resolve(res.statusCode === 200);
    }).on('error', () => resolve(false));
  });
}

async function checkStatus() {
  const backendUrl = 'https://zyeutev5-production.up.railway.app';
  const frontendUrl = 'https://zyeute.vercel.app'; // Update with your Vercel URL

  console.log('📊 Checking deployment status...\n');
  console.log('━'.repeat(60));

  // Check Backend
  console.log('\n🖥️  BACKEND (Railway)');
  try {
    const start = Date.now();
    const data = await fetchJson(`${backendUrl}/api/health`);
    const latency = Date.now() - start;

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
    const isOnline = await checkUrl(frontendUrl);
    const latency = Date.now() - start;

    if (isOnline) {
      console.log(`   Status: ✅ Online (${latency}ms)`);
      console.log(`   URL: ${frontendUrl}`);
    } else {
      throw new Error('Frontend not reachable');
    }

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
