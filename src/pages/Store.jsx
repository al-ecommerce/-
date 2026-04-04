import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getUserDoc, getProducts, getServices, getReviewsForTarget } from "../firebase/db";
import { ListingCard } from "../components/ListingCard";
import { Spinner, Button, Badge, StarRating, VerifiedBadge, EmptyState, Tabs, Avatar } from "../components/UI";
import { SellerBadgeList } from "../components/SellerBadges";

// ── MASKED CONTACT ROW ───────────────────────────────────
const ContactRow = ({ icon, label, value, href, actionLabel, actionStyle = {} }) => {
  const [revealed, setRevealed] = useState(false);
  const masked = value
    ? value.replace(/\s/g, "").slice(0, 4) + "•••••" + value.replace(/\s/g, "").slice(-3)
    : null;
  if (!value) return null;
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "10px 14px", borderRadius: "var(--radius-sm)",
      background: "var(--surface-2)", border: "1px solid var(--border)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 18 }}>{icon}</span>
        <div>
          <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600 }}>{label}</div>
          <div style={{ fontSize: 14, fontWeight: 700, fontFamily: "monospace" }}>
            {revealed ? value : masked}
          </div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        <button
          onClick={() => setRevealed(v => !v)}
          style={{
            fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 6,
            cursor: "pointer", background: "var(--surface)", border: "1px solid var(--border)",
            color: "var(--accent)", fontFamily: "var(--font-body)",
          }}
        >
          {revealed ? "Hide" : "Reveal"}
        </button>
        {revealed && (
          <a
            href={href}
            target={href.startsWith("http") ? "_blank" : undefined}
            rel="noopener noreferrer"
            style={{
              fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 6,
              cursor: "pointer", textDecoration: "none", color: "#fff",
              border: "1px solid transparent", fontFamily: "var(--font-body)",
              background: actionStyle.background || "var(--accent)",
              ...actionStyle,
            }}
          >
            {actionLabel}
          </a>
        )}
      </div>
    </div>
  );
};

// ── INFO TILE ────────────────────────────────────────────
const InfoTile = ({ icon, label, value }) => {
  if (!value) return null;
  return (
    <div style={{
      padding: "10px 12px", background: "var(--surface-2)",
      borderRadius: "var(--radius-sm)", border: "1px solid var(--border)",
    }}>
      <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, marginBottom: 2 }}>
        {icon} {label}
      </div>
      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{value}</div>
    </div>
  );
};

