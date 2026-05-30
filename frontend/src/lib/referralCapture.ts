const KEY = "zyeute_referral_code";

/** Call once on app boot; stores ?ref= for signup / analytics. */
export function captureReferralFromUrl(): void {
  try {
    const ref = new URLSearchParams(window.location.search).get("ref");
    if (ref && ref.length <= 64 && /^[a-zA-Z0-9_-]+$/.test(ref)) {
      sessionStorage.setItem(KEY, ref);
    }
  } catch {
    /* ignore */
  }
}

export function getStoredReferralCode(): string | null {
  try {
    return sessionStorage.getItem(KEY);
  } catch {
    return null;
  }
}
