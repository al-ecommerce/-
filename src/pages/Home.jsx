import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getProducts, getServices, getRequests } from "../firebase/db";
import { ListingCard, RequestCard } from "../components/ListingCard";
import { Spinner, Button, Badge } from "../components/UI";
import AdBanner from "../components/AdBanner";
import FeaturedGrid from "../components/FeaturedGrid";

const CATEGORIES = [
  { label: "Electronics", icon: "💻" },
  { label: "Fashion",     icon: "👔" },
  { label: "Food",        icon: "🍽️" },
  { label: "Auto",        icon: "🚗" },
  { label: "Property",    icon: "🏠" },
  { label: "Services",    icon: "🛠" },
  { label: "Education",   icon: "📚" },
  { label: "Health",      icon: "❤️" },
  { label: "Other",       icon: "📦" },
];

const HERO_SLIDES = [
  {
    headline: "Ghana's Most Trusted Marketplace",
    sub: "Buy products, hire services, and post requests — all protected by escrow.",
    image: "https://lh3.googleusercontent.com/pw/AP1GczOBVoGb1ypNyC9gHh0wGKSq0QJoysOBPGR-_5ZMdUC-BkdYrqde3Z3uhHPCPuCm3INKJ_C_oZYaEcETfdak6g0P52gAMdzTLqZeoeqAUdQ9ExL14wY",
    accent: "#4F8EFF",
  },
  {
    headline: "Sell to Thousands of Buyers",
    sub: "List your products and services for free. Admin-verified. Escrow-secured payments.",
    image: "https://lh3.googleusercontent.com/pw/AP1GczMSCvo4xoh8piU_LjEp_1Ccc7euCwxBv0mttD1KOipMEhJwvl7wO-P9nTVDNn2aNjMqmCAFBObOJC520b9SfMIbHJW8oLwYMYrlePdtGDp6cER_rHQ",
    accent: "#34D399",
  },
  {
    headline: "Secure Payments. Every Time.",
    sub: "Funds held in escrow until delivery confirmed. No risk. No scams. Full buyer protection.",
    image: "https://lh3.googleusercontent.com/pw/AP1GczNiIymU5Be_YKALPXP6-5yq-7FpHFJcfNQ5SFm4c0SrH6xjGZoci6d6bfz48xXKB3-G0naxQ-4zT75D73YDTPBx2n6GPLuLKiClJVJEAFh8cHCDBTY",
    accent: "#A78BFA",
  },
];

const TRUST_ITEMS = [
  "🔒 Escrow-Protected Payments",
  "✓ Verified Sellers",
  "📦 Buyer Protection Guarantee",
  "⚡ Instant Wallet Transfers",
  "🛡️ Anti-Fraud System",
  "📋 Dispute Resolution",
  "💬 Direct Seller Chat",
  "⭐ Verified Reviews",
];

// Simulated live activity feed
const LIVE_ACTIVITY = [
  { name: "Kofi A.",     action: "just purchased",  item: "Samsung Galaxy A54",   time: "2m ago",  emoji: "📱" },
  { name: "Ama S.",      action: "hired",            item: "Logo Design Service",  time: "5m ago",  emoji: "🎨" },
  { name: "Kwame B.",    action: "posted a request for", item: "AC Repair",        time: "8m ago",  emoji: "🔧" },
  { name: "Abena T.",    action: "just purchased",   item: "HP Laptop 15\"",       time: "11m ago", emoji: "💻" },
  { name: "Yaw O.",      action: "left a review for", item: "Tailoring Service",  time: "14m ago", emoji: "⭐" },
  { name: "Efua M.",     action: "just purchased",   item: "Nike Air Force 1",     time: "17m ago", emoji: "👟" },
  { name: "Nana K.",     action: "hired",            item: "Web Development",      time: "20m ago", emoji: "💻" },
  { name: "Serwaa P.",   action: "posted a request for", item: "Catering Service", time: "23m ago", emoji: "🍽️" },
];

const TESTIMONIALS = [
  {
    name: "Kwame Boateng",
    role: "Electronics Seller, Accra",
    avatar: "KB",
    avatarColor: "#4F8EFF",
    quote: "I listed my phones and got my first order within 24 hours. The escrow system means I never worry about payment fraud.",
    stars: 5,
  },
  {
    name: "Ama Serwaa",
    role: "Graphic Designer, Kumasi",
    avatar: "AS",
    avatarColor: "#34D399",
    quote: "AlEcom helped me reach clients I'd never find on social media. I now get 3–5 design gigs every week through the platform.",
    stars: 5,
  },
  {
    name: "Michael Tetteh",
    role: "Buyer, Tema",
    avatar: "MT",
    avatarColor: "#A78BFA",
    quote: "Ordered a laptop and the escrow held my money safely until I confirmed delivery. Finally, an online market I can trust.",
    stars: 5,
  },
];