export default function StorePage() {
  const { uid } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [seller,   setSeller]   = useState(null);
  const [products, setProducts] = useState([]);
  const [services, setServices] = useState([]);
  const [reviews,  setReviews]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [tab,      setTab]      = useState("products");

  useEffect(() => {
    const load = async () => {
      try {
        const [s, p, sv] = await Promise.all([
          getUserDoc(uid),
          getProducts({ sellerId: uid }),
          getServices({ sellerId: uid }),
        ]);
        if (!s || !s.isSeller) { navigate("/"); return; }
        setSeller(s); setProducts(p); setServices(sv);
        const allIds = [...p.map(x => x.id), ...sv.map(x => x.id)];
        const reviewArrays = await Promise.all(allIds.slice(0, 10).map(id => getReviewsForTarget(id)));
        setReviews(reviewArrays.flat());
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    load();
  }, [uid]);

  if (loading) return <Spinner center />;
  if (!seller) return null;

  const avgRating = reviews.length
    ? (reviews.reduce((a, r) => a + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  // Build WhatsApp href with Ghana +233 prefix
  const waNumber = seller.whatsapp
    ? seller.whatsapp.replace(/\s/g, "").replace(/^0/, "233")
    : null;

  return (
    <div className="page-wrapper">
      {/* ── STORE BANNER ── */}
      <div style={{
        background: "linear-gradient(135deg, var(--primary), var(--primary-light))",
        padding: "40px 0 60px",
      }}>
        <div className="container">
          <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
            <Avatar
              name={seller.displayName}
              photoURL={seller.photoURL}
              size="xl"
              style={{ border: "4px solid rgba(255,255,255,0.2)" }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <h1 style={{ fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 800, color: "#fff" }}>
                  {seller.displayName}'s Store
                </h1>
                {seller.isSellerVerified && (
                  <span style={{
                    background: "var(--accent)", color: "#fff",
                    padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 700,
                  }}>✓ Verified Seller</span>
                )}
              </div>
              {seller.bio && (
                <p style={{ color: "rgba(255,255,255,0.7)", marginTop: 6, fontSize: 14 }}>{seller.bio}</p>
              )}
              <div style={{ display: "flex", gap: 20, marginTop: 12, flexWrap: "wrap" }}>
                <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 14 }}>
                  📦 <strong style={{ color: "#fff" }}>{products.length}</strong> Products
                </div>
                <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 14 }}>
                  🛠 <strong style={{ color: "#fff" }}>{services.length}</strong> Services
                </div>
                {avgRating && (
                  <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 14 }}>
                    ⭐ <strong style={{ color: "#fff" }}>{avgRating}</strong> Rating ({reviews.length} reviews)
                  </div>
                )}
                {(seller.city || seller.region) && (
                  <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 14 }}>
                    📍 {[seller.city, seller.region].filter(Boolean).join(", ")}
                  </div>
                )}
              </div>
              {/* Seller badges */}
              <div style={{ marginTop: 10 }}>
                <SellerBadgeList userDoc={seller} size="sm" />
              </div>
            </div>
            <Button
              variant="outline"
              style={{ color: "#fff", borderColor: "rgba(255,255,255,0.4)" }}
              onClick={() => navigate(`/chat?with=${uid}`)}
            >
              💬 Message Seller
            </Button>
          </div>
        </div>
      </div>

      <div className="container" style={{ paddingTop: 28 }}>
        {/* ── TWO-COLUMN LAYOUT: listings left, seller info right ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr min(300px,100%)", gap: 28, alignItems: "start" }}>

          {/* ── LEFT: Tabs + listings ── */}
          <div>
            <Tabs
              tabs={[
                { value: "products", label: `Products (${products.length})` },
                { value: "services", label: `Services (${services.length})` },
                { value: "reviews",  label: `Reviews (${reviews.length})` },
              ]}
              active={tab}
              onChange={setTab}
            />

            {tab === "products" && (
              products.length === 0
                ? <EmptyState icon="📦" title="No products listed" description="This seller hasn't listed any products yet." />
                : <div className="grid grid-4" style={{ gap: 16 }}>
                    {products.map(p => <ListingCard key={p.id} item={p} type="product" />)}
                  </div>
            )}

            {tab === "services" && (
              services.length === 0
                ? <EmptyState icon="🛠" title="No services listed" description="This seller hasn't listed any services yet." />
                : <div className="grid grid-4" style={{ gap: 16 }}>
                    {services.map(s => <ListingCard key={s.id} item={s} type="service" />)}
                  </div>
            )}

            {tab === "reviews" && (
              reviews.length === 0
                ? <EmptyState icon="⭐" title="No reviews yet" description="Be the first to leave a review after purchasing." />
                : <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {reviews.map(r => (
                      <div key={r.id} className="card" style={{ padding: 16 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                          <span style={{ fontWeight: 600 }}>{r.reviewerName || "Anonymous"}</span>
                          <StarRating value={r.rating} readonly />
                        </div>
                        <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6 }}>{r.comment}</p>
                        <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 8 }}>
                          {r.createdAt?.seconds ? new Date(r.createdAt.seconds * 1000).toLocaleDateString() : ""}
                        </div>
                      </div>
                    ))}
                  </div>
            )}
          </div>

          {/* ── RIGHT: Seller details panel ── */}
          <div style={{ position: "sticky", top: "calc(var(--nav-height) + 16px)" }}>
            <div className="card" style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>Seller Details</div>

              {/* Location tiles */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
                <InfoTile icon="🏙" label="City / Town"     value={seller.city} />
                <InfoTile icon="🗺" label="Region"          value={seller.region} />
                <InfoTile
                  icon="📌" label="Area / Landmark"
                  value={seller.address}
                  style={{ gridColumn: "1 / -1" }}
                />
              </div>
              {seller.address && (
                <div style={{
                  padding: "10px 12px", background: "var(--surface-2)",
                  borderRadius: "var(--radius-sm)", border: "1px solid var(--border)",
                  marginBottom: 14,
                }}>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, marginBottom: 2 }}>
                    📌 Area / Landmark
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{seller.address}</div>
                </div>
              )}

              {/* Contact — only for logged-in users */}
              {currentUser ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
                  <ContactRow
                    icon="📞" label="Phone"
                    value={seller.phone}
                    href={`tel:${seller.phone}`}
                    actionLabel="Call"
                  />
                  <ContactRow
                    icon="💬" label="WhatsApp"
                    value={seller.whatsapp}
                    href={`https://wa.me/${waNumber}`}
                    actionLabel="Chat"
                    actionStyle={{ background: "#25D366" }}
                  />
                </div>
              ) : (
                <div style={{
                  padding: "12px 14px", marginBottom: 14,
                  background: "var(--surface-2)", borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--border)", fontSize: 13,
                  color: "var(--text-muted)", textAlign: "center",
                }}>
                  🔒 <strong
                    style={{ color: "var(--accent)", cursor: "pointer" }}
                    onClick={() => navigate("/login")}
                  >Sign in</strong> to view phone &amp; WhatsApp
                </div>
              )}

              {/* Member since */}
              {seller.createdAt?.seconds && (
                <div style={{ fontSize: 12, color: "var(--text-muted)", textAlign: "center", marginBottom: 14 }}>
                  🗓 Member since {new Date(seller.createdAt.seconds * 1000).toLocaleDateString("en-GH", { month: "long", year: "numeric" })}
                </div>
              )}

              {/* CTA buttons */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <Button variant="primary" full onClick={() => navigate(`/chat?with=${uid}`)}>
                  💬 Message Seller
                </Button>
                {seller.whatsapp && currentUser && (
                  <a
                    href={`https://wa.me/${waNumber}`}
                    target="_blank" rel="noopener noreferrer"
                    style={{
                      display: "block", textAlign: "center", padding: "10px",
                      background: "#25D366", color: "#fff", fontWeight: 700,
                      fontSize: 14, borderRadius: "var(--radius-sm)",
                      textDecoration: "none", fontFamily: "var(--font-body)",
                    }}
                  >
                    📲 WhatsApp Seller
                  </a>
                )}
              </div>
            </div>

            {/* Trust signals */}
            <div className="card" style={{ fontSize: 13, color: "var(--text-muted)" }}>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10, color: "var(--text)" }}>
                Buyer Protection
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                <div>🔒 All payments held in escrow</div>
                <div>🛡 Money back if item not delivered</div>
                <div>💬 Chat with seller before buying</div>
                <div>⭐ Read verified buyer reviews</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
