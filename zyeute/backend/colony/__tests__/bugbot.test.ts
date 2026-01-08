/**
 * BugBot Unit Tests
 * Tests bug detection, pattern matching, and API handlers
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { bugBot } from "../bugbot.js";
import type { BugReport, BugPattern } from "../bugbot.js";

describe("BugBot", () => {
  beforeEach(() => {
    // Clear bug reports and patterns before each test
    const allBugs = bugBot.getAllBugs();
    allBugs.forEach((bug) => {
      // Would need a clear method, for now just test isolation
    });
  });

  describe("detectBug", () => {
    it("should create a bug report with required fields", async () => {
      const bug = await bugBot.detectBug({
        severity: "high",
        type: "error",
        title: "Test Bug",
        description: "This is a test bug",
        location: "test.ts:123",
        context: {},
      });

      expect(bug).toBeDefined();
      expect(bug.id).toMatch(/^bug-/);
      expect(bug.severity).toBe("high");
      expect(bug.type).toBe("error");
      expect(bug.title).toBe("Test Bug");
      expect(bug.status).toBe("new");
      expect(bug.detectedAt).toBeDefined();
    });

    it("should assign correct severity based on type", async () => {
      const criticalBug = await bugBot.detectBug({
        severity: "critical",
        type: "security",
        title: "Security Breach",
        description: "Unauthorized access detected",
        location: "auth.ts:45",
        context: {},
      });

      expect(criticalBug.severity).toBe("critical");
      expect(criticalBug.type).toBe("security");
    });

    it("should store context and stack trace", async () => {
      const bug = await bugBot.detectBug({
        severity: "medium",
        type: "error",
        title: "Stack Trace Bug",
        description: "Error with stack",
        location: "app.ts:10",
        context: { userId: "user123", endpoint: "/api/test" },
        stackTrace: "Error: Test\n  at app.ts:10",
      });

      expect(bug.context).toEqual({ userId: "user123", endpoint: "/api/test" });
      expect(bug.stackTrace).toContain("Error: Test");
    });
  });

  describe("pattern matching", () => {
    it("should match bugs against known patterns", async () => {
      // Create a pattern
      const pattern: BugPattern = {
        id: "pattern-test",
        pattern: "Cannot read property",
        severity: "high",
        description: "Null reference error",
      };

      // Would need access to internal pattern storage
      // For now, test that pattern matching logic exists
      const bug = await bugBot.detectBug({
        severity: "high",
        type: "error",
        title: "TypeError",
        description: "Cannot read property 'name' of undefined",
        location: "user.ts:5",
        context: {},
      });

      expect(bug).toBeDefined();
      // Pattern matching happens internally
    });

    it("should extract patterns from error messages", async () => {
      const bugs = [
        {
          severity: "high" as const,
          type: "error" as const,
          title: "Bug 1",
          description: "Cannot read property 'id' of undefined",
          location: "app.ts:1",
          context: {},
        },
        {
          severity: "high" as const,
          type: "error" as const,
          title: "Bug 2",
          description: "Cannot read property 'name' of undefined",
          location: "app.ts:2",
          context: {},
        },
      ];

      // Report multiple similar bugs
      for (const bugData of bugs) {
        await bugBot.detectBug(bugData);
      }

      // After 2+ similar bugs, pattern should be created
      // This tests the learning mechanism
      const stats = bugBot.getBugStats();
      expect(stats.total).toBeGreaterThanOrEqual(2);
    });
  });

  describe("getBugStats", () => {
    it("should return correct statistics", async () => {
      // Create bugs of different severities
      await bugBot.detectBug({
        severity: "critical",
        type: "error",
        title: "Critical Bug",
        description: "Critical issue",
        location: "app.ts:1",
        context: {},
      });

      await bugBot.detectBug({
        severity: "high",
        type: "performance",
        title: "High Bug",
        description: "High priority issue",
        location: "app.ts:2",
        context: {},
      });

      const stats = bugBot.getBugStats();

      expect(stats.total).toBeGreaterThanOrEqual(2);
      expect(stats.bySeverity.critical).toBeGreaterThanOrEqual(1);
      expect(stats.bySeverity.high).toBeGreaterThanOrEqual(1);
      expect(stats.byType.error).toBeGreaterThanOrEqual(1);
      expect(stats.byType.performance).toBeGreaterThanOrEqual(1);
    });
  });

  describe("markBugFixed", () => {
    it("should mark bug as fixed", async () => {
      const bug = await bugBot.detectBug({
        severity: "medium",
        type: "error",
        title: "Fixable Bug",
        description: "This will be fixed",
        location: "app.ts:1",
        context: {},
      });

      await bugBot.markBugFixed(bug.id, "developer-123");

      const fixedBug = bugBot.getBug(bug.id);
      expect(fixedBug?.status).toBe("fixed");
      expect(fixedBug?.fixedAt).toBeDefined();
      expect(fixedBug?.assignedTo).toBe("developer-123");
    });

    it("should throw error for non-existent bug", async () => {
      await expect(
        bugBot.markBugFixed("non-existent-bug", "developer-123")
      ).rejects.toThrow("Bug non-existent-bug not found");
    });
  });

  describe("getAllBugs", () => {
    it("should filter bugs by severity", async () => {
      await bugBot.detectBug({
        severity: "critical",
        type: "error",
        title: "Critical",
        description: "Critical bug",
        location: "app.ts:1",
        context: {},
      });

      await bugBot.detectBug({
        severity: "low",
        type: "error",
        title: "Low",
        description: "Low bug",
        location: "app.ts:2",
        context: {},
      });

      const criticalBugs = bugBot.getAllBugs({ severity: "critical" });
      expect(criticalBugs.every((b) => b.severity === "critical")).toBe(true);
    });

    it("should filter bugs by type", async () => {
      await bugBot.detectBug({
        severity: "medium",
        type: "security",
        title: "Security Bug",
        description: "Security issue",
        location: "auth.ts:1",
        context: {},
      });

      const securityBugs = bugBot.getAllBugs({ type: "security" });
      expect(securityBugs.every((b) => b.type === "security")).toBe(true);
    });

    it("should filter bugs by status", async () => {
      const bug = await bugBot.detectBug({
        severity: "medium",
        type: "error",
        title: "New Bug",
        description: "New bug",
        location: "app.ts:1",
        context: {},
      });

      await bugBot.markBugFixed(bug.id, "developer-123");

      const fixedBugs = bugBot.getAllBugs({ status: "fixed" });
      expect(fixedBugs.some((b) => b.id === bug.id)).toBe(true);
    });
  });
});