export default function Home() {
  const { currentUser, userDoc } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts]     = useState([]);
  const [services, setServices]     = useState([]);
  const [requests, setRequests]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [slideIndex, setSlideIndex] = useState(0);
  const [activityIndex, setActivityIndex] = useState(0);
  const [activityVisible, setActivityVisible] = useState(true);
  const [showPWABanner, setShowPWABanner] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const slideTimer  = useRef(null);
  const activityTimer = useRef(null);

  // PWA install prompt
  useEffect(() => {
    const dismissed = sessionStorage.getItem("pwa-banner-dismissed");
    if (dismissed) return;

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPWABanner(true);
    };
    window.addEventListener("beforeinstallprompt", handler);

    // Show banner after 3s even without the event (for users on iOS / already-installable)
    const timer = setTimeout(() => {
      if (!dismissed) setShowPWABanner(true);
    }, 3000);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      clearTimeout(timer);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") setShowPWABanner(false);
    } else {
      // Fallback: open the site for manual add-to-homescreen
      window.open("https://alecom.vercel.app", "_blank");
    }
    sessionStorage.setItem("pwa-banner-dismissed", "1");
  };

  const dismissPWA = () => {
    setShowPWABanner(false);
    sessionStorage.setItem("pwa-banner-dismissed", "1");
  };

  // Auto-advance hero slides
  useEffect(() => {
    slideTimer.current = setInterval(() => {
      setSlideIndex(i => (i + 1) % HERO_SLIDES.length);
    }, 5000);
    return () => clearInterval(slideTimer.current);
  }, []);

  // Cycle live activity ticker
  useEffect(() => {
    activityTimer.current = setInterval(() => {
      setActivityVisible(false);
      setTimeout(() => {
        setActivityIndex(i => (i + 1) % LIVE_ACTIVITY.length);
        setActivityVisible(true);
      }, 400);
    }, 4000);
    return () => clearInterval(activityTimer.current);
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const [p, s, r] = await Promise.all([
          getProducts({ limit: 8 }).catch(() => []),
          getServices({ limit: 4 }).catch(() => []),
          getRequests().catch(() => []),
        ]);
        setProducts(p);
        setServices(s);
        setRequests(r.slice(0, 3));
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    load();
  }, []);

  const slide    = HERO_SLIDES[slideIndex];
  const activity = LIVE_ACTIVITY[activityIndex];

  return (
    <div className="page-wrapper">

      {/* ── PWA INSTALL BANNER ──────────────────────────────── */}
      {showPWABanner && (
        <div style={{
          position: "fixed", bottom: 20, left: "50%", transform: "translateX(-50%)",
          zIndex: 9999, width: "calc(100% - 32px)", maxWidth: 480,
          background: "linear-gradient(135deg, #0f1523 0%, #1a2540 100%)",
          border: "1px solid rgba(79,142,255,0.3)",
          borderRadius: 16, padding: "14px 18px",
          display: "flex", alignItems: "center", gap: 14,
          boxShadow: "0 8px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(79,142,255,0.15)",
          animation: "slideUp 0.4s ease",
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12, flexShrink: 0,
            backgroundImage: "url('/logo.png')", backgroundSize: "cover",
            backgroundPosition: "center",
            border: "1px solid rgba(255,255,255,0.1)",
          }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: "#fff", marginBottom: 2 }}>
              Install AlEcom App
            </div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", lineHeight: 1.4 }}>
              Faster access, works offline · alecom.vercel.app
            </div>
          </div>
          <button
            onClick={handleInstall}
            style={{
              padding: "8px 16px", borderRadius: 8, flexShrink: 0,
              background: "#4F8EFF", color: "#fff", border: "none",
              fontWeight: 700, fontSize: 13, cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            Install
          </button>
          <button
            onClick={dismissPWA}
            style={{
              width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
              background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)",
              border: "none", fontSize: 16, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            ×
          </button>
        </div>
      )}

      {/* ── HERO BANNER ─────────────────────────────────────── */}
      <section style={{
        backgroundImage: `linear-gradient(rgba(0,0,0,0.35), rgba(0,0,0,0.35)), url(${slide.image})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        minHeight: 480,
        position: "relative",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        transition: "background-image 0.8s ease",
      }}>
        {/* Decorative circles */}
        <div style={{
          position: "absolute", top: -80, right: -80,
          width: 400, height: 400, borderRadius: "50%",
          background: `radial-gradient(circle, ${slide.accent}22 0%, transparent 70%)`,
          animation: "heroPulse 6s ease-in-out infinite",
        }} />
        <div style={{
          position: "absolute", bottom: -60, left: -60,
          width: 300, height: 300, borderRadius: "50%",
          background: `radial-gradient(circle, ${slide.accent}18 0%, transparent 70%)`,
          animation: "heroPulse 8s ease-in-out infinite reverse",
        }} />

        {/* Grid pattern overlay */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: `linear-gradient(${slide.accent}08 1px, transparent 1px), linear-gradient(90deg, ${slide.accent}08 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
        }} />

        {/* Live activity ticker — overlaid at top of hero */}
        <div style={{
          position: "absolute", top: 16, left: "50%", transform: "translateX(-50%)",
          zIndex: 10,
          background: "rgba(0,0,0,0.45)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: 99, padding: "7px 16px",
          display: "flex", alignItems: "center", gap: 8,
          transition: "opacity 0.4s ease",
          opacity: activityVisible ? 1 : 0,
          maxWidth: "90vw",
        }}>
          <span style={{
            width: 7, height: 7, borderRadius: "50%",
            background: "#34D399", flexShrink: 0,
            boxShadow: "0 0 6px #34D399",
            animation: "pulse 2s infinite",
          }} />
          <span style={{ fontSize: 13, color: "rgba(255,255,255,0.85)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            <strong style={{ color: "#fff" }}>{activity.name}</strong>{" "}
            <span style={{ color: "rgba(255,255,255,0.6)" }}>{activity.action}</span>{" "}
            <strong style={{ color: "#fff" }}>{activity.emoji} {activity.item}</strong>{" "}
            <span style={{ color: "rgba(255,255,255,0.4)", marginLeft: 4 }}>· {activity.time}</span>
          </span>
        </div>

        <div className="container" style={{ position: "relative", padding: "80px 16px 60px" }}>
          <div style={{ maxWidth: 660, margin: "0 auto", textAlign: "center" }}>

            {/* ASVAN Logo mark */}
            <div className="hero-float" style={{
              display: "inline-flex", alignItems: "center", gap: 12,
              marginBottom: 28,
            }}>
              <div style={{
                width: 52, height: 52,
                backgroundImage: "url('/logo.png')", backgroundSize: "cover",
                backgroundPosition: "center",
                borderRadius: 14,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: "var(--font-display)",
              }}></div>
              <span style={{
                fontFamily: "var(--font-display)", fontWeight: 700,
                fontSize: 28, color: "#fff", letterSpacing: "-0.5px",
              }}>AlEcom</span>
            </div>

            {/* Slide badge */}
            <div className="hero-float-2" style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: `${slide.accent}22`,
              border: `1px solid ${slide.accent}44`,
              borderRadius: 20, padding: "5px 14px", marginBottom: 20,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: slide.accent, display: "inline-block" }} />
              <span style={{ fontSize: 12, color: slide.accent, fontWeight: 600, letterSpacing: "0.5px", textTransform: "uppercase" }}>
                Ghana's #1 Marketplace
              </span>
            </div>

            {/* Headline */}
            <h1 key={slideIndex} className="hero-float-2" style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(28px, 5.5vw, 50px)",
              fontWeight: 700,
              color: "#FFFFFF",
              lineHeight: 1.2,
              marginBottom: 16,
              letterSpacing: "-0.5px",
            }}>
              {slide.headline}
            </h1>

            <p className="hero-float-3" style={{
              fontSize: 16, color: "rgba(255,255,255,0.72)",
              lineHeight: 1.75, marginBottom: 36, maxWidth: 520, margin: "0 auto 36px",
              fontFamily: "var(--font-body)", fontWeight: 400,
            }}>
              {slide.sub}
            </p>

            {/* CTAs */}
            <div className="hero-float-3" style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              {!currentUser ? (
                <>
                  <button onClick={() => navigate("/register")} style={{
                    padding: "13px 28px", borderRadius: "var(--radius-sm)",
                    background: slide.accent, color: "#fff", border: "none",
                    fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 15,
                    cursor: "pointer", boxShadow: `0 4px 18px ${slide.accent}44`,
                    transition: "all 0.2s",
                  }}>
                    Get Started — It's Free
                  </button>
                  <button onClick={() => navigate("/products")} style={{
                    padding: "13px 28px", borderRadius: "var(--radius-sm)",
                    background: "transparent", color: "#fff",
                    border: "1.5px solid rgba(255,255,255,0.35)",
                    fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 15,
                    cursor: "pointer", transition: "all 0.2s",
                  }}>
                    Browse Listings
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => navigate("/products")} style={{
                    padding: "13px 28px", borderRadius: "var(--radius-sm)",
                    background: slide.accent, color: "#fff", border: "none",
                    fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 15,
                    cursor: "pointer",
                  }}>
                    Browse Products
                  </button>
                  {!userDoc?.isSeller && (
                    <button onClick={() => navigate("/seller-dashboard")} style={{
                      padding: "13px 28px", borderRadius: "var(--radius-sm)",
                      background: "transparent", color: "#fff",
                      border: "1.5px solid rgba(255,255,255,0.35)",
                      fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 15,
                      cursor: "pointer",
                    }}>
                      Start Selling
                    </button>
                  )}
                </>
              )}
            </div>

            {/* Stats row */}
            <div style={{
              display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
              gap: 16, marginTop: 52, maxWidth: 440, marginLeft: "auto", marginRight: "auto",
            }}>
              {[
                ["1,000+", "Products Listed"],
                ["500+",   "Active Services"],
                ["99%",    "Satisfaction Rate"],
              ].map(([val, lbl]) => (
                <div key={lbl} style={{ textAlign: "center" }}>
                  <div style={{
                    fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 700,
                    color: "#fff", letterSpacing: "-0.5px",
                  }}>{val}</div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 2, fontWeight: 500 }}>{lbl}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Slide dots */}
          <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 32 }}>
            {HERO_SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => { setSlideIndex(i); clearInterval(slideTimer.current); }}
                style={{
                  width: i === slideIndex ? 24 : 8, height: 8,
                  borderRadius: 4, border: "none", cursor: "pointer",
                  background: i === slideIndex ? slide.accent : "rgba(255,255,255,0.3)",
                  transition: "all 0.35s ease",
                }}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── TRUST MARQUEE ───────────────────────────────────── */}
      <div style={{
        background: "var(--primary)", borderBottom: "1px solid rgba(255,255,255,0.06)",
        padding: "12px 0", overflow: "hidden",
      }}>
        <div className="banner-track">
          {[...TRUST_ITEMS, ...TRUST_ITEMS].map((item, i) => (
            <span key={i} style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "0 28px",
              fontSize: 13, color: "rgba(255,255,255,0.75)",
              fontFamily: "var(--font-body)", fontWeight: 500, whiteSpace: "nowrap",
            }}>
              {item}
              <span style={{ color: "rgba(255,255,255,0.2)", marginLeft: 14 }}>|</span>
            </span>
          ))}
        </div>
      </div>

      {/* ── MARKETPLACE PILLARS ─────────────────────────────── */}
      <section style={{ background: "var(--surface-2)", borderBottom: "1px solid var(--border)", padding: "28px 0" }}>
        <div className="container">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 1, background: "var(--border)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
            {[
              {
                icon: "📦",
                label: "Buy Products",
                desc: "Physical & digital goods from verified sellers across Ghana",
                count: "1,000+ listings",
                accent: "#4F8EFF",
                path: "/products",
                cta: "Browse Products",
              },
              {
                icon: "🛠",
                label: "Hire Services",
                desc: "Designers, developers, tutors, lawyers & more — pay safely",
                count: "500+ professionals",
                accent: "#34D399",
                path: "/services",
                cta: "Explore Services",
              },
              {
                icon: "📋",
                label: "Post a Request",
                desc: "Tell sellers what you need — let them come to you with offers",
                count: "Free to post",
                accent: "#F59E0B",
                path: "/requests/new",
                cta: "Post Request",
              },
            ].map(pillar => (
              <button
                key={pillar.label}
                onClick={() => navigate(pillar.path)}
                style={{
                  display: "flex", flexDirection: "column", gap: 10,
                  padding: "24px 20px", background: "var(--surface)",
                  border: "none", cursor: "pointer", textAlign: "left",
                  transition: "background 0.2s",
                }}
                onMouseEnter={e => e.currentTarget.style.background = "var(--surface-2)"}
                onMouseLeave={e => e.currentTarget.style.background = "var(--surface)"}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 12,
                    background: `${pillar.accent}18`,
                    border: `1px solid ${pillar.accent}33`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 22,
                  }}>{pillar.icon}</div>
                  <span style={{
                    fontSize: 11, fontWeight: 600, padding: "3px 9px",
                    borderRadius: 99, background: `${pillar.accent}15`,
                    color: pillar.accent, border: `1px solid ${pillar.accent}30`,
                    whiteSpace: "nowrap",
                  }}>{pillar.count}</span>
                </div>
                <div>
                  <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 16, marginBottom: 4, color: "var(--text)" }}>
                    {pillar.label}
                  </div>
                  <div style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.55 }}>
                    {pillar.desc}
                  </div>
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: pillar.accent, marginTop: 4 }}>
                  {pillar.cta} →
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── CATEGORIES ──────────────────────────────────────── */}
      <section style={{ padding: "36px 0 8px", background: "var(--surface)" }}>
        <div className="container">
          <h2 style={{
            fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 700,
            marginBottom: 20, color: "var(--text)", letterSpacing: "-0.2px",
          }}>
            Shop by Category
          </h2>
          <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 8 }}>
            {CATEGORIES.map(cat => (
              <button
                key={cat.label}
                onClick={() => navigate(`/products?category=${cat.label}`)}
                style={{
                  flexShrink: 0,
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                  padding: "14px 18px", borderRadius: "var(--radius)",
                  border: "1.5px solid var(--border)",
                  background: "var(--surface-2)", cursor: "pointer",
                  transition: "all 0.2s", minWidth: 80,
                  fontFamily: "var(--font-body)",
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = "var(--accent)";
                  e.currentTarget.style.background = "var(--accent-glow)";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = "var(--border)";
                  e.currentTarget.style.background = "var(--surface-2)";
                }}
              >
                <span style={{ fontSize: 24 }}>{cat.icon}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", whiteSpace: "nowrap" }}>{cat.label}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── SPONSORED AD BANNER ─────────────────────────────── */}
      <div className="container" style={{ paddingTop: 24 }}>
        <AdBanner />
      </div>

      {/* ── FEATURED LISTINGS ───────────────────────────────── */}
      <FeaturedGrid />

      <div className="container">

        {/* ── PRODUCTS ──────────────────────────────────────── */}
        <section style={{ padding: "40px 0 0" }}>
          <div style={{
            display: "flex", justifyContent: "space-between",
            alignItems: "baseline", marginBottom: 24,
          }}>
            <div>
              <h2 style={{
                fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 700,
                margin: 0, letterSpacing: "-0.3px",
              }}>Featured Products</h2>
              <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4, fontWeight: 400 }}>
                Curated listings from verified sellers
              </p>
            </div>
            <Link to="/products" style={{
              fontSize: 13, fontWeight: 600, color: "var(--accent)",
              textDecoration: "none", whiteSpace: "nowrap",
            }}>
              View all →
            </Link>
          </div>

          {loading ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>
              {[1,2,3,4].map(i => (
                <div key={i} style={{ borderRadius: "var(--radius-lg)", overflow: "hidden", border: "1px solid var(--border)" }}>
                  <div className="skeleton" style={{ height: 180 }} />
                  <div style={{ padding: 14 }}>
                    <div className="skeleton" style={{ height: 14, width: "70%", marginBottom: 8 }} />
                    <div className="skeleton" style={{ height: 12, width: "90%", marginBottom: 12 }} />
                    <div className="skeleton" style={{ height: 18, width: "40%" }} />
                  </div>
                </div>
              ))}
            </div>
          ) : products.length > 0 ? (
            <div className="grid grid-4" style={{ gap: 16 }}>
              {products.map(p => <ListingCard key={p.id} item={p} type="product" />)}
            </div>
          ) : (
            <div style={{
              textAlign: "center", padding: "48px 20px",
              background: "var(--surface-2)", borderRadius: "var(--radius-lg)",
              border: "1px dashed var(--border)",
            }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📦</div>
              <p style={{ color: "var(--text-muted)", fontSize: 14 }}>
                No products listed yet.{" "}
                <Link to="/seller-dashboard" style={{ color: "var(--accent)", fontWeight: 600 }}>
                  Be the first to list!
                </Link>
              </p>
            </div>
          )}
        </section>

        {/* ── HOW IT WORKS ──────────────────────────────────── */}
        <section style={{ padding: "48px 0 0" }}>
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <h2 style={{
              fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 700,
              letterSpacing: "-0.3px", marginBottom: 8,
            }}>How AlEcom Works</h2>
            <p style={{ color: "var(--text-muted)", fontSize: 14, maxWidth: 480, margin: "0 auto" }}>
              Transparent, secure, and simple — from browsing to delivery.
            </p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 20 }}>
            {[
              { step: "01", icon: "🔍", title: "Browse Listings", desc: "Explore thousands of products, services, and open requests." },
              { step: "02", icon: "💬", title: "Contact Seller",  desc: "Chat directly. Ask questions before you commit to a purchase." },
              { step: "03", icon: "🔒", title: "Pay via Escrow",  desc: "Your payment is held securely until delivery is confirmed." },
              { step: "04", icon: "✅", title: "Confirm & Review", desc: "Confirm receipt and release payment. Leave a review for trust." },
            ].map(s => (
              <div key={s.step} style={{
                background: "var(--surface)", border: "1px solid var(--border)",
                borderRadius: "var(--radius-lg)", padding: "24px 20px",
                position: "relative", overflow: "hidden",
              }}>
                <div style={{
                  position: "absolute", top: 12, right: 16,
                  fontFamily: "var(--font-display)", fontSize: 36, fontWeight: 800,
                  color: "var(--border)", lineHeight: 1, userSelect: "none",
                }}>{s.step}</div>
                <div style={{ fontSize: 30, marginBottom: 12 }}>{s.icon}</div>
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15, marginBottom: 8, letterSpacing: "-0.2px" }}>
                  {s.title}
                </div>
                <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6, margin: 0 }}>
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── SERVICES ──────────────────────────────────────── */}
        <section style={{ padding: "48px 0 0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 24 }}>
            <div>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 700, margin: 0, letterSpacing: "-0.3px" }}>
                Professional Services
              </h2>
              <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>Hire skilled professionals across Ghana</p>
            </div>
            <Link to="/services" style={{ fontSize: 13, fontWeight: 600, color: "var(--accent)", textDecoration: "none" }}>View all →</Link>
          </div>
          {!loading && services.length > 0 ? (
            <div className="grid grid-4" style={{ gap: 16 }}>
              {services.map(s => <ListingCard key={s.id} item={s} type="service" />)}
            </div>
          ) : !loading ? (
            <div style={{ textAlign: "center", padding: "32px 20px", color: "var(--text-muted)", fontSize: 14 }}>
              No services available yet.
            </div>
          ) : null}
        </section>

        {/* ── POST A REQUEST CTA BAND ───────────────────────── */}
        <section style={{ padding: "48px 0 0" }}>
          <div style={{
            background: "linear-gradient(135deg, #1a1200 0%, #2a1f00 100%)",
            border: "1px solid rgba(245,158,11,0.25)",
            borderRadius: "var(--radius-xl)", padding: "36px 32px",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            gap: 24, flexWrap: "wrap", position: "relative", overflow: "hidden",
          }}>
            {/* decorative bg glow */}
            <div style={{
              position: "absolute", right: -60, top: -60,
              width: 260, height: 260, borderRadius: "50%",
              background: "radial-gradient(circle, rgba(245,158,11,0.12) 0%, transparent 70%)",
              pointerEvents: "none",
            }} />
            <div style={{ maxWidth: 440, position: "relative" }}>
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 7,
                background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.3)",
                borderRadius: 99, padding: "4px 12px", marginBottom: 14,
              }}>
                <span style={{ fontSize: 14 }}>📋</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#F59E0B", letterSpacing: "0.4px", textTransform: "uppercase" }}>
                  Buyer Feature
                </span>
              </div>
              <h3 style={{
                fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 700,
                color: "#fff", marginBottom: 10, letterSpacing: "-0.3px",
              }}>
                Can't find what you need?
              </h3>
              <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 14, lineHeight: 1.7, margin: 0 }}>
                Post a request and let sellers come to you. Describe what you're looking for — price, location, deadline — and receive offers directly.
              </p>
            </div>
            <button
              onClick={() => navigate("/requests/new")}
              style={{
                padding: "13px 28px", borderRadius: "var(--radius-sm)",
                background: "#F59E0B", color: "#000", border: "none",
                fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 15,
                cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0,
                boxShadow: "0 4px 20px rgba(245,158,11,0.35)",
              }}
            >
              Post a Request — Free
            </button>
          </div>
        </section>

        {/* ── OPEN REQUESTS ─────────────────────────────────── */}
        <section style={{ padding: "48px 0 0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 24 }}>
            <div>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 700, margin: 0, letterSpacing: "-0.3px" }}>
                Open Requests
              </h2>
              <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>Buyers looking for sellers — make an offer</p>
            </div>
            <Link to="/requests" style={{ fontSize: 13, fontWeight: 600, color: "var(--accent)", textDecoration: "none" }}>View all →</Link>
          </div>
          {!loading && requests.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {requests.map(r => <RequestCard key={r.id} item={r} />)}
            </div>
          ) : !loading ? (
            <div style={{ textAlign: "center", padding: "32px 20px", color: "var(--text-muted)", fontSize: 14 }}>No open requests right now.</div>
          ) : null}
        </section>

        {/* ── TESTIMONIALS ──────────────────────────────────── */}
        <section style={{ padding: "48px 0 0" }}>
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 700, letterSpacing: "-0.3px", marginBottom: 6 }}>
              Trusted by Ghanaians
            </h2>
            <p style={{ color: "var(--text-muted)", fontSize: 14 }}>Real buyers and sellers. Real results.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
            {TESTIMONIALS.map(t => (
              <div key={t.name} className="card" style={{ padding: 22, position: "relative" }}>
                {/* Stars */}
                <div style={{ display: "flex", gap: 2, marginBottom: 14 }}>
                  {Array.from({ length: t.stars }).map((_, i) => (
                    <span key={i} style={{ color: "#F59E0B", fontSize: 14 }}>★</span>
                  ))}
                </div>
                <p style={{
                  fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.7,
                  margin: "0 0 18px", fontStyle: "italic",
                }}>
                  "{t.quote}"
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: "50%",
                    background: t.avatarColor, color: "#fff",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontWeight: 700, fontSize: 13, flexShrink: 0,
                  }}>{t.avatar}</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text)" }}>{t.name}</div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── WHY ASVAN ─────────────────────────────────────── */}
        <section style={{ padding: "48px 0 0" }}>
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 700, letterSpacing: "-0.3px", marginBottom: 8 }}>
              Why Businesses Choose AlEcom
            </h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20 }}>
            {[
              { icon: "🔒", title: "Escrow Protection",    desc: "Every payment is held securely until the buyer confirms successful delivery. Zero risk." },
              { icon: "✓",  title: "Verified Sellers",     desc: "All sellers are reviewed. Verified badge holders have passed our identity check." },
              { icon: "📱", title: "Mobile-First Design",  desc: "Manage your store, respond to buyers, and track orders on any device, anytime." },
              { icon: "💸", title: "Fast Wallet Payouts",  desc: "Once delivery is confirmed, your earnings land in your wallet instantly." },
              { icon: "🚩", title: "Fraud Protection",     desc: "Our anti-fraud system flags suspicious activity and protects both parties." },
              { icon: "📣", title: "Boost Your Listings",  desc: "Feature your listings and run ads to reach more buyers across the platform." },
            ].map(f => (
              <div key={f.title} className="card" style={{ padding: 20 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: "var(--radius-sm)",
                  background: "var(--accent-glow)", display: "flex",
                  alignItems: "center", justifyContent: "center",
                  fontSize: 20, marginBottom: 14,
                }}>{f.icon}</div>
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15, marginBottom: 6, letterSpacing: "-0.2px" }}>
                  {f.title}
                </div>
                <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.65, margin: 0 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── INSTALL APP CTA ───────────────────────────────── */}
        <section style={{ padding: "48px 0 0" }}>
          <div style={{
            background: "linear-gradient(135deg, #0a0f1e 0%, #111827 100%)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: "var(--radius-xl)", padding: "36px 32px",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            gap: 24, flexWrap: "wrap", position: "relative", overflow: "hidden",
          }}>
            <div style={{
              position: "absolute", left: -40, bottom: -40,
              width: 200, height: 200, borderRadius: "50%",
              background: "radial-gradient(circle, rgba(79,142,255,0.1) 0%, transparent 70%)",
              pointerEvents: "none",
            }} />
            <div style={{ display: "flex", alignItems: "center", gap: 20, position: "relative" }}>
              <div style={{
                width: 60, height: 60, borderRadius: 16,
                backgroundImage: "url('/logo.png')", backgroundSize: "cover",
                backgroundPosition: "center",
                border: "1px solid rgba(255,255,255,0.1)", flexShrink: 0,
              }} />
              <div>
                <h3 style={{
                  fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 700,
                  color: "#fff", marginBottom: 6, letterSpacing: "-0.3px",
                }}>
                  Get the AlEcom App
                </h3>
                <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 13, lineHeight: 1.6, margin: 0, maxWidth: 340 }}>
                  Install directly from your browser — no app store needed. Works offline, loads instantly, feels native.
                </p>
                <div style={{ display: "flex", gap: 12, marginTop: 10, flexWrap: "wrap" }}>
                  {["⚡ Instant load", "📴 Works offline", "🔔 Push notifications"].map(f => (
                    <span key={f} style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", fontWeight: 500 }}>{f}</span>
                  ))}
                </div>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "flex-end", position: "relative" }}>
              <button
                onClick={() => { setShowPWABanner(true); sessionStorage.removeItem("pwa-banner-dismissed"); }}
                style={{
                  padding: "12px 24px", borderRadius: "var(--radius-sm)",
                  background: "#4F8EFF", color: "#fff", border: "none",
                  fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 14,
                  cursor: "pointer", whiteSpace: "nowrap",
                  boxShadow: "0 4px 16px rgba(79,142,255,0.35)",
                }}
              >
                📲 Install App
              </button>
              <a
                href="https://alecom.vercel.app"
                target="_blank"
                rel="noreferrer"
                style={{
                  fontSize: 12, color: "rgba(255,255,255,0.35)",
                  textDecoration: "none", fontWeight: 500,
                }}
              >
                alecom.vercel.app
              </a>
            </div>
          </div>
        </section>

        {/* ── BOTTOM CTA ────────────────────────────────────── */}
        <section style={{ padding: "48px 0 24px" }}>
          <div style={{
            background: "linear-gradient(135deg, var(--primary) 0%, #1a2560 100%)",
            borderRadius: "var(--radius-xl)", padding: "48px 36px",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            gap: 24, flexWrap: "wrap", position: "relative", overflow: "hidden",
          }}>
            <div style={{
              position: "absolute", right: -40, top: -40,
              width: 220, height: 220, borderRadius: "50%",
              background: "rgba(79,142,255,0.12)",
            }} />
            <div style={{ maxWidth: 480 }}>
              <h2 style={{
                fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 700,
                color: "#fff", marginBottom: 10, letterSpacing: "-0.3px",
              }}>
                Ready to Start Selling on AlEcom?
              </h2>
              <p style={{ color: "rgba(255,255,255,0.68)", fontSize: 15, lineHeight: 1.7, margin: 0 }}>
                Join verified sellers across Ghana. List your products and services today — escrow payments, real buyers, zero risk.
              </p>
            </div>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              {!currentUser ? (
                <button onClick={() => navigate("/register")} style={{
                  padding: "13px 28px", borderRadius: "var(--radius-sm)",
                  background: "#fff", color: "var(--primary)", border: "none",
                  fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 15,
                  cursor: "pointer", whiteSpace: "nowrap",
                }}>
                  Create Free Account
                </button>
              ) : (
                <button onClick={() => navigate("/seller-dashboard")} style={{
                  padding: "13px 28px", borderRadius: "var(--radius-sm)",
                  background: "#fff", color: "var(--primary)", border: "none",
                  fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 15,
                  cursor: "pointer", whiteSpace: "nowrap",
                }}>
                  Go to Seller Dashboard
                </button>
              )}
              <button onClick={() => navigate("/manual")} style={{
                padding: "13px 28px", borderRadius: "var(--radius-sm)",
                background: "transparent", color: "#fff",
                border: "1.5px solid rgba(255,255,255,0.3)",
                fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 15,
                cursor: "pointer", whiteSpace: "nowrap",
              }}>
                How It Works
              </button>
              <button onClick={() => navigate("/policy")} style={{
                padding: "13px 28px", borderRadius: "var(--radius-sm)",
                background: "transparent", color: "rgba(255,255,255,0.75)",
                border: "1.5px solid rgba(255,255,255,0.2)",
                fontFamily: "var(--font-body)", fontWeight: 500, fontSize: 15,
                cursor: "pointer", whiteSpace: "nowrap",
              }}>
                Platform Policy
              </button>
            </div>
          </div>
        </section>

      </div>

      {/* Inline styles for keyframes */}
      <style>{`
        @keyframes slideUp {
          from { transform: translateX(-50%) translateY(80px); opacity: 0; }
          to   { transform: translateX(-50%) translateY(0);   opacity: 1; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
