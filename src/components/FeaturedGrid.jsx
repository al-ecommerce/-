import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebase/config";

// Shows approved, non-expired featured listings in a horizontal scroll
export default function FeaturedGrid() {
  const navigate  = useNavigate();
  const [items, setItems] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const snap = await getDocs(query(collection(db, "featuredListings"), where("status", "==", "approved")));
        const now  = Date.now();
        const live = snap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .filter(f => {
            if (!f.expiresAt) return true;
            const exp = f.expiresAt?.seconds ? f.expiresAt.seconds * 1000 : new Date(f.expiresAt).getTime();
            return exp > now;
          })
          .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        setItems(live);
      } catch (e) { console.error(e); }
    };
    load();
  }, []);

  if (items.length === 0) return null;

  return (
    <section style={{ padding: "36px 0 0" }}>
      <div className="container">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 18 }}>
          <div>
            <h2 style={{
              fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 700,
              margin: 0, letterSpacing: "-0.2px", display: "flex", alignItems: "center", gap: 8,
            }}>
              ⭐ Featured Listings
            </h2>
            <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 3 }}>
              Handpicked and verified — top picks for you
            </p>
          </div>
        </div>

        {/* Horizontal scroll row */}
        <div style={{ display: "flex", gap: 16, overflowX: "auto", paddingBottom: 12 }}>
          {items.map(item => (
            <div
              key={item.id}
              onClick={() => navigate(`/${item.itemType}s/${item.itemId}`)}
              style={{
                flexShrink: 0, width: 220, cursor: "pointer",
                background: "var(--surface)", border: "2px solid #F59E0B",
                borderRadius: "var(--radius-lg)", overflow: "hidden",
                transition: "transform 0.2s, box-shadow 0.2s",
                position: "relative",
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 8px 28px rgba(245,158,11,0.25)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}
            >
              {/* Featured badge */}
              <div style={{
                position: "absolute", top: 10, left: 10, zIndex: 2,
                background: "#F59E0B", color: "#fff",
                padding: "3px 10px", borderRadius: 20,
                fontSize: 11, fontWeight: 800,
                boxShadow: "0 2px 8px rgba(245,158,11,0.4)",
              }}>⭐ FEATURED</div>

              {/* Image */}
              <div style={{
                height: 150, background: "var(--surface-3)",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36,
              }}>
                {item.imageURL
                  ? <img src={item.imageURL} alt={item.itemTitle}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      onError={e => { e.target.style.display = "none"; }}
                    />
                  : item.itemType === "product" ? "📦" : "🛠"
                }
              </div>

              {/* Info */}
              <div style={{ padding: "12px 14px" }}>
                <div style={{
                  fontWeight: 700, fontSize: 14,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  marginBottom: 4,
                }}>{item.itemTitle}</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 8 }}>
                  by {item.sellerName}
                </div>
                {item.price > 0 && (
                  <div style={{
                    fontFamily: "var(--font-display)", fontWeight: 800,
                    fontSize: 17, color: "var(--accent)",
                  }}>
                    GHS {Number(item.price).toFixed(2)}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
