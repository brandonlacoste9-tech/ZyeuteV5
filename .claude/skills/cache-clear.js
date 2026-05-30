#!/usr/bin/env node

/**
 * Claude Skill: Clear Redis Cache
 * Usage: /cache-clear or /cc
 */

async function clearCache() {
  console.log('🗑️  Redis Cache Clear Utility\n');
  console.log('━'.repeat(50));

  console.log('\n⚠️  This will clear the moderation cache.');
  console.log('    Cached AI moderation results will be deleted.');
  console.log('    Next moderation requests will call the API directly.\n');

  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });

  readline.question('Continue? (y/N): ', async (answer) => {
    readline.close();

    if (answer.toLowerCase() !== 'y') {
      console.log('❌ Cache clear cancelled');
      return;
    }

    console.log('\n🔧 Clearing cache...');

    // Since we can't directly connect to Railway's internal Redis,
    // we'll create an admin endpoint for this
    console.log('\n💡 To clear cache, you have two options:\n');
    console.log('Option 1: Add admin endpoint');
    console.log('   Create POST /api/admin/cache/clear in your backend');
    console.log('   Require authentication for security\n');

    console.log('Option 2: Restart Railway service');
    console.log('   This clears in-memory cache');
    console.log('   Go to Railway dashboard → Restart\n');

    console.log('Option 3: Direct Redis CLI (if you have access)');
    console.log('   redis-cli -h HOST -p PORT -a PASSWORD FLUSHDB\n');

    console.log('━'.repeat(50));
    console.log('\n📝 Recommendation: Implement Option 1 for better control');
  });
}

clearCache().catch(console.error);
