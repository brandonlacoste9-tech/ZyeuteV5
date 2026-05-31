/**
 * Creator Revenue Dashboard — Gifts, Stripe Connect, payouts, and stats
 * Enhanced version with live backend data from /api/creator/revenue
 */

import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { supabase } from "@/lib/supabase";

const API_BASE =
  import.meta.env.VITE_API_URL || "https://zyeute-backend.up.railway.app";

const GOLD = "#DAA520";
const DARK = "#0D0A06";

// ─────────────────────────────── TYPES ────────────────────────────────

interface GiftEntry {
  id: string;
  amount?: number;
  cenne_amount?: number;
  created_at: string;
  sender?: {
    username: string;
    avatar_url?: string;
  };
}

interface StripePayoutEntry {
  id: string;
  amount: number;
  currency: string;
  status: string;
  arrival_date: number;
}

interface RevenueData {
  totalCenneReceived: number;
  gifts: GiftEntry[];
  followerCount: number;
  totalViews: number;
  totalLikes: number;
  stripeConnectId: string | null;
  stripePayouts: StripePayoutEntry[];
  subscriptionTier: string;
}

// ─────────────────────────────── HELPERS ──────────────────────────────

function StatCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: string;
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div
      style={{
        borderRadius: 14,
        border: "1.5px solid rgba(218,165,32,0.2)",
        background: "rgba(218,165,32,0.06)",
        padding: "16px",
        display: "flex",
        flexDirection: "column",
        gap: 4,
      }}
    >
      <span style={{ fontSize: 22 }}>{icon}</span>
      <p
        style={{
          color: GOLD,
          fontSize: 24,
          fontWeight: 900,
          letterSpacing: "-0.02em",
          lineHeight: 1,
          marginTop: 6,
        }}
      >
        {value}
      </p>
      <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, marginTop: 2 }}>
        {label}
      </p>
      {sub && (
        <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 11 }}>{sub}</p>
      )}
    </div>
  );
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("fr-CA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatCurrency(amountCents: number, currency = "cad") {
  if (currency === "cad" || currency === "CAD") {
    return `${(amountCents / 100).toFixed(2)} $`;
  }
  return `${amountCents}`;
}

// ─────────────────────────────── MAIN ────────────────────────────────

