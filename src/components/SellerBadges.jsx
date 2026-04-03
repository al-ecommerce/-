/**
 * Seller Badges + Buyer Badges
 * ─────────────────────────────────────────────────
 * Computed from user data. No extra DB reads needed.
 */

// ── SELLER BADGES ─────────────────────────────────────────
const SELLER_BADGES = [
  {
    id: "verified",
    icon: "✓",
    label: "Verified Seller",
    desc: "Identity verified by ASVAN",
    color: "#059669",
    bg: "rgba(5,150,105,0.12)",
    check: (u) => u.isSellerVerified,
  },
  {
    id: "top_performer",
    icon: "🏆",
    label: "Top Performer",
    desc: "High sales volume & ratings",
    color: "#D97706",
    bg: "rgba(217,119,6,0.12)",
    check: (u) => (u.totalSales || 0) >= 20 && (u.avgRating || 0) >= 4.5,
  },
  {
    id: "long_standing",
    icon: "🎖️",
    label: "Long-standing Seller",
    desc: "Member for over 6 months",
    color: "#7C3AED",
    bg: "rgba(124,58,237,0.12)",
    check: (u) => {
      if (!u.sellerSince && !u.createdAt) return false;
      const since = new Date(u.sellerSince || u.createdAt);
      const months = (Date.now() - since) / (1000 * 60 * 60 * 24 * 30);
      return months >= 6;
    },
  },
  {
    id: "fast_responder",
    icon: "⚡",
    label: "Fast Responder",
    desc: "Responds to buyers quickly",
    color: "#2563EB",
    bg: "rgba(37,99,235,0.12)",
    check: (u) => (u.responseRate || 0) >= 90,
  },
];

// ── BUYER BADGES ──────────────────────────────────────────
const BUYER_BADGES = [
  {
    id: "loyal",
    icon: "💎",
    label: "Loyal Buyer",
    desc: "Made 10+ purchases on ASVAN",
    color: "#1A56DB",
    bg: "rgba(26,86,219,0.12)",
    check: (u) => (u.totalPurchases || 0) >= 10,
  },
  {
    id: "top_spender",
    icon: "👑",
    label: "Top Spender",
    desc: "Spent GHS 1,000+ on ASVAN",
    color: "#D97706",
    bg: "rgba(217,119,6,0.12)",
    check: (u) => (u.totalSpent || 0) >= 1000,
  },
  {
    id: "early_adopter",
    icon: "🚀",
    label: "Early Adopter",
    desc: "Joined in the first year",
    color: "#059669",
    bg: "rgba(5,150,105,0.12)",
    check: (u) => {
      if (!u.createdAt) return false;
      const joined = new Date(u.createdAt);
      // "Early adopter" = joined before 2026
      return joined.getFullYear() < 2026;
    },
  },
  {
    id: "no_strikes",
    icon: "🛡️",
    label: "Trusted Buyer",
    desc: "Zero strikes on record",
    color: "#059669",
    bg: "rgba(5,150,105,0.08)",
    check: (u) => (u.strikes || 0) === 0 && (u.totalPurchases || 0) >= 3,
  },
];

// ── BADGE PILL COMPONENT ──────────────────────────────────
const BadgePill = ({ badge, size = "sm" }) => (
  <div
    title={badge.desc}
    style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      background: badge.bg, border: `1px solid ${badge.color}30`,
      borderRadius: 20,
      padding: size === "lg" ? "6px 14px" : "3px 10px",
      fontSize: size === "lg" ? 13 : 11,
      color: badge.color, fontWeight: 700,
      whiteSpace: "nowrap",
    }}
  >
    <span>{badge.icon}</span>
    {badge.label}
  </div>
);

// ── PUBLIC EXPORTS ─────────────────────────────────────────
/** Returns earned seller badges for a user doc */
export const getSellerBadges = (userDoc) =>
  SELLER_BADGES.filter(b => b.check(userDoc || {}));

/** Returns earned buyer badges for a user doc */
export const getBuyerBadges = (userDoc) =>
  BUYER_BADGES.filter(b => b.check(userDoc || {}));

/** Renders badge pills inline */
export const SellerBadgeList = ({ userDoc, size = "sm" }) => {
  const badges = getSellerBadges(userDoc);
  if (!badges.length) return null;
  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
      {badges.map(b => <BadgePill key={b.id} badge={b} size={size} />)}
    </div>
  );
};

export const BuyerBadgeList = ({ userDoc, size = "sm" }) => {
  const badges = getBuyerBadges(userDoc);
  if (!badges.length) return null;
  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
      {badges.map(b => <BadgePill key={b.id} badge={b} size={size} />)}
    </div>
  );
};
