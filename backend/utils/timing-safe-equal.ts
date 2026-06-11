import crypto from "crypto";

/**
 * Constant-time comparison of two secret strings.
 *
 * crypto.timingSafeEqual throws on length mismatch and would itself leak length
 * via the throw, so we hash both inputs to a fixed-width digest first. This keeps
 * the comparison both constant-time AND length-safe — a mismatched length is
 * indistinguishable from a mismatched value to the caller.
 */
export function timingSafeEqualStr(
  a: string | string[] | undefined | null,
  b: string | undefined | null,
): boolean {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const ah = crypto.createHash("sha256").update(a).digest();
  const bh = crypto.createHash("sha256").update(b).digest();
  return crypto.timingSafeEqual(ah, bh);
}
