import { Router } from "express";
import axios from "axios";
import { db } from "../storage.js";
import { users } from "../../shared/schema.js";
import { eq, sql } from "drizzle-orm";

const router = Router();

const requireAuth = (req: any, res: any, next: any) => {
  if (!req.userId) return res.status(401).json({ error: "Non autorisé" });
  next();
};

router.get("/rss", async (req, res) => {
  try {
    const category = (req.query.category as string) || "action";
    let catFilter = "";
    
    if (category === "puzzle") catFilter = "Puzzle,Cards,Board,Jigsaw,Match-3";
    else if (category === "action") catFilter = "Action,Shooter,Battle,Adventure";
    else if (category === "casual") catFilter = "Casual,Bubble Shooter,Merge,.IO";
    else if (category === "course") catFilter = "Racing %26 Driving";
    else catFilter = "Action,Shooter"; // fallback

    // Add a cache buster timestamp so Vercel doesn't heavily cache across tabs
    const cacheBuster = Date.now();
    const url = `https://catalog.api.gamedistribution.com/api/v2.0/rss/All/?collection=all&categories=${catFilter}&type=html5&amount=48&page=1&format=json&cb=${cacheBuster}`;
    const response = await axios.get(url, { timeout: 8000 });
    res.json(response.data);
  } catch (error: any) {
    console.error("GameDistribution Proxy Error:", error.message);
    
    // Fallback data in case the API hangs or fails
    res.json([
      {
        Title: "Spot Differences",
        Md5: "079bd6ba427749a3bd1bae2c9c17c566",
        Description: "Spot Differences: Bird Adventure",
        Url: "https://html5.gamedistribution.com/079bd6ba427749a3bd1bae2c9c17c566/",
        Asset: ["https://img.gamedistribution.com/079bd6ba427749a3bd1bae2c9c17c566-512x384.jpg"],
        Category: ["Puzzle"]
      },
      {
        Title: "SKYHILL",
        Md5: "2f6ba268fd224e13b30c2b22bdd65606",
        Description: "Escape From the Skyscraper!",
        Url: "https://html5.gamedistribution.com/2f6ba268fd224e13b30c2b22bdd65606/",
        Asset: ["https://img.gamedistribution.com/2f6ba268fd224e13b30c2b22bdd65606-512x384.jpg"],
        Category: ["Adventure"]
      },
      {
        Title: "Football Superstars 2026",
        Md5: "dba31dd236944415a71960309ff0d1c3",
        Description: "Ready for your next football challenge?",
        Url: "https://html5.gamedistribution.com/dba31dd236944415a71960309ff0d1c3/",
        Asset: ["https://img.gamedistribution.com/dba31dd236944415a71960309ff0d1c3-512x384.jpg"],
        Category: ["Football"]
      },
      {
        Title: "Bubble Blasters",
        Md5: "5d8d11e9919245939a57378a02b8fc8b",
        Description: "Bubble Blasters is a colorful side-scrolling adventure",
        Url: "https://html5.gamedistribution.com/5d8d11e9919245939a57378a02b8fc8b/",
        Asset: ["https://img.gamedistribution.com/5d8d11e9919245939a57378a02b8fc8b-512x384.jpg"],
        Category: ["Adventure"]
      }
    ]);
  }
});

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";
const supabaseRest = SUPABASE_URL && SUPABASE_KEY ? createClient(SUPABASE_URL, SUPABASE_KEY) : null;

router.post("/claim", requireAuth, async (req: any, res: any) => {
  try {
    const userId = req.userId!;
    
    // Credit 10 Piasses (cashCredits)
    await db
      .update(users)
      .set({ cashCredits: sql`${users.cashCredits} + 10` })
      .where(eq(users.id, userId));

    const result = await db
      .select({ cashCredits: users.cashCredits })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const newBalance = result[0]?.cashCredits ?? 0;

    res.json({
      success: true,
      amount: 10,
      newBalance
    });
  } catch (error: any) {
    console.error("GameDistribution Claim Error:", error.message);
    res.status(500).json({ error: "Impossible de réclamer les jetons." });
  }
});

router.get("/playtime", requireAuth, async (req: any, res: any) => {
  try {
    const userId = req.userId!;
    let playtime = 0;

    try {
      // 1. Try Drizzle direct query
      const result = await db
        .select({ arcadePlaytime: users.arcadePlaytime })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);
      playtime = result[0]?.arcadePlaytime ?? 0;
    } catch (dbErr) {
      console.warn("[gamedistribution.getPlaytime] Drizzle failed, using Supabase REST fallback:", (dbErr as Error).message);
      // 2. Fallback to Supabase REST client
      if (supabaseRest) {
        const { data, error } = await supabaseRest
          .from("user_profiles")
          .select("arcade_playtime")
          .eq("id", userId)
          .maybeSingle();
        if (!error && data) {
          playtime = data.arcade_playtime ?? 0;
        }
      }
    }

    res.json({ playtime });
  } catch (error: any) {
    console.error("GameDistribution Get Playtime Error:", error.message);
    res.status(500).json({ error: "Impossible de récupérer le temps de jeu." });
  }
});

router.post("/playtime", requireAuth, async (req: any, res: any) => {
  try {
    const userId = req.userId!;
    const { seconds } = req.body;
    const increment = Math.min(Math.max(Number(seconds) || 0, 0), 60); // sanitize to avoid malicious jumps

    let playtime = 0;
    let updated = false;

    try {
      // 1. Try Drizzle update
      await db
        .update(users)
        .set({ arcadePlaytime: sql`${users.arcadePlaytime} + ${increment}` })
        .where(eq(users.id, userId));

      const result = await db
        .select({ arcadePlaytime: users.arcadePlaytime })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);
      playtime = result[0]?.arcadePlaytime ?? 0;
      updated = true;
    } catch (dbErr) {
      console.warn("[gamedistribution.incrementPlaytime] Drizzle failed, using Supabase REST fallback:", (dbErr as Error).message);
      // 2. Fallback to Supabase REST client
      if (supabaseRest) {
        // Fetch current playtime first
        const { data: fetchResult, error: fetchErr } = await supabaseRest
          .from("user_profiles")
          .select("arcade_playtime")
          .eq("id", userId)
          .maybeSingle();

        if (!fetchErr && fetchResult) {
          const currentPlaytime = fetchResult.arcade_playtime ?? 0;
          const newPlaytime = currentPlaytime + increment;

          const { data: updateResult, error: updateErr } = await supabaseRest
            .from("user_profiles")
            .update({ arcade_playtime: newPlaytime })
            .eq("id", userId)
            .select("arcade_playtime")
            .maybeSingle();

          if (!updateErr && updateResult) {
            playtime = updateResult.arcade_playtime ?? 0;
            updated = true;
          }
        }
      }
    }

    if (updated) {
      res.json({ success: true, playtime });
    } else {
      res.status(500).json({ error: "Impossible de mettre à jour le temps de jeu." });
    }
  } catch (error: any) {
    console.error("GameDistribution Increment Playtime Error:", error.message);
    res.status(500).json({ error: "Impossible de mettre à jour le temps de jeu." });
  }
});

export default router;
