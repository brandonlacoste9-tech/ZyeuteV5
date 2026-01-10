/**
 * Test Script for Piasse Economy
 * Tests Wallet, Jackpot, and Bee Trading systems
 */

import { logger } from "../zyeute/backend/utils/logger.js";
import {
  createPiasseWallet,
  getUserWallet,
  getWalletBalance,
} from "../zyeute/backend/services/piasse-wallet-service.js";
import {
  getJackpotStatus,
  createJackpotPool,
  contributeToJackpot,
  drawJackpot,
} from "../zyeute/backend/services/jackpot-logic.js";
import {
  listBeeOnMarketplace,
  createBeeListing,
  getActiveListings,
  getUserBees,
} from "../zyeute/backend/services/bee-trading.js";

async function testPiasseEconomy() {
  logger.info("💰 Starting Piasse Economy Tests...\n");

  // Test User ID (replace with actual test user ID)
  const TEST_USER_ID = "00000000-0000-0000-0000-000000000001";

  try {
    // ============ WALLET TESTS ============
    logger.info("🔐 Testing Piasse Wallet System...");
    
    try {
      const wallet = await createPiasseWallet(TEST_USER_ID);
      logger.info(`✅ Wallet created: ${wallet.publicAddress}`);
      logger.info(`   Balance: ${wallet.balance} Piasses`);
      logger.info(`   Ghost Shell: ${wallet.isGhostShellEnabled ? "Enabled" : "Disabled"}`);
    } catch (error: any) {
      if (error.message.includes("already exists")) {
        logger.info("⚠️  Wallet already exists, skipping creation");
      } else {
        throw error;
      }
    }

    const wallet = await getUserWallet(TEST_USER_ID);
    if (wallet) {
      logger.info(`✅ Wallet retrieved: ${wallet.publicAddress}`);
      const balance = await getWalletBalance(TEST_USER_ID);
      logger.info(`✅ Balance synced: ${balance} Piasses\n`);
    }

    // ============ JACKPOT TESTS ============
    logger.info("🎰 Testing Jackpot System...");

    const jackpotStatus = await getJackpotStatus();
    logger.info(`✅ Current Jackpot Status:`);
    logger.info(`   Pool: ${jackpotStatus.pool ? jackpotStatus.pool.name : "None"}`);
    logger.info(`   Current: ${jackpotStatus.totalContributions} Piasses`);
    logger.info(`   Target: ${jackpotStatus.pool?.targetAmount || 0} Piasses`);
    logger.info(`   Progress: ${jackpotStatus.progress.toFixed(2)}%`);
    logger.info(`   Entries: ${jackpotStatus.entries}\n`);

    // ============ BEE TRADING TESTS ============
    logger.info("🐝 Testing Bee Trading System...");

    try {
      const bee = await listBeeOnMarketplace({
        beeName: "Cinema Bee - Test",
        beeType: "cinema",
        ownerId: TEST_USER_ID,
        price: 5000, // 50 Piasses
        beeMetadata: {
          aestheticScore: 95,
          videoCount: 10,
          successRate: 0.98,
          specializations: ["cinematic", "social", "commercial"],
        },
        hiveId: "quebec",
      });
      logger.info(`✅ Bee listed: ${bee.beeName} (${bee.beeType})`);
      logger.info(`   Price: ${bee.price} Piasses`);
      logger.info(`   ID: ${bee.id}\n`);

      const listing = await createBeeListing(
        bee.id,
        TEST_USER_ID,
        4500, // Slightly discounted
        "Test listing for Cinema Bee"
      );
      logger.info(`✅ Listing created: ${listing.id}`);
      logger.info(`   Listing Price: ${listing.listingPrice} Piasses\n`);

      const listings = await getActiveListings();
      logger.info(`✅ Active Listings: ${listings.length}`);
      listings.forEach((l) => {
        logger.info(`   - ${l.marketplace.beeName}: ${l.listingPrice} Piasses`);
      });

      const userBees = await getUserBees(TEST_USER_ID);
      logger.info(`✅ User Bees: ${userBees.length}`);
      userBees.forEach((bee) => {
        logger.info(`   - ${bee.beeName} (${bee.beeType})`);
      });
    } catch (error: any) {
      logger.error(`❌ Bee Trading Test Failed: ${error.message}`);
    }

    logger.info("\n✅ All Piasse Economy tests completed!");
  } catch (error: any) {
    logger.error(`❌ Test Suite Failed: ${error.message}`);
    logger.error(error.stack);
    process.exit(1);
  }
}

testPiasseEconomy();