export const CreatorRevenue: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [data, setData] = useState<RevenueData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "gifts" | "payouts">(
    "overview",
  );

  // Show success toast if returning from Stripe Connect
  useEffect(() => {
    if (searchParams.get("connected") === "true") {
      // Remove param from URL cleanly
      navigate("/creator/revenue", { replace: true });
    }
  }, [searchParams, navigate]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        setError("Session expirée. Reconnecte-toi.");
        return;
      }
      const res = await fetch(`${API_BASE}/api/creator/revenue`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body?.error || "Erreur de chargement des données.");
        return;
      }
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err?.message || "Erreur réseau.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleStripeConnect = async () => {
    setIsConnecting(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) return;

      const res = await fetch(`${API_BASE}/api/creator/stripe-connect`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const json = await res.json();
      if (json.url) {
        window.location.href = json.url;
      } else {
        alert(json.error || "Erreur Stripe Connect");
      }
    } catch (err: any) {
      alert(err?.message || "Erreur réseau");
    } finally {
      setIsConnecting(false);
    }
  };

  // ── LOADING / ERROR ──
  if (isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: DARK }}
      >
        <div
          style={{
            color: GOLD,
            fontSize: 16,
            fontWeight: 700,
            animation: "pulse 1.5s ease-in-out infinite",
          }}
        >
          Chargement des revenus...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center gap-4 px-6"
        style={{ backgroundColor: DARK }}
      >
        <p style={{ color: "rgba(255,80,80,0.9)", textAlign: "center" }}>
          {error}
        </p>
        <button
          onClick={loadData}
          style={{
            padding: "12px 24px",
            borderRadius: 12,
            background: "linear-gradient(135deg, #DAA520 0%, #B8860B 100%)",
            color: DARK,
            fontWeight: 800,
            border: "none",
            cursor: "pointer",
          }}
        >
          Réessayer
        </button>
      </div>
    );
  }

  // ── RENDER ──
  const d = data!;
  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: "9px 18px",
    borderRadius: 20,
    border: "none",
    background: active ? GOLD : "rgba(255,255,255,0.06)",
    color: active ? DARK : "rgba(255,255,255,0.7)",
    fontWeight: active ? 800 : 500,
    fontSize: 13,
    cursor: "pointer",
    transition: "all 0.2s",
    whiteSpace: "nowrap",
  });

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: DARK }}>
      <Header title="💰 Revenus Créateur" showBack />

      <div className="px-4 pt-4 max-w-xl mx-auto">
        {/* ── STRIPE CONNECT BANNER ── */}
        {!d.stripeConnectId && (
          <div
            style={{
              borderRadius: 14,
              border: "1.5px solid rgba(218,165,32,0.4)",
              background:
                "linear-gradient(135deg, rgba(218,165,32,0.1) 0%, rgba(184,134,11,0.06) 100%)",
              padding: "16px 20px",
              marginBottom: 20,
              display: "flex",
              alignItems: "center",
              gap: 14,
            }}
          >
            <span style={{ fontSize: 28 }}>🔗</span>
            <div style={{ flex: 1 }}>
              <p
                style={{
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: 14,
                  marginBottom: 4,
                }}
              >
                Connecte ton compte Stripe pour recevoir des paiements
              </p>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 12 }}>
                Payé mensuellement via Stripe Connect
              </p>
            </div>
            <button
              onClick={handleStripeConnect}
              disabled={isConnecting}
              style={{
                padding: "10px 16px",
                borderRadius: 10,
                background: isConnecting
                  ? "rgba(218,165,32,0.3)"
                  : "linear-gradient(135deg, #DAA520 0%, #B8860B 100%)",
                color: DARK,
                fontWeight: 800,
                fontSize: 13,
                border: "none",
                cursor: isConnecting ? "not-allowed" : "pointer",
                whiteSpace: "nowrap",
                transition: "all 0.2s",
              }}
            >
              {isConnecting ? "..." : "Connecter"}
            </button>
          </div>
        )}

        {d.stripeConnectId && (
          <div
            style={{
              borderRadius: 14,
              border: "1.5px solid rgba(34,197,94,0.3)",
              background: "rgba(34,197,94,0.07)",
              padding: "12px 16px",
              marginBottom: 20,
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <span style={{ fontSize: 20 }}>✅</span>
            <p
              style={{
                color: "rgba(34,197,94,0.9)",
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              Stripe Connect actif — Payé mensuellement via Stripe
            </p>
          </div>
        )}

        {/* ── STATS GRID ── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 12,
            marginBottom: 24,
          }}
        >
          <StatCard
            icon="🎁"
            label="Total Cennés reçus"
            value={d.totalCenneReceived.toLocaleString("fr-CA")}
            sub="Via cadeaux"
          />
          <StatCard
            icon="👥"
            label="Abonnés"
            value={d.followerCount.toLocaleString("fr-CA")}
          />
          <StatCard
            icon="👁️"
            label="Vues totales"
            value={d.totalViews.toLocaleString("fr-CA")}
          />
          <StatCard
            icon="❤️"
            label="J'aimes"
            value={d.totalLikes.toLocaleString("fr-CA")}
          />
        </div>

        {/* ── TABS ── */}
        <div
          style={{
            display: "flex",
            gap: 8,
            marginBottom: 20,
            overflowX: "auto",
          }}
        >
          <button
            style={tabStyle(activeTab === "overview")}
            onClick={() => setActiveTab("overview")}
          >
            Vue d&apos;ensemble
          </button>
          <button
            style={tabStyle(activeTab === "gifts")}
            onClick={() => setActiveTab("gifts")}
          >
            Cadeaux ({d.gifts.length})
          </button>
          {d.stripeConnectId && (
            <button
              style={tabStyle(activeTab === "payouts")}
              onClick={() => setActiveTab("payouts")}
            >
              Retraits ({d.stripePayouts.length})
            </button>
          )}
        </div>

        {/* ── OVERVIEW TAB ── */}
        {activeTab === "overview" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Subscription revenue info */}
            <div
              style={{
                borderRadius: 14,
                border: "1.5px solid rgba(218,165,32,0.15)",
                background: "rgba(255,255,255,0.02)",
                padding: "18px 20px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  marginBottom: 10,
                }}
              >
                <span style={{ fontSize: 24 }}>💎</span>
                <div>
                  <p
                    style={{
                      color: "#fff",
                      fontWeight: 700,
                      fontSize: 15,
                    }}
                  >
                    Revenus d&apos;abonnements
                  </p>
                  <p
                    style={{
                      color: "rgba(255,255,255,0.5)",
                      fontSize: 12,
                    }}
                  >
                    Payé mensuellement via Stripe Connect
                  </p>
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "10px 14px",
                  borderRadius: 10,
                  background: "rgba(218,165,32,0.07)",
                  border: "1px solid rgba(218,165,32,0.15)",
                }}
              >
                <span style={{ fontSize: 16 }}>ℹ️</span>
                <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 12 }}>
                  Connecte Stripe pour voir tes revenus d&apos;abonnements et
                  demander un retrait.
                </p>
              </div>
            </div>

            {/* Recent gifts preview */}
            {d.gifts.length > 0 && (
              <div>
                <h2
                  style={{
                    color: GOLD,
                    fontSize: 15,
                    fontWeight: 800,
                    marginBottom: 12,
                    letterSpacing: "0.03em",
                    textTransform: "uppercase",
                  }}
                >
                  Cadeaux récents
                </h2>
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 10 }}
                >
                  {d.gifts.slice(0, 3).map((g) => (
                    <GiftRow key={g.id} gift={g} />
                  ))}
                  {d.gifts.length > 3 && (
                    <button
                      onClick={() => setActiveTab("gifts")}
                      style={{
                        background: "none",
                        border: "none",
                        color: GOLD,
                        fontSize: 13,
                        fontWeight: 700,
                        cursor: "pointer",
                        padding: "6px 0",
                      }}
                    >
                      Voir tous les {d.gifts.length} cadeaux →
                    </button>
                  )}
                </div>
              </div>
            )}

            {d.gifts.length === 0 && (
              <div
                style={{
                  borderRadius: 14,
                  border: "1.5px solid rgba(218,165,32,0.1)",
                  padding: "32px 20px",
                  textAlign: "center",
                }}
              >
                <span style={{ fontSize: 40 }}>🎁</span>
                <p
                  style={{
                    color: "rgba(255,255,255,0.5)",
                    fontSize: 14,
                    marginTop: 12,
                  }}
                >
                  Aucun cadeau reçu pour l&apos;instant.
                </p>
                <p
                  style={{
                    color: "rgba(255,255,255,0.3)",
                    fontSize: 12,
                    marginTop: 6,
                  }}
                >
                  Publie du contenu pour recevoir des Cennés de tes fans!
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── GIFTS TAB ── */}
        {activeTab === "gifts" && (
          <div>
            <h2
              style={{
                color: GOLD,
                fontSize: 15,
                fontWeight: 800,
                marginBottom: 14,
                letterSpacing: "0.03em",
                textTransform: "uppercase",
              }}
            >
              Historique des cadeaux
            </h2>
            {d.gifts.length === 0 ? (
              <div
                style={{
                  borderRadius: 14,
                  border: "1.5px solid rgba(218,165,32,0.1)",
                  padding: "48px 20px",
                  textAlign: "center",
                }}
              >
                <span style={{ fontSize: 48 }}>🎁</span>
                <p
                  style={{
                    color: "rgba(255,255,255,0.5)",
                    fontSize: 14,
                    marginTop: 16,
                  }}
                >
                  Aucun cadeau reçu.
                </p>
              </div>
            ) : (
              <div
                style={{ display: "flex", flexDirection: "column", gap: 10 }}
              >
                {d.gifts.map((g) => (
                  <GiftRow key={g.id} gift={g} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── PAYOUTS TAB ── */}
        {activeTab === "payouts" && d.stripeConnectId && (
          <div>
            <h2
              style={{
                color: GOLD,
                fontSize: 15,
                fontWeight: 800,
                marginBottom: 14,
                letterSpacing: "0.03em",
                textTransform: "uppercase",
              }}
            >
              Historique des retraits
            </h2>
            {d.stripePayouts.length === 0 ? (
              <div
                style={{
                  borderRadius: 14,
                  border: "1.5px solid rgba(218,165,32,0.1)",
                  padding: "48px 20px",
                  textAlign: "center",
                }}
              >
                <span style={{ fontSize: 48 }}>💳</span>
                <p
                  style={{
                    color: "rgba(255,255,255,0.5)",
                    fontSize: 14,
                    marginTop: 16,
                  }}
                >
                  Aucun retrait effectué.
                </p>
                <p
                  style={{
                    color: "rgba(255,255,255,0.3)",
                    fontSize: 12,
                    marginTop: 6,
                  }}
                >
                  Les retraits apparaissent ici après traitement via Stripe.
                </p>
              </div>
            ) : (
              <div
                style={{
                  borderRadius: 14,
                  border: "1.5px solid rgba(218,165,32,0.15)",
                  overflow: "hidden",
                }}
              >
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr
                      style={{
                        background: "rgba(218,165,32,0.08)",
                        borderBottom: "1px solid rgba(218,165,32,0.15)",
                      }}
                    >
                      <th
                        style={{
                          color: GOLD,
                          fontSize: 11,
                          fontWeight: 700,
                          textAlign: "left",
                          padding: "10px 14px",
                          letterSpacing: "0.05em",
                          textTransform: "uppercase",
                        }}
                      >
                        Montant
                      </th>
                      <th
                        style={{
                          color: GOLD,
                          fontSize: 11,
                          fontWeight: 700,
                          textAlign: "left",
                          padding: "10px 14px",
                          letterSpacing: "0.05em",
                          textTransform: "uppercase",
                        }}
                      >
                        Statut
                      </th>
                      <th
                        style={{
                          color: GOLD,
                          fontSize: 11,
                          fontWeight: 700,
                          textAlign: "left",
                          padding: "10px 14px",
                          letterSpacing: "0.05em",
                          textTransform: "uppercase",
                        }}
                      >
                        Date d&apos;arrivée
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {d.stripePayouts.map((p, i) => (
                      <tr
                        key={p.id}
                        style={{
                          borderBottom:
                            i < d.stripePayouts.length - 1
                              ? "1px solid rgba(255,255,255,0.05)"
                              : "none",
                        }}
                      >
                        <td
                          style={{
                            padding: "12px 14px",
                            color: "#fff",
                            fontWeight: 700,
                            fontSize: 15,
                          }}
                        >
                          {formatCurrency(p.amount, p.currency)}
                        </td>
                        <td style={{ padding: "12px 14px" }}>
                          <span
                            style={{
                              fontSize: 12,
                              fontWeight: 700,
                              padding: "3px 10px",
                              borderRadius: 999,
                              background:
                                p.status === "paid"
                                  ? "rgba(34,197,94,0.15)"
                                  : p.status === "pending"
                                    ? "rgba(218,165,32,0.15)"
                                    : "rgba(255,80,80,0.15)",
                              color:
                                p.status === "paid"
                                  ? "rgba(34,197,94,0.9)"
                                  : p.status === "pending"
                                    ? GOLD
                                    : "rgba(255,80,80,0.9)",
                            }}
                          >
                            {p.status === "paid"
                              ? "Payé"
                              : p.status === "pending"
                                ? "En attente"
                                : p.status}
                          </span>
                        </td>
                        <td
                          style={{
                            padding: "12px 14px",
                            color: "rgba(255,255,255,0.5)",
                            fontSize: 13,
                          }}
                        >
                          {new Date(p.arrival_date * 1000).toLocaleDateString(
                            "fr-CA",
                            {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            },
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

// ─────────────────────────────── GIFT ROW ────────────────────────────

function GiftRow({ gift }: { gift: GiftEntry }) {
  const amount = gift.amount ?? gift.cenne_amount ?? 0;
  const username = gift.sender?.username || "Anonyme";
  const avatarSeed = gift.sender?.username || gift.id;
  const avatarUrl =
    gift.sender?.avatar_url ||
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(avatarSeed)}`;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "14px 16px",
        borderRadius: 12,
        border: "1.5px solid rgba(218,165,32,0.12)",
        background: "rgba(255,255,255,0.02)",
      }}
    >
      <img
        src={avatarUrl}
        alt={username}
        style={{
          width: 40,
          height: 40,
          borderRadius: "50%",
          objectFit: "cover",
          border: "1.5px solid rgba(218,165,32,0.25)",
          flexShrink: 0,
        }}
      />
      <div style={{ flex: 1 }}>
        <p style={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>
          @{username}
        </p>
        <p
          style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, marginTop: 2 }}
        >
          {formatDate(gift.created_at)}
        </p>
      </div>
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <p style={{ color: GOLD, fontWeight: 800, fontSize: 16 }}>
          +{amount.toLocaleString("fr-CA")}
        </p>
        <p style={{ color: "rgba(218,165,32,0.5)", fontSize: 11 }}>Cennés</p>
      </div>
    </div>
  );
}

export default CreatorRevenue;
