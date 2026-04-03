/**
 * ShareProduct
 * ─────────────────────────────────────────────────
 * Share product links to social media.
 * Also generates shareable digital receipts.
 */
import { useState } from "react";
import { toast } from "./UI";

const PLATFORMS = [
  {
    id: "whatsapp",
    label: "WhatsApp",
    icon: "💬",
    color: "#25D366",
    getUrl: (url, text) => `https://wa.me/?text=${encodeURIComponent(text + "\n" + url)}`,
  },
  {
    id: "facebook",
    label: "Facebook",
    icon: "📘",
    color: "#1877F2",
    getUrl: (url) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
  },
  {
    id: "twitter",
    label: "Twitter / X",
    icon: "🐦",
    color: "#1DA1F2",
    getUrl: (url, text) => `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
  },
  {
    id: "telegram",
    label: "Telegram",
    icon: "✈️",
    color: "#0088CC",
    getUrl: (url, text) => `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
  },
];

export function ShareProductButton({ product, size = "sm" }) {
  const [open, setOpen] = useState(false);

  const url  = `${window.location.origin}/#/products/${product.id}`;
  const text = `Check out "${product.title}" on ASVAN — GHS ${product.price?.toFixed(2)}`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Product link copied!");
    } catch {
      toast.error("Could not copy link");
    }
    setOpen(false);
  };

  const share = (platform) => {
    window.open(platform.getUrl(url, text), "_blank", "noopener,width=600,height=400");
    setOpen(false);
  };

  // Use native share if available (mobile)
  const nativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: product.title, text, url });
      } catch {}
    } else {
      setOpen(v => !v);
    }
  };

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <button
        onClick={nativeShare}
        title="Share this product"
        style={{
          display: "flex", alignItems: "center", gap: 5,
          background: "var(--surface-2)", border: "1px solid var(--border)",
          borderRadius: 20, padding: size === "lg" ? "8px 18px" : "5px 12px",
          fontSize: size === "lg" ? 14 : 12, fontWeight: 600,
          cursor: "pointer", color: "var(--text-secondary)",
          fontFamily: "var(--font-body)", transition: "all 0.15s",
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.color = "var(--accent)"; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text-secondary)"; }}
      >
        🔗 Share
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 40 }} />
          {/* Dropdown */}
          <div style={{
            position: "absolute", top: "calc(100% + 8px)", right: 0, zIndex: 50,
            background: "var(--surface)", border: "1px solid var(--border)",
            borderRadius: "var(--radius-lg)", padding: 8, minWidth: 190,
            boxShadow: "var(--shadow-lg)",
          }}>
            {PLATFORMS.map(p => (
              <button key={p.id} onClick={() => share(p)} style={{
                width: "100%", display: "flex", alignItems: "center", gap: 10,
                padding: "9px 12px", border: "none", background: "none",
                cursor: "pointer", borderRadius: "var(--radius-sm)",
                fontFamily: "var(--font-body)", fontSize: 14, color: "var(--text)",
                transition: "background 0.1s", textAlign: "left",
              }}
                onMouseEnter={e => { e.currentTarget.style.background = "var(--surface-2)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "none"; }}
              >
                <span style={{ fontSize: 18 }}>{p.icon}</span>
                {p.label}
              </button>
            ))}
            <div style={{ height: 1, background: "var(--border)", margin: "6px 0" }} />
            <button onClick={copyLink} style={{
              width: "100%", display: "flex", alignItems: "center", gap: 10,
              padding: "9px 12px", border: "none", background: "none",
              cursor: "pointer", borderRadius: "var(--radius-sm)",
              fontFamily: "var(--font-body)", fontSize: 14, color: "var(--text)",
              transition: "background 0.1s", textAlign: "left",
            }}
              onMouseEnter={e => { e.currentTarget.style.background = "var(--surface-2)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "none"; }}
            >
              <span style={{ fontSize: 18 }}>📋</span>
              Copy Link
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ── DIGITAL RECEIPT ────────────────────────────────────────
export function ShareReceipt({ order, buyer, seller }) {
  const [copied, setCopied] = useState(false);

  const receiptText =
    `🧾 ASVAN Purchase Receipt\n` +
    `──────────────────────\n` +
    `Item:   ${order.itemTitle}\n` +
    `Amount: GHS ${Number(order.amount || 0).toFixed(2)}\n` +
    `Order:  #${order.id?.slice(0, 8)?.toUpperCase()}\n` +
    `Seller: ${seller?.displayName || "—"}\n` +
    `Date:   ${order.createdAt?.seconds ? new Date(order.createdAt.seconds * 1000).toLocaleDateString("en-GH") : "—"}\n` +
    `──────────────────────\n` +
    `Secured by ASVAN Escrow 🔒\n` +
    `asvan.marketplace`;

  const shareReceipt = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: "ASVAN Receipt", text: receiptText }); return; } catch {}
    }
    try {
      await navigator.clipboard.writeText(receiptText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {}
  };

  const shareWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(receiptText)}`, "_blank", "noopener");
  };

  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      <button onClick={shareReceipt} style={{
        display: "flex", alignItems: "center", gap: 6,
        padding: "8px 16px", borderRadius: 20,
        background: "var(--accent-glow)", border: "1px solid rgba(26,86,219,0.2)",
        color: "var(--accent)", fontWeight: 700, fontSize: 13,
        cursor: "pointer", fontFamily: "var(--font-body)",
      }}>
        {copied ? "✓ Copied!" : "🧾 Share Receipt"}
      </button>
      <button onClick={shareWhatsApp} style={{
        display: "flex", alignItems: "center", gap: 6,
        padding: "8px 16px", borderRadius: 20,
        background: "rgba(37,211,102,0.1)", border: "1px solid rgba(37,211,102,0.3)",
        color: "#128C7E", fontWeight: 700, fontSize: 13,
        cursor: "pointer", fontFamily: "var(--font-body)",
      }}>
        💬 WhatsApp
      </button>
    </div>
  );
}
