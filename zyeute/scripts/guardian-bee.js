/**
 * Guardian Bee - Cross-Platform Node Watcher
 * Linux (Railway/Render) and macOS compatible
 * Built-in recovery and secure reporting
 */

const { exec } = require('child_process');
const fetch = require('node-fetch');
const crypto = require('crypto');

const ENDPOINT = process.env.HEALTH_ENDPOINT || "http://localhost:8080/health";
const WEBHOOK = process.env.GUARDIAN_WEBHOOK || "https://hooks.zyeute.app/guardian";
const HMAC_SECRET = process.env.QUEEN_HMAC_SECRET || process.env.COLONY_NECTAR || "default-secret";
const CHECK_INTERVAL = parseInt(process.env.GUARDIAN_CHECK_INTERVAL || "60000"); // 60 seconds
const MAX_HEAL_COUNT = parseInt(process.env.MAX_HEAL_COUNT || "3");
const HEAL_WINDOW_MS = parseInt(process.env.HEAL_WINDOW_MS || "3600000"); // 1 hour

let healCount = 0;
let healTimestamps = [];

/**
 * Sign payload with HMAC-SHA256
 */
function signPayload(payload) {
  const hmac = crypto.createHmac('sha256', HMAC_SECRET);
  hmac.update(JSON.stringify(payload));
  return hmac.digest('base64');
}

/**
 * Send secure webhook notification
 */
async function sendSecureWebhook(event, data = {}) {
  const payload = {
    event,
    node: process.env.NODE_NAME || 'linux-primary',
    timestamp: new Date().toISOString(),
    ...data,
  };

  const signature = signPayload(payload);
  const headers = {
    'Content-Type': 'application/json',
    'X-Zyeute-Signature': signature,
    'X-Zyeute-Node': process.env.NODE_NAME || 'linux-primary',
  };

  try {
    const response = await fetch(WEBHOOK, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error(`❌ Webhook failed: ${response.status} ${response.statusText}`);
    } else {
      console.log(`✅ Webhook sent: ${event}`);
    }
  } catch (error) {
    console.error(`❌ Webhook error: ${error.message}`);
  }
}

/**
 * Check if we should escalate (too many heals in window)
 */
function shouldEscalate() {
  const now = Date.now();
  healTimestamps = healTimestamps.filter(ts => now - ts < HEAL_WINDOW_MS);
  
  if (healTimestamps.length > MAX_HEAL_COUNT) {
    return true;
  }
  return false;
}

/**
 * Send Slack escalation alert
 */
async function sendSlackAlert(nodeName, healCount) {
  const slackWebhook = process.env.SLACK_WEBHOOK;
  if (!slackWebhook) {
    console.warn("⚠️  SLACK_WEBHOOK not configured, skipping Slack alert");
    return;
  }

  const message = {
    text: `🚨 ALERT: Multiple recoveries detected on ${nodeName}`,
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*🚨 Guardian Bee Alert*\n\nNode: *${nodeName}*\nRecovery Count: *${healCount}*\nTime Window: *${HEAL_WINDOW_MS / 1000 / 60} minutes*\n\nManual intervention suggested.`,
        },
      },
    ],
  };

  try {
    await fetch(slackWebhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message),
    });
    console.log(`✅ Slack alert sent`);
  } catch (error) {
    console.error(`❌ Slack alert failed: ${error.message}`);
  }
}

/**
 * Self-healing function
 */
async function heal() {
  healCount++;
  healTimestamps.push(Date.now());
  
  console.log(`🚨 Node Unresponsive. Pulling fresh Genetic Code... (Heal #${healCount})`);
  
  // Try Docker Compose recovery first
  if (process.env.USE_DOCKER === 'true') {
    exec('docker-compose pull && docker-compose down && docker-compose up -d', async (err) => {
      if (!err) {
        console.log(`✅ Docker containers refreshed`);
        await sendSecureWebhook('self_heal', {
          method: 'docker_compose',
          healCount,
        });
      } else {
        console.error(`❌ Docker recovery failed: ${err.message}`);
        await sendSecureWebhook('self_heal_failed', {
          error: err.message,
          healCount,
        });
      }
    });
  } else {
    // PM2 recovery (if using PM2)
    exec('pm2 restart all', async (err) => {
      if (!err) {
        console.log(`✅ PM2 processes restarted`);
        await sendSecureWebhook('self_heal', {
          method: 'pm2',
          healCount,
        });
      } else {
        console.error(`❌ PM2 recovery failed: ${err.message}`);
        await sendSecureWebhook('self_heal_failed', {
          error: err.message,
          healCount,
        });
      }
    });
  }

  // Check if escalation needed
  if (shouldEscalate()) {
    const nodeName = process.env.NODE_NAME || 'linux-primary';
    console.error(`🚨 ESCALATION: Too many heals (${healTimestamps.length}) in ${HEAL_WINDOW_MS / 1000 / 60} minutes`);
    await sendSlackAlert(nodeName, healTimestamps.length);
    await sendSecureWebhook('escalation', {
      healCount: healTimestamps.length,
      timeWindow: HEAL_WINDOW_MS,
    });
  }
}

/**
 * Health check function
 */
async function checkHealth() {
  try {
    const response = await fetch(ENDPOINT, {
      method: 'GET',
      timeout: 5000,
    });

    if (response.status !== 200) {
      console.warn(`⚠️  Health check returned ${response.status}`);
      await heal();
    } else {
      const data = await response.json();
      console.log(`✅ Health check passed: ${JSON.stringify(data).substring(0, 50)}...`);
      
      // Send periodic heartbeat (every 10 checks)
      if (healCount % 10 === 0) {
        await sendSecureWebhook('heartbeat', {
          status: 'healthy',
          uptime: process.uptime(),
        });
      }
    }
  } catch (error) {
    console.error(`❌ Health check failed: ${error.message}`);
    await heal();
  }
}

/**
 * Graceful shutdown
 */
process.on('SIGTERM', async () => {
  console.log('🛑 Guardian Bee shutting down gracefully...');
  await sendSecureWebhook('shutdown', { reason: 'SIGTERM' });
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🛑 Guardian Bee shutting down gracefully...');
  await sendSecureWebhook('shutdown', { reason: 'SIGINT' });
  process.exit(0);
});

// Start monitoring
console.log(`🐝 Guardian Bee started`);
console.log(`   Endpoint: ${ENDPOINT}`);
console.log(`   Webhook: ${WEBHOOK}`);
console.log(`   Check Interval: ${CHECK_INTERVAL}ms`);
console.log(`   Max Heals: ${MAX_HEAL_COUNT} per ${HEAL_WINDOW_MS / 1000 / 60} minutes`);

// Initial health check
checkHealth();

// Periodic health checks
setInterval(checkHealth, CHECK_INTERVAL);

// Export for testing
if (require.main === module) {
  // Running as main script
} else {
  module.exports = { checkHealth, heal, sendSecureWebhook };
}