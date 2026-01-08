/**
 * Security Test Script
 * 
 * Tests the security implementation by verifying:
 * 1. Non-owners cannot see originalUrl or jobId
 * 2. Owners can see all fields
 * 3. Sanitization functions work correctly
 * 
 * Run with: npx tsx zyeute/scripts/test-security-access.ts
 */

import { sanitizePostForUser, sanitizePostsForUser, verifyPostOwnership } from "../backend/utils/security.js";
import type { Post } from "../shared/schema.js";

// Mock post data for testing
const mockPost: Post = {
  id: "test-post-123",
  userId: "owner-user-456",
  mediaUrl: "https://example.com/processed.mp4",
  enhancedUrl: "https://example.com/enhanced.mp4",
  originalUrl: "https://example.com/raw.mp4", // Sensitive field
  thumbnailUrl: "https://example.com/thumb.jpg",
  caption: "Test post",
  processingStatus: "completed",
  jobId: "job-789", // Sensitive field
  mediaType: "video",
  visualFilter: "vibrant",
  createdAt: new Date(),
  updatedAt: new Date(),
  likesCount: 0,
  commentsCount: 0,
  sharesCount: 0,
  viewsCount: 0,
  isArchived: false,
  isDeleted: false,
  mediaMetadata: {},
};

console.log("🛡️  Security Test Suite\n");
console.log("=".repeat(50) + "\n");

// Test 1: Non-owner should NOT see sensitive fields
console.log("Test 1: Non-owner sanitization");
try {
  const nonOwnerId = "different-user-999";
  const sanitized = sanitizePostForUser(mockPost, nonOwnerId);
  
  const hasOriginalUrl = 'originalUrl' in sanitized;
  const hasJobId = 'jobId' in sanitized;
  
  if (hasOriginalUrl || hasJobId) {
    console.error("❌ FAIL: Non-owner can see sensitive fields");
    console.error(`   originalUrl present: ${hasOriginalUrl}`);
    console.error(`   jobId present: ${hasJobId}`);
    process.exit(1);
  } else {
    console.log("✅ PASS: Non-owner cannot see originalUrl or jobId");
    console.log(`   Visible fields: ${Object.keys(sanitized).join(", ")}`);
  }
} catch (error: any) {
  console.error(`❌ Error: ${error.message}`);
  process.exit(1);
}

console.log("\n" + "=".repeat(50) + "\n");

// Test 2: Owner SHOULD see all fields
console.log("Test 2: Owner access (full data)");
try {
  const ownerId = "owner-user-456";
  const sanitized = sanitizePostForUser(mockPost, ownerId);
  
  const hasOriginalUrl = 'originalUrl' in sanitized;
  const hasJobId = 'jobId' in sanitized;
  
  if (!hasOriginalUrl || !hasJobId) {
    console.error("❌ FAIL: Owner cannot see sensitive fields");
    console.error(`   originalUrl present: ${hasOriginalUrl}`);
    console.error(`   jobId present: ${hasJobId}`);
    process.exit(1);
  } else {
    console.log("✅ PASS: Owner can see all fields including sensitive ones");
    console.log(`   originalUrl: ${sanitized.originalUrl}`);
    console.log(`   jobId: ${sanitized.jobId}`);
  }
} catch (error: any) {
  console.error(`❌ Error: ${error.message}`);
  process.exit(1);
}

console.log("\n" + "=".repeat(50) + "\n");

// Test 3: verifyPostOwnership should throw for non-owners
console.log("Test 3: Ownership verification (should fail for non-owner)");
try {
  const nonOwnerId = "different-user-999";
  await verifyPostOwnership(mockPost.id, nonOwnerId);
  console.error("❌ FAIL: verifyPostOwnership should throw for non-owners");
  process.exit(1);
} catch (error: any) {
  if (error.message.includes("not authorized") || error.message.includes("not found")) {
    console.log("✅ PASS: verifyPostOwnership correctly rejects non-owners");
    console.log(`   Error message: ${error.message}`);
  } else {
    console.error(`❌ Unexpected error: ${error.message}`);
    process.exit(1);
  }
}

console.log("\n" + "=".repeat(50) + "\n");

// Test 4: Batch sanitization
console.log("Test 4: Batch sanitization (multiple posts)");
try {
  const posts = [mockPost, { ...mockPost, id: "post-2", userId: "owner-user-456" }];
  const nonOwnerId = "different-user-999";
  const sanitized = sanitizePostsForUser(posts, nonOwnerId);
  
  const allSanitized = sanitized.every(post => 
    !('originalUrl' in post) && !('jobId' in post)
  );
  
  if (!allSanitized) {
    console.error("❌ FAIL: Batch sanitization failed");
    process.exit(1);
  } else {
    console.log("✅ PASS: All posts sanitized correctly");
    console.log(`   Processed ${sanitized.length} posts`);
  }
} catch (error: any) {
  console.error(`❌ Error: ${error.message}`);
  process.exit(1);
}

console.log("\n" + "=".repeat(50) + "\n");
console.log("🎉 All security tests passed!");
console.log("\n📋 Next Steps:");
console.log("1. Start the server: cd zyeute/backend && npm run dev");
console.log("2. Run live tests: npx tsx zyeute/scripts/test-security-live.ts");
console.log("3. Or use PowerShell: .\\zyeute\\scripts\\quick-security-test.ps1");
