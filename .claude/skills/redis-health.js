#!/usr/bin/env node

/**
 * Claude Skill: Check Redis Health
 * Usage: /redis-health or /rh
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

async function checkRedisHealth() {
  const backendUrl = process.env.BACKEND_URL || 'https://zyeutev5-production.up.railway.app';

  console.log('🔍 Checking Redis health...\n');

  try {
    const data = await fetchJson(`${backendUrl}/api/health`);

    console.log('📊 Health Check Results:');
    console.log('━'.repeat(50));
    console.log(`Overall Status: ${data.status === 'healthy' ? '✅' : '⚠️'} ${data.status.toUpperCase()}`);
    console.log(`Database: ${data.database === 'connected' ? '✅' : '❌'} ${data.database}`);

    if (data.redis) {
      const redis = data.redis;
      const statusEmoji = redis.status === 'connected' ? '✅' :
                         redis.status === 'not_configured' ? '⚪' : '❌';

      console.log(`Redis: ${statusEmoji} ${redis.status.toUpperCase()}`);

      if (redis.status === 'connected') {
        console.log(`  ⚡ Latency: ${redis.latency}ms`);
        console.log(`  💬 Message: ${redis.message}`);
      } else if (redis.status === 'not_configured') {
        console.log(`  💬 ${redis.message}`);
        console.log('\n⚠️  Running in degraded mode - cache disabled');
        console.log('💡 Setup Redis: https://console.upstash.com');
      } else {
        console.log(`  ❌ Error: ${redis.error || 'Connection failed'}`);
        console.log('\n🔧 Troubleshooting:');
        console.log('  1. Check REDIS_URL in Railway environment variables');
        console.log('  2. Verify Upstash/Redis credentials');
        console.log('  3. Check Railway deployment logs');
      }
    }

    if (data.ai) {
      console.log(`AI Services: ${data.ai.status === 'healthy' ? '✅' : '⚠️'} ${data.ai.status}`);
    }

    console.log('━'.repeat(50));
    console.log(`\n🕐 Timestamp: ${data.timestamp}`);

  } catch (error) {
    console.error('❌ Failed to check health:', error.message);
    console.log('\n🔧 Is your backend running?');
    console.log(`   URL: ${backendUrl}`);
  }
}

checkRedisHealth().catch(console.error);
