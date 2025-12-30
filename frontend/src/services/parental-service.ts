import { User } from "@shared/schema";

export interface ParentalControls {
  dailyKarmaLimit: number;
  curfewStart: string; // "20:00"
  curfewEnd: string; // "07:00"
  schoolMode: boolean;
}

export interface ActivityStats {
  screenTimeMinutes: number;
  karmaEarned: number;
  activeStreak: number;
  topApp: string;
}

// Mock Data Store
let MOCK_CONTROLS: ParentalControls = {
  dailyKarmaLimit: 100,
  curfewStart: "20:00",
  curfewEnd: "07:00",
  schoolMode: false,
};

const MOCK_STATS: ActivityStats = {
  screenTimeMinutes: 145,
  karmaEarned: 50,
  activeStreak: 12,
  topApp: "Zyeuté Arcade",
};

const MOCK_CHILD: Partial<User> = {
  id: "child-123",
  username: "Kevin_Junior",
  avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Kevin",
  credits: 450,
};

export class ParentalService {
  /**
   * Simulates linking a child account by email/username
   */
  static async linkChild(identifier: string): Promise<Partial<User>> {
    console.log(`[Mock] Linking child: ${identifier}`);
    await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate network delay
    return MOCK_CHILD;
  }

  /**
   * Simulates fetching current controls
   */
  static async getControls(childId: string): Promise<ParentalControls> {
    console.log(`[Mock] Fetching controls for ${childId}`);
    await new Promise((resolve) => setTimeout(resolve, 500));
    return { ...MOCK_CONTROLS };
  }

  /**
   * Simulates updating controls
   */
  static async updateControls(
    childId: string,
    controls: ParentalControls,
  ): Promise<void> {
    console.log(`[Mock] Updating controls for ${childId}`, controls);
    await new Promise((resolve) => setTimeout(resolve, 800));
    MOCK_CONTROLS = { ...controls };
  }

  /**
   * Simulates fetching activity stats
   */
  static async getChildActivity(childId: string): Promise<ActivityStats> {
    console.log(`[Mock] Fetching stats for ${childId}`);
    return MOCK_STATS;
  }
}
