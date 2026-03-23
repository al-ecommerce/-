import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getProducts, getServices, getRequests, getApprovedAds } from "../firebase/db";
import { ListingCard, RequestCard } from "../components/ListingCard";
import { Spinner, Button, Badge } from "../components/UI";

const CATEGORIES = ["Electronics", "Fashion", "Food", "Auto", "Property", "Services", "Education", "Health", "Other"];

export default function Home() {
  const { currentUser, userDoc } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [services, setServices] = useState([]);
  const [requests, setRequests] = useState([]);
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [p, s, r, a] = await Promise.all([
          getProducts({ limit: 8 }),
          getServices({ limit: 4 }),
          getRequests(),
          getApprovedAds()
        ]);
        setProducts(p); setServices(s);
        setRequests(r.slice(0, 4)); setAds(a);
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <Spinner center />;

  return (
    <div className="page-wrapper">
      {/* Hero */}
      <section style={{
        background: "linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 50%, #0D1B4B 100%)",
        padding: "60px 0 80px",
        position: "relative",
        overflow: "hidden"
      }}>
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "radial-gradient(circle at 20% 50%, rgba(79,124,255,0.15) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(79,124,255,0.1) 0%, transparent 40%)"
        }} />
        <div className="container" style={{ position: "relative" }}>
          <div style={{ textAlign: "center", maxWidth: 640, margin: "0 auto" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(79,124,255,0.15)", border: "1px solid rgba(79,124,255,0.3)", borderRadius: 20, padding: "6px 14px", marginBottom: 20 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#4F7CFF" }} />
              <span style={{ fontSize: 13, color: "#93B4FF", fontWeight: 600 }}>Ghana's #1 Marketplace</span>
            </div>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(32px, 6vw, 52px)", fontWeight: 800, color: "#fff", lineHeight: 1.15, marginBottom: 16 }}>
              Buy, Sell & Get Services<br />
              <span style={{ color: "#4F7CFF" }}>All In One Place</span>
            </h1>
            <p style={{ color: "#94A3B8", fontSize: 17, marginBottom: 32, lineHeight: 1.7 }}>
              ASVAN connects buyers with verified sellers and service providers. Secure escrow, verified sellers, and buyer protection built in.
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              {!currentUser
                ? <>
                    <Button variant="primary" size="lg" onClick={() => navigate("/register")}>Get Started Free</Button>
                    <Button variant="outline" size="lg" onClick={() => navigate("/products")} style={{ color: "#fff", borderColor: "rgba(255,255,255,0.3)" }}>Browse Listings</Button>
                  </>
                : <>
                    <Button variant="primary" size="lg" onClick={() => navigate("/products")}>Browse Products</Button>
                    {!userDoc?.isSeller && (
                      <Button variant="outline" size="lg" onClick={() => navigate("/seller-dashboard")} style={{ color: "#fff", borderColor: "rgba(255,255,255,0.3)" }}>Become a Seller</Button>
                    )}
                  </>
              }
            </div>
          </div>

          {/* Stats */}
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24,
            maxWidth: 480, margin: "48px auto 0"
          }}>
            {[["1000+", "Products"], ["500+", "Services"], ["99%", "Satisfaction"]].map(([v, l]) => (
              <div key={l} style={{ textAlign: "center" }}>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 800, color: "#fff" }}>{v}</div>
                <div style={{ fontSize: 13, color: "#64748B" }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section style={{ padding: "32px 0 8px" }}>
        <div className="container">
          <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 8 }}>
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => navigate(`/products?category=${cat}`)}
                style={{
                  flexShrink: 0, padding: "8px 16px", borderRadius: 20, border: "1.5px solid var(--border)",
                  background: "var(--surface)", fontSize: 13, fontWeight: 600, cursor: "pointer",
                  color: "var(--text)", transition: "all 0.2s", fontFamily: "var(--font-body)"
                }}
                onMouseEnter={e => { e.target.style.background = "var(--accent-glow)"; e.target.style.borderColor = "var(--accent)"; e.target.style.color = "var(--accent)"; }}
                onMouseLeave={e => { e.target.style.background = "var(--surface)"; e.target.style.borderColor = "var(--border)"; e.target.style.color = "var(--text)"; }}
              >{cat}</button>
            ))}
          </div>
        </div>
      </section>

      {/* Ads Banner */}
      {ads.length > 0 && (
        <div className="container" style={{ paddingTop: 24 }}>
          <div style={{
            background: "linear-gradient(135deg, #1e3a8a, #1d4ed8)",
            borderRadius: "var(--radius-xl)", padding: "20px 24px",
            display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12
          }}>
            <div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", marginBottom: 4 }}>SPONSORED</div>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, color: "#fff", fontSize: 17 }}>{ads[0].title}</div>
              <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 14 }}>{ads[0].description}</div>
            </div>
            {ads[0].ctaLink && (
              <a href={ads[0].ctaLink} target="_blank" rel="noopener noreferrer"
                style={{ padding: "10px 20px", background: "#fff", color: "#1d4ed8", borderRadius: 8, fontWeight: 700, fontSize: 14, textDecoration: "none" }}>
                {ads[0].ctaText || "Learn More"}
              </a>
            )}
          </div>
        </div>
      )}

      <div className="container">
        {/* Products Section */}
        <section className="section">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <h2 className="section-title" style={{ margin: 0 }}>Featured Products</h2>
            <Link to="/products" style={{ fontSize: 14, fontWeight: 600, color: "var(--accent)" }}>View all →</Link>
          </div>
          {products.length > 0
            ? <div className="grid grid-4" style={{ gap: 16 }}>
                {products.map(p => <ListingCard key={p.id} item={p} type="product" />)}
              </div>
            : <div style={{ textAlign: "center", padding: 40, color: "var(--text-muted)" }}>No products yet. <Link to="/seller-dashboard">Be the first to list!</Link></div>
          }
        </section>

        {/* Services Section */}
        <section className="section" style={{ borderTop: "1px solid var(--border)", paddingTop: 32 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <h2 className="section-title" style={{ margin: 0 }}>Top Services</h2>
            <Link to="/services" style={{ fontSize: 14, fontWeight: 600, color: "var(--accent)" }}>View all →</Link>
          </div>
          {services.length > 0
            ? <div className="grid grid-4" style={{ gap: 16 }}>
                {services.map(s => <ListingCard key={s.id} item={s} type="service" />)}
              </div>
            : <div style={{ textAlign: "center", padding: 40, color: "var(--text-muted)" }}>No services yet.</div>
          }
        </section>

        {/* Requests Section */}
        <section className="section" style={{ borderTop: "1px solid var(--border)", paddingTop: 32 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <h2 className="section-title" style={{ margin: 0 }}>Open Requests</h2>
            <Link to="/requests" style={{ fontSize: 14, fontWeight: 600, color: "var(--accent)" }}>View all →</Link>
          </div>
          {requests.length > 0
            ? <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {requests.map(r => <RequestCard key={r.id} item={r} />)}
              </div>
            : <div style={{ textAlign: "center", padding: 40, color: "var(--text-muted)" }}>No open requests.</div>
          }
        </section>

        {/* CTA */}
        <section style={{ padding: "40px 0 20px" }}>
          <div style={{
            background: "linear-gradient(135deg, var(--accent) 0%, #6B48FF 100%)",
            borderRadius: "var(--radius-xl)", padding: "40px 32px", textAlign: "center"
          }}>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 800, color: "#fff", marginBottom: 12 }}>
              Ready to Start Selling?
            </h2>
            <p style={{ color: "rgba(255,255,255,0.8)", fontSize: 16, marginBottom: 24 }}>
              Join thousands of verified sellers on ASVAN and grow your business.
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              {!currentUser
                ? <Button variant="secondary" size="lg" onClick={() => navigate("/register")} style={{ background: "#fff", color: "var(--accent)" }}>Create Account</Button>
                : <Button variant="secondary" size="lg" onClick={() => navigate("/seller-dashboard")} style={{ background: "#fff", color: "var(--accent)" }}>Go to Seller Dashboard</Button>
              }
              <Button variant="outline" size="lg" onClick={() => navigate("/manual")} style={{ color: "#fff", borderColor: "rgba(255,255,255,0.4)" }}>How It Works</Button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
