/**
 * Guardian Core
 * Oversees safety, budget, and moderation
 */

export class GuardianCore {
  // Stub implementation
  async checkSafety(content: string): Promise<boolean> {
    return true;
  }

  async checkBudget(cost: number): Promise<boolean> {
    return true;
  }
}

export const guardian = new GuardianCore();
