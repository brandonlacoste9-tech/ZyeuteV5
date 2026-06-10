import { supabaseAdmin } from "./supabase-auth.js";

export const DEFAULT_TOKEN_BALANCE = 1000;

export function getSupabaseAdmin() {
  if (!supabaseAdmin) {
    throw new Error("Supabase admin client not configured");
  }
  return supabaseAdmin;
}

export interface ProfileRow {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
}

export async function fetchProfilesByIds(
  userIds: string[],
): Promise<Map<string, ProfileRow>> {
  const unique = [...new Set(userIds.filter(Boolean))];
  if (!unique.length) return new Map();

  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("user_profiles")
    .select("id, username, display_name, avatar_url")
    .in("id", unique);
  if (error) throw new Error(error.message);

  return new Map((data ?? []).map((row) => [row.id, row as ProfileRow]));
}

export async function ensureTokenWallet(userId: string): Promise<void> {
  const admin = getSupabaseAdmin();
  const { data: existing } = await admin
    .from("user_wallets")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (existing) return;

  const { error } = await admin
    .from("user_wallets")
    .insert({ user_id: userId, token_balance: DEFAULT_TOKEN_BALANCE });
  if (error && error.code !== "23505") throw new Error(error.message);
}

export async function getTokenBalance(userId: string): Promise<number> {
  await ensureTokenWallet(userId);
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("user_wallets")
    .select("token_balance")
    .eq("user_id", userId)
    .single();
  if (error) throw new Error(error.message);
  return Number(data.token_balance ?? DEFAULT_TOKEN_BALANCE);
}

/** Arcade pity refill — matches the "1000 jetons gratuits" copy when broke. */
export async function ensurePlayableTokenBalance(
  userId: string,
  minBalance = 100,
): Promise<number> {
  const balance = await getTokenBalance(userId);
  if (balance >= minBalance) return balance;

  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("user_wallets")
    .update({
      token_balance: DEFAULT_TOKEN_BALANCE,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .select("token_balance")
    .single();
  if (error) throw new Error(error.message);
  return Number(data?.token_balance ?? DEFAULT_TOKEN_BALANCE);
}

export async function deductTokenBalance(
  userId: string,
  amount: number,
): Promise<void> {
  if (amount <= 0) return;
  await ensureTokenWallet(userId);
  const admin = getSupabaseAdmin();
  const { data: wallet, error: readErr } = await admin
    .from("user_wallets")
    .select("token_balance")
    .eq("user_id", userId)
    .single();
  if (readErr) throw new Error(readErr.message);

  const balance = Number(wallet.token_balance ?? 0);
  if (balance < amount) {
    throw new Error(
      "Pas assez de jetons! Tu repartiras avec 1000 jetons gratuits.",
    );
  }

  const { error: updateErr } = await admin
    .from("user_wallets")
    .update({
      token_balance: balance - amount,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .gte("token_balance", amount);
  if (updateErr) throw new Error(updateErr.message);
}

export async function creditTokenBalance(
  userId: string,
  amount: number,
): Promise<number> {
  if (amount <= 0) return getTokenBalance(userId);
  await ensureTokenWallet(userId);
  const admin = getSupabaseAdmin();
  const balance = await getTokenBalance(userId);
  const { data, error } = await admin
    .from("user_wallets")
    .update({
      token_balance: balance + amount,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .select("token_balance")
    .single();
  if (error) throw new Error(error.message);
  return Number(data?.token_balance ?? balance + amount);
}

export async function transferCashCredits(
  senderId: string,
  receiverId: string,
  amount: number,
): Promise<boolean> {
  const admin = getSupabaseAdmin();
  const { data: sender, error: senderErr } = await admin
    .from("user_profiles")
    .select("cash_credits")
    .eq("id", senderId)
    .single();
  if (senderErr || !sender) return false;

  const senderBalance = Number(sender.cash_credits ?? 0);
  if (senderBalance < amount) return false;

  const { data: receiver, error: receiverErr } = await admin
    .from("user_profiles")
    .select("cash_credits")
    .eq("id", receiverId)
    .single();
  if (receiverErr || !receiver) return false;

  const receiverBalance = Number(receiver.cash_credits ?? 0);

  const { error: debitErr } = await admin
    .from("user_profiles")
    .update({ cash_credits: senderBalance - amount })
    .eq("id", senderId)
    .gte("cash_credits", amount);
  if (debitErr) return false;

  const { error: creditErr } = await admin
    .from("user_profiles")
    .update({ cash_credits: receiverBalance + amount })
    .eq("id", receiverId);
  if (creditErr) {
    await admin
      .from("user_profiles")
      .update({ cash_credits: senderBalance })
      .eq("id", senderId);
    return false;
  }

  return true;
}
