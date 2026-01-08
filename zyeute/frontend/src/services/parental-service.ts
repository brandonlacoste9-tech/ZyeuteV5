import { User } from "@shared/schema";
import { getParentalControls } from "@/services/api";

export interface ParentalControls {
  dailyKarmaLimit: number;
  curfewStart: string; // "20:00"
  curfewEnd: string; // "07:00"
  schoolMode: boolean;
  homeLat?: number;
  homeLng?: number;
  allowedRadiusMeters?: number;
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
  homeLat: 45.5017, // Montreal
  homeLng: -73.5673,
  allowedRadiusMeters: 500,
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
   * Fetches current controls (Uses API if available, falls back to mock)
   */
  static async getControls(childId: string): Promise<ParentalControls> {
    try {
      const data = await getParentalControls(childId);
      if (data) return data as ParentalControls;
    } catch (e) {
      console.warn("[ParentalService] API fetch failed, using mock", e);
    }
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

  /**
   * Checks if a child is allowed to play based on current conditions
   */
  static async checkParentalStatus(childId: string): Promise<{
    allowed: boolean;
    reason?: string;
  }> {
    console.log(`[Mock] Checking parental status for ${childId}`);
    const controls = await this.getControls(childId);
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, "0")}:${now
      .getMinutes()
      .toString()
      .padStart(2, "0")}`;

    // 1. Check Curfew
    if (controls.curfewStart && controls.curfewEnd) {
      const { curfewStart, curfewEnd } = controls;
      let isInsideCurfew = false;

      if (curfewStart > curfewEnd) {
        // Overnight curfew (e.g. 21:00 to 07:00)
        isInsideCurfew = currentTime >= curfewStart || currentTime < curfewEnd;
      } else {
        // Same day curfew
        isInsideCurfew = currentTime >= curfewStart && currentTime < curfewEnd;
      }

      if (isInsideCurfew) {
        return {
          allowed: false,
          reason: "COUVR_FEU: C'est l'heure de dodo! 😴",
        };
      }
    }

    // 2. Check Geo-fencing (Mock)
    // In a real app, this would compare browser geolocation with homeLat/homeLng
    if (controls.homeLat && controls.homeLng && controls.allowedRadiusMeters) {
      const isOutside = Math.random() > 0.9; // 10% chance to be "outside" for demo
      if (isOutside) {
        return {
          allowed: false,
          reason: "HONEY_FENCE: Tu n'es pas dans ta ruche! 🐝🏠",
        };
      }
    }

    return { allowed: true };
  }
}
