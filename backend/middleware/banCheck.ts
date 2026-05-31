/**
 * Ban Check Middleware
 * Blocks banned users from posting, commenting, uploading, DMing
 */
import type { Request, Response, NextFunction } from "express";
import { supabaseAdmin } from "../supabase-auth.js";

export async function banCheck(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const userId = (req as any).userId;
  if (!userId || !supabaseAdmin) {
    next();
    return;
  }

  try {
    const { data } = await supabaseAdmin
      .from("user_strikes")
      .select("ban_until, is_permanent_ban")
      .eq("user_id", userId)
      .single();

    if (!data) {
      next();
      return;
    }

    if (data.is_permanent_ban) {
      res
        .status(403)
        .json({
          error:
            "Compte banni définitivement. Contactez zyeutequebec@gmail.com pour faire appel.",
          banned: true,
        });
      return;
    }

    if (data.ban_until && new Date(data.ban_until) > new Date()) {
      const until = new Date(data.ban_until).toLocaleDateString("fr-CA");
      res
        .status(403)
        .json({
          error: `Compte suspendu jusqu'au ${until}. Contactez zyeutequebec@gmail.com pour faire appel.`,
          banned: true,
          ban_until: data.ban_until,
        });
      return;
    }

    next();
  } catch {
    // Fail open — don't block users if DB is unavailable
    next();
  }
}
