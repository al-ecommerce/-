/**
 * Community Page
 * ─────────────────────────────────────────────────
 * Combines:
 *   • Safety Tips for buyers and sellers
 *   • Eco-friendly packaging guide for sellers
 *   • Seasonal/holiday banners
 *   • Split payment explainer
 */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// ── SEASONAL BANNER ────────────────────────────────────────
const CAMPAIGNS = [
  {
    id: "default",
    title: "Trade Safely on ASVAN",
    sub: "Escrow protection on every order. Zero risk for buyers and sellers.",
    emoji: "🛡️",
    gradient: "linear-gradient(135deg, #0A0F1E 0%, #1a2560 100%)",
    active: true,
  },
  {
    id: "christmas",
    title: "🎄 Christmas Deals Are Here",
    sub: "Shop festive gifts from verified sellers. Delivered safely.",
    emoji: "🎁",
    gradient: "linear-gradient(135deg, #7f1d1d 0%, #991b1b 100%)",
    active: new Date().getMonth() === 11, // December
  },
  {
    id: "valentine",
    title: "💝 Valentine's Day Gifts",
    sub: "Find the perfect gift. Secure checkout. Fast delivery.",
    emoji: "❤️",
    gradient: "linear-gradient(135deg, #831843 0%, #9d174d 100%)",
    active: new Date().getMonth() === 1 && new Date().getDate() <= 14,
  },
  {
    id: "newYear",
    title: "🎆 New Year, New Deals",
    sub: "Start the year right. Exclusive offers from top sellers.",
    emoji: "✨",
    gradient: "linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)",
    active: new Date().getMonth() === 0 && new Date().getDate() <= 7,
  },
];

const activeCampaign = CAMPAIGNS.find(c => c.active) || CAMPAIGNS[0];

const SAFETY_BUYERS = [
  { icon: "🔒", title: "Always pay through ASVAN", desc: "Never pay directly to a seller outside the platform. ASVAN escrow protects every transaction." },
  { icon: "📸", title: "Photograph items on receipt", desc: "Take photos immediately when you receive any item. This is your evidence if there is a dispute." },
  { icon: "✅", title: "Confirm ONLY after checking", desc: "Inspect the item fully before clicking Confirm Delivery. You cannot undo confirmation." },
  { icon: "⚠️", title: "Report problems within 7 days", desc: "You have 7 days from delivery confirmation to raise a dispute. After that, funds are released permanently." },
  { icon: "🎬", title: "Record unboxing for disputes", desc: "Video evidence is the strongest proof in any dispute. Record when opening high-value items." },
  { icon: "🚫", title: "Never share personal details", desc: "Do not share your bank account, MoMo PIN, or password with any seller or third party." },
  { icon: "💬", title: "Use in-app chat only", desc: "Keep all communication on ASVAN. Chat records are saved and used in dispute resolution." },
  { icon: "⭐", title: "Check seller ratings first", desc: "Review seller ratings, reviews, and badges before ordering. Verified sellers have passed identity checks." },
];

const SAFETY_SELLERS = [
  { icon: "📦", title: "Package items securely", desc: "Use bubble wrap, padding, or strong boxes. Damaged items lead to disputes and refunds." },
  { icon: "📷", title: "Photograph before shipping", desc: "Take clear photos of the item and packaging before handing to the courier. This protects you in disputes." },
  { icon: "🚚", title: "Use trackable delivery", desc: "Always use delivery options that provide tracking. This is your proof of shipment." },
  { icon: "💬", title: "Communicate delays early", desc: "If you cannot deliver on time, tell the buyer immediately via chat. This prevents disputes." },
  { icon: "🎯", title: "List accurately", desc: "Only list what you physically have. Cancelling orders due to stock issues earns strikes on your account." },
  { icon: "🔏", title: "Never ask for off-platform payment", desc: "Never ask buyers to pay outside ASVAN. This will result in account suspension." },
  { icon: "🤝", title: "Respond within 24 hours", desc: "Fast responses build your rating and unlock the Fast Responder badge." },
  { icon: "📜", title: "Keep your listings updated", desc: "Update stock, prices and availability regularly. Stale listings frustrate buyers and hurt your rating." },
];

const ECO_TIPS = [
  { icon: "♻️", title: "Reuse packaging materials", desc: "Save boxes and bubble wrap from deliveries you receive. Reusing packaging reduces waste and cuts costs." },
  { icon: "📰", title: "Use newspaper as padding", desc: "Old newspapers make excellent padding and are completely biodegradable." },
  { icon: "🌿", title: "Avoid excessive plastic", desc: "Use paper tape instead of plastic tape. Use paper bags instead of plastic bags where possible." },
  { icon: "📦", title: "Right-size your packaging", desc: "Use the smallest box that safely fits your item. Oversized packaging wastes materials and increases delivery cost." },
  { icon: "🌱", title: "Offer eco packaging as a selling point", desc: "Add \"Eco-packaged\" to your listing title. Many buyers actively prefer eco-conscious sellers." },
  { icon: "💧", title: "Avoid single-use plastics", desc: "Use cornstarch peanuts or shredded paper instead of styrofoam. They protect items and decompose safely." },
];

const SPLIT_PAYMENT_HOW = [
  { n: "1", t: "Agree on the split", d: "Your group agrees on who pays what portion before ordering." },
  { n: "2", t: "Each person tops up wallet", d: "Every group member adds their share to their ASVAN wallet via MoMo." },
  { n: "3", t: "Organiser places the order", d: "One person places the order. Their wallet is charged the full amount." },
  { n: "4", t: "Transfer shares", d: "Use Wallet → Transfer to send your share to the organiser's wallet before they order. (Coming Soon: group order feature)" },
];

const SectionCard = ({ icon, title, desc }) => (
  <div style={{
    display: "flex", gap: 14, padding: "14px 16px",
    background: "var(--surface)", border: "1px solid var(--border)",
    borderRadius: "var(--radius-lg)", alignItems: "flex-start",
  }}>
    <div style={{ fontSize: 24, flexShrink: 0, marginTop: 2 }}>{icon}</div>
    <div>
      <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6 }}>{desc}</div>
    </div>
  </div>
);

const TABS = [
  { key: "buyer_safety",  label: "🛡 Buyer Safety" },
  { key: "seller_safety", label: "🏪 Seller Safety" },
  { key: "eco",           label: "🌿 Eco Packaging" },
  { key: "split",         label: "👥 Group Payments" },
];

export default function Community() {
  const navigate  = useNavigate();
  const { currentUser } = useAuth();
  const [tab, setTab] = useState("buyer_safety");

  return (
    <div className="page-wrapper">
      {/* Seasonal banner */}
      <div style={{
        background: activeCampaign.gradient,
        padding: "36px 0 40px", textAlign: "center", color: "#fff",
      }}>
        <div className="container" style={{ maxWidth: 640 }}>
          <div style={{ fontSize: 48, marginBottom: 10 }}>{activeCampaign.emoji}</div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 700, marginBottom: 10 }}>
            {activeCampaign.title}
          </h1>
          <p style={{ opacity: 0.8, fontSize: 16, marginBottom: 24 }}>{activeCampaign.sub}</p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <button onClick={() => navigate("/products")} style={{ padding: "11px 24px", background: "#fff", color: "#0A0F1E", border: "none", borderRadius: "var(--radius-sm)", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
              Browse Products
            </button>
            <button onClick={() => navigate("/policy")} style={{ padding: "11px 24px", background: "transparent", color: "#fff", border: "1.5px solid rgba(255,255,255,0.35)", borderRadius: "var(--radius-sm)", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
              Platform Policy
            </button>
          </div>
        </div>
      </div>

      <div className="container" style={{ paddingTop: 32, maxWidth: 840 }}>

        {/* Tab bar */}
        <div style={{ display: "flex", gap: 4, borderBottom: "2px solid var(--border)", marginBottom: 28, overflowX: "auto" }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              padding: "10px 18px", border: "none", background: "none", cursor: "pointer",
              fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 14, whiteSpace: "nowrap",
              color: tab === t.key ? "var(--accent)" : "var(--text-muted)",
              borderBottom: `2px solid ${tab === t.key ? "var(--accent)" : "transparent"}`,
              marginBottom: -2, transition: "all 0.15s",
            }}>{t.label}</button>
          ))}
        </div>

        {/* Buyer Safety */}
        {tab === "buyer_safety" && (
          <div>
            <div style={{ marginBottom: 20 }}>
              <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 22 }}>Safety Tips for Buyers</h2>
              <p style={{ color: "var(--text-muted)", fontSize: 14, marginTop: 4 }}>
                Follow these guidelines to protect yourself on every transaction.
              </p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 12 }}>
              {SAFETY_BUYERS.map(s => <SectionCard key={s.title} {...s} />)}
            </div>
          </div>
        )}

        {/* Seller Safety */}
        {tab === "seller_safety" && (
          <div>
            <div style={{ marginBottom: 20 }}>
              <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 22 }}>Safety Tips for Sellers</h2>
              <p style={{ color: "var(--text-muted)", fontSize: 14, marginTop: 4 }}>
                Build trust, avoid disputes, and grow your store reliably.
              </p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 12 }}>
              {SAFETY_SELLERS.map(s => <SectionCard key={s.title} {...s} />)}
            </div>
          </div>
        )}

        {/* Eco packaging */}
        {tab === "eco" && (
          <div>
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(5,150,105,0.1)", border: "1px solid rgba(5,150,105,0.2)", borderRadius: 20, padding: "4px 14px", marginBottom: 12 }}>
                <span style={{ fontSize: 12, color: "var(--success)", fontWeight: 700 }}>🌍 SUSTAINABILITY</span>
              </div>
              <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 22 }}>Eco-Friendly Packaging Guide</h2>
              <p style={{ color: "var(--text-muted)", fontSize: 14, marginTop: 4 }}>
                Simple swaps that protect your items and the environment — often at lower cost.
              </p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 12 }}>
              {ECO_TIPS.map(s => <SectionCard key={s.title} {...s} />)}
            </div>
            <div style={{ marginTop: 20, padding: "16px 20px", background: "rgba(5,150,105,0.07)", border: "1px solid rgba(5,150,105,0.2)", borderRadius: "var(--radius-lg)", fontSize: 14, color: "#065f46", lineHeight: 1.7 }}>
              🌱 <strong>ASVAN Eco Badge (Coming Soon)</strong> — Sellers who adopt eco-friendly packaging and receive positive eco reviews will earn a special green badge visible on all their listings.
            </div>
          </div>
        )}

        {/* Split payments */}
        {tab === "split" && (
          <div>
            <div style={{ marginBottom: 20 }}>
              <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 22 }}>Group / Split Payments</h2>
              <p style={{ color: "var(--text-muted)", fontSize: 14, marginTop: 4 }}>
                Buying with friends? Here is how to split the cost using ASVAN wallets.
              </p>
            </div>

            {/* How it works steps */}
            <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 28 }}>
              {SPLIT_PAYMENT_HOW.map(s => (
                <div key={s.n} style={{ display: "flex", gap: 14, padding: "16px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)" }}>
                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--accent)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 14, flexShrink: 0 }}>{s.n}</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{s.t}</div>
                    <div style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6 }}>{s.d}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Wallet CTA */}
            <div style={{ background: "linear-gradient(135deg, var(--accent), #6B48FF)", borderRadius: "var(--radius-xl)", padding: "24px 28px", color: "#fff" }}>
              <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18, marginBottom: 8 }}>Top Up Your Wallet First</h3>
              <p style={{ opacity: 0.85, fontSize: 14, marginBottom: 16 }}>
                Each group member needs to have their share ready in their ASVAN wallet. Top up takes just a minute via MoMo.
              </p>
              <button onClick={() => navigate("/momo-payment")} style={{ padding: "10px 22px", background: "#fff", color: "var(--accent)", border: "none", borderRadius: "var(--radius-sm)", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                Top Up Wallet →
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
