import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getProducts, getServices, getRequests } from "../firebase/db";
import {
  collection, query, orderBy, limit, getDocs, where,
} from "firebase/firestore";
import { db } from "../firebase/config";
import { ListingCard, RequestCard } from "../components/ListingCard";
import { Spinner } from "../components/UI";
import AdBanner from "../components/AdBanner";
import FeaturedGrid from "../components/FeaturedGrid";

// ─── helpers ────────────────────────────────────────────────────────────────

function useIsMobile(bp = 768) {
  const [v, setV] = useState(() => window.innerWidth < bp);
  useEffect(() => {
    const h = () => setV(window.innerWidth < bp);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, [bp]);
  return v;
}

function timeAgo(ts) {
  if (!ts) return "";
  const date = ts?.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60)    return `${diff}s ago`;
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function detectPlatform() {
  const ua = navigator.userAgent;
  return {
    isIOS:        /iPhone|iPad|iPod/i.test(ua),
    isAndroid:    /Android/i.test(ua),
    isSafari:     /Safari/i.test(ua) && !/Chrome/i.test(ua),
    isChrome:     /Chrome/i.test(ua) && !/Edg/i.test(ua),
    isEdge:       /Edg/i.test(ua),
    isStandalone: window.matchMedia("(display-mode: standalone)").matches
                  || window.navigator.standalone === true,
  };
}

// ─── constants ──────────────────────────────────────────────────────────────

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

// ─── PWA Install Bottom Sheet ────────────────────────────────────────────────

function PWAInstallModal({ onClose, deferredPrompt, onInstalled }) {
  const p = detectPlatform();
  const [installing, setInstalling] = useState(false);
  const [installed,  setInstalled]  = useState(false);

  const handleNativeInstall = async () => {
    if (!deferredPrompt) return;
    setInstalling(true);
    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setInstalled(true);
        onInstalled?.();
        setTimeout(onClose, 2200);
      }
    } catch {}
    setInstalling(false);
  };

  const Step = ({ num, text, sub }) => (
    <div style={{ display: "flex", gap: 12, padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
      <div style={{
        width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
        background: "#4F8EFF", color: "#fff",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontWeight: 700, fontSize: 12, marginTop: 1,
      }}>{num}</div>
      <div>
        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text, #f1f5f9)", marginBottom: 2 }}>{text}</div>
        {sub && <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", lineHeight: 1.4 }}>{sub}</div>}
      </div>
    </div>
  );

  return (
    <div
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{
        position: "fixed", inset: 0, zIndex: 10000,
        background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)",
        display: "flex", alignItems: "flex-end", justifyContent: "center",
        animation: "fadeIn 0.2s ease",
      }}
    >
      <div style={{
        width: "100%", maxWidth: 480,
        background: "var(--surface, #111827)",
        border: "1px solid rgba(255,255,255,0.09)",
        borderRadius: "20px 20px 0 0",
        padding: "20px 20px 36px",
        animation: "slideUp 0.3s ease",
      }}>
        {/* drag handle */}
        <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.13)", margin: "0 auto 18px" }} />

        {/* header */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 13, flexShrink: 0,
            backgroundImage: "url('/logo.png')", backgroundSize: "cover",
            border: "1px solid rgba(255,255,255,0.1)",
          }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 16, color: "var(--text, #f1f5f9)" }}>AlEcom</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>alecom.vercel.app</div>
          </div>
          <button onClick={onClose} style={{
            width: 30, height: 30, borderRadius: "50%",
            background: "rgba(255,255,255,0.07)", border: "none",
            color: "rgba(255,255,255,0.45)", fontSize: 18, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>×</button>
        </div>

        {/* body */}
        {installed ? (
          <div style={{ textAlign: "center", padding: "16px 0" }}>
            <div style={{ fontSize: 44, marginBottom: 10 }}>🎉</div>
            <div style={{ fontWeight: 700, fontSize: 17, color: "#34D399", marginBottom: 6 }}>App Installed!</div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.45)" }}>AlEcom is now on your home screen.</div>
          </div>
        ) : p.isStandalone ? (
          <div style={{ textAlign: "center", padding: "16px 0" }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>✅</div>
            <div style={{ fontWeight: 700, fontSize: 15, color: "var(--text, #f1f5f9)", marginBottom: 4 }}>Already Installed</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>You're running AlEcom as an app.</div>
          </div>
        ) : (p.isChrome || p.isEdge) && deferredPrompt ? (
          <>
            <h3 style={{ fontWeight: 700, fontSize: 15, color: "var(--text, #f1f5f9)", marginBottom: 6 }}>Install AlEcom App</h3>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", marginBottom: 14, lineHeight: 1.6 }}>
              Add to your home screen for instant access, offline support, and a native app feel.
            </p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18 }}>
              {["⚡ Loads instantly", "📴 Works offline", "🔔 Get notified"].map(f => (
                <span key={f} style={{
                  fontSize: 11, padding: "3px 9px", borderRadius: 99,
                  background: "rgba(79,142,255,0.1)", border: "1px solid rgba(79,142,255,0.22)",
                  color: "#4F8EFF", fontWeight: 500,
                }}>{f}</span>
              ))}
            </div>
            <button
              onClick={handleNativeInstall}
              disabled={installing}
              style={{
                width: "100%", padding: "13px",
                borderRadius: 12, background: "#4F8EFF", color: "#fff",
                border: "none", fontWeight: 700, fontSize: 15, cursor: "pointer",
                opacity: installing ? 0.7 : 1,
              }}
            >
              {installing ? "Installing…" : "📲 Install Now"}
            </button>
          </>
        ) : p.isIOS && p.isSafari ? (
          <>
            <h3 style={{ fontWeight: 700, fontSize: 15, color: "var(--text, #f1f5f9)", marginBottom: 6 }}>Add to Home Screen</h3>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", marginBottom: 14, lineHeight: 1.6 }}>
              Follow these steps in Safari to install AlEcom on your iPhone or iPad:
            </p>
            <Step num="1" text="Tap the Share button ⬆" sub="The box-with-arrow icon at the bottom of Safari" />
            <Step num="2" text='"Add to Home Screen"' sub="Scroll down in the share sheet and tap it" />
            <Step num="3" text='Tap "Add"' sub="Confirm the name, then tap Add in the top right corner" />
            <div style={{
              marginTop: 14, padding: "10px 12px", borderRadius: 10,
              background: "rgba(79,142,255,0.07)", border: "1px solid rgba(79,142,255,0.18)",
              display: "flex", gap: 8, alignItems: "flex-start",
            }}>
              <span style={{ fontSize: 16, flexShrink: 0 }}>💡</span>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", lineHeight: 1.5 }}>
                Only works in <strong style={{ color: "#4F8EFF" }}>Safari</strong>. If you're in Chrome or another browser, copy the link and open it in Safari.
              </span>
            </div>
          </>
        ) : p.isIOS ? (
          <>
            <h3 style={{ fontWeight: 700, fontSize: 15, color: "var(--text, #f1f5f9)", marginBottom: 6 }}>Open in Safari First</h3>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", marginBottom: 14, lineHeight: 1.6 }}>
              iOS only allows installing web apps from Safari. Here's how:
            </p>
            <Step num="1" text="Copy this link" sub="alecom.vercel.app" />
            <Step num="2" text="Open Safari" sub="Tap the Safari icon on your iPhone/iPad" />
            <Step num="3" text="Paste and go" sub="Then follow the Share → Add to Home Screen steps" />
          </>
        ) : p.isAndroid ? (
          <>
            <h3 style={{ fontWeight: 700, fontSize: 15, color: "var(--text, #f1f5f9)", marginBottom: 6 }}>Add to Home Screen</h3>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", marginBottom: 14, lineHeight: 1.6 }}>
              Install AlEcom from Chrome on Android:
            </p>
            <Step num="1" text="Tap the menu ⋮" sub="Top-right corner of Chrome" />
            <Step num="2" text='"Add to Home screen"' sub="Tap it in the dropdown" />
            <Step num="3" text='Tap "Add"' sub="Confirm in the dialog that appears" />
          </>
        ) : (
          <>
            <h3 style={{ fontWeight: 700, fontSize: 15, color: "var(--text, #f1f5f9)", marginBottom: 6 }}>Install on Desktop</h3>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", marginBottom: 14, lineHeight: 1.6 }}>
              Install AlEcom as a desktop app from Chrome or Edge:
            </p>
            <Step num="1" text="Look for the install icon ⊕" sub="In the address bar on the right side" />
            <Step num="2" text='Click "Install"' sub="In the popup that appears" />
            <Step num="3" text="App opens in its own window" sub="Clean, fast, no browser chrome" />
            <a href="https://alecom.vercel.app" target="_blank" rel="noreferrer" style={{
              display: "block", textAlign: "center", padding: "11px",
              marginTop: 14, borderRadius: 10,
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)",
              color: "#4F8EFF", fontSize: 13, fontWeight: 600, textDecoration: "none",
            }}>
              Open alecom.vercel.app →
            </a>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Main ────────────────────────────────────────────────────────────────────

export default function Home() {
  const { currentUser, userDoc } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile(768);
  const isTablet = useIsMobile(1024);

  const [products,   setProducts]   = useState([]);
  const [services,   setServices]   = useState([]);
  const [requests,   setRequests]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [slideIndex, setSlideIndex] = useState(0);

  const [liveItems,   setLiveItems]   = useState([]);
  const [liveIndex,   setLiveIndex]   = useState(0);
  const [liveVisible, setLiveVisible] = useState(true);

  const [showPWA,        setShowPWA]        = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [pwaInstalled,   setPwaInstalled]   = useState(false);

  const slideTimer = useRef(null);
  const liveTimer  = useRef(null);

  // PWA
  useEffect(() => {
    if (detectPlatform().isStandalone) { setPwaInstalled(true); return; }
    const h = e => { e.preventDefault(); setDeferredPrompt(e); };
    window.addEventListener("beforeinstallprompt", h);
    window.addEventListener("appinstalled", () => setPwaInstalled(true));
    return () => window.removeEventListener("beforeinstallprompt", h);
  }, []);

  // Hero slides
  useEffect(() => {
    slideTimer.current = setInterval(() => setSlideIndex(i => (i + 1) % HERO_SLIDES.length), 5000);
    return () => clearInterval(slideTimer.current);
  }, []);

  // Real live activity from Firestore
  useEffect(() => {
    const fetch = async () => {
      const events = [];
      try {
        // Recent completed / paid orders
        const oSnap = await getDocs(
          query(collection(db, "orders"), orderBy("createdAt", "desc"), limit(6))
        );
        oSnap.forEach(d => {
          const o = d.data();
          if (o.buyerName && o.itemTitle)
            events.push({ text: `${o.buyerName.split(" ")[0]} purchased`, item: o.itemTitle, time: o.createdAt, emoji: "🛒" });
        });

        // Recently approved products
        const pSnap = await getDocs(
          query(collection(db, "products"), where("status", "==", "active"), orderBy("createdAt", "desc"), limit(5))
        );
        pSnap.forEach(d => {
          const p = d.data();
          if (p.sellerName && p.title)
            events.push({ text: `${p.sellerName.split(" ")[0]} listed`, item: p.title, time: p.createdAt, emoji: "📦" });
        });

        // Recent services
        const sSnap = await getDocs(
          query(collection(db, "services"), where("status", "==", "active"), orderBy("createdAt", "desc"), limit(4))
        );
        sSnap.forEach(d => {
          const s = d.data();
          if (s.sellerName && s.title)
            events.push({ text: `${s.sellerName.split(" ")[0]} is offering`, item: s.title, time: s.createdAt, emoji: "🛠" });
        });

        // Recent buyer requests
        const rSnap = await getDocs(
          query(collection(db, "requests"), orderBy("createdAt", "desc"), limit(4))
        );
        rSnap.forEach(d => {
          const r = d.data();
          if (r.buyerName && r.title)
            events.push({ text: `${r.buyerName.split(" ")[0]} is looking for`, item: r.title, time: r.createdAt, emoji: "📋" });
        });
      } catch (e) {
        console.warn("Live activity:", e.message);
      }

      // Sort newest first
      events.sort((a, b) => (b.time?.seconds || 0) - (a.time?.seconds || 0));
      if (events.length) setLiveItems(events);
    };
    fetch();
  }, []);

  // Cycle live ticker
  useEffect(() => {
    if (!liveItems.length) return;
    liveTimer.current = setInterval(() => {
      setLiveVisible(false);
      setTimeout(() => { setLiveIndex(i => (i + 1) % liveItems.length); setLiveVisible(true); }, 380);
    }, 4500);
    return () => clearInterval(liveTimer.current);
  }, [liveItems]);

  // Page data
  useEffect(() => {
    const load = async () => {
      try {
        const [p, s, r] = await Promise.all([
          getProducts({ limit: 8 }).catch(() => []),
          getServices({ limit: 4 }).catch(() => []),
          getRequests().catch(() => []),
        ]);
        setProducts(p); setServices(s); setRequests(r.slice(0, 3));
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    load();
  }, []);

  const slide      = HERO_SLIDES[slideIndex];
  const liveEvent  = liveItems[liveIndex] || null;
  const cols       = isMobile ? 2 : isTablet ? 3 : 4;

  return (
    <div className="page-wrapper">

      {showPWA && (
        <PWAInstallModal
          deferredPrompt={deferredPrompt}
          onClose={() => setShowPWA(false)}
          onInstalled={() => { setPwaInstalled(true); setDeferredPrompt(null); }}
        />
      )}

      {/* ── HERO ────────────────────────────────────────────── */}
      <section style={{
        backgroundImage: `linear-gradient(rgba(0,0,0,0.38),rgba(0,0,0,0.38)),url(${slide.image})`,
        backgroundSize: "cover", backgroundPosition: "center",
        minHeight: isMobile ? 420 : 500,
        position: "relative", overflow: "hidden",
        display: "flex", alignItems: "center",
      }}>
        <div style={{ position:"absolute",top:-80,right:-80,width:360,height:360,borderRadius:"50%",background:`radial-gradient(circle,${slide.accent}1a 0%,transparent 70%)`,pointerEvents:"none" }} />
        <div style={{ position:"absolute",bottom:-60,left:-60,width:260,height:260,borderRadius:"50%",background:`radial-gradient(circle,${slide.accent}12 0%,transparent 70%)`,pointerEvents:"none" }} />
        <div style={{ position:"absolute",inset:0,pointerEvents:"none",backgroundImage:`linear-gradient(${slide.accent}06 1px,transparent 1px),linear-gradient(90deg,${slide.accent}06 1px,transparent 1px)`,backgroundSize:"40px 40px" }} />

        {/* Live ticker */}
        {liveEvent && (
          <div style={{
            position:"absolute", top: isMobile ? 10 : 14,
            left:"50%", transform:"translateX(-50%)", zIndex:10,
            background:"rgba(0,0,0,0.52)", backdropFilter:"blur(10px)",
            border:"1px solid rgba(255,255,255,0.1)",
            borderRadius:99, padding: isMobile ? "5px 12px" : "6px 16px",
            display:"flex", alignItems:"center", gap:7,
            opacity: liveVisible ? 1 : 0, transition:"opacity 0.35s ease",
            maxWidth:"calc(100vw - 24px)", whiteSpace:"nowrap", overflow:"hidden",
          }}>
            <span style={{
              width:6,height:6,borderRadius:"50%",background:"#34D399",flexShrink:0,
              boxShadow:"0 0 5px #34D399", display:"inline-block",
              animation:"livePulse 2s infinite",
            }}/>
            <span style={{ fontSize: isMobile ? 11 : 12, color:"rgba(255,255,255,0.82)", overflow:"hidden", textOverflow:"ellipsis" }}>
              <strong style={{color:"#fff"}}>{liveEvent.emoji} {liveEvent.text} </strong>
              <span style={{color:"rgba(255,255,255,0.6)"}}>"{liveEvent.item}"</span>
              <span style={{color:"rgba(255,255,255,0.32)",marginLeft:6}}>· {timeAgo(liveEvent.time)}</span>
            </span>
          </div>
        )}

        <div className="container" style={{ position:"relative", padding: isMobile ? "72px 16px 48px" : "84px 16px 60px" }}>
          <div style={{ maxWidth:660, margin:"0 auto", textAlign:"center" }}>

            <div style={{ display:"inline-flex", alignItems:"center", gap:10, marginBottom:22 }}>
              <div style={{ width: isMobile?40:48, height: isMobile?40:48, backgroundImage:"url('/logo.png')", backgroundSize:"cover", backgroundPosition:"center", borderRadius:12 }}/>
              <span style={{ fontFamily:"var(--font-display)", fontWeight:700, fontSize: isMobile?22:26, color:"#fff", letterSpacing:"-0.5px" }}>AlEcom</span>
            </div>

            <div style={{ display:"inline-flex", alignItems:"center", gap:7, background:`${slide.accent}1e`, border:`1px solid ${slide.accent}3e`, borderRadius:20, padding:"5px 14px", marginBottom:16 }}>
              <span style={{ width:6,height:6,borderRadius:"50%",background:slide.accent,display:"inline-block" }}/>
              <span style={{ fontSize:11, color:slide.accent, fontWeight:600, letterSpacing:"0.5px", textTransform:"uppercase" }}>Ghana's #1 Marketplace</span>
            </div>

            <h1 key={slideIndex} style={{
              fontFamily:"var(--font-display)",
              fontSize: isMobile ? "clamp(22px,7vw,32px)" : "clamp(28px,5.5vw,50px)",
              fontWeight:700, color:"#fff", lineHeight:1.2, marginBottom:14, letterSpacing:"-0.5px",
            }}>{slide.headline}</h1>

            <p style={{ fontSize: isMobile?13:16, color:"rgba(255,255,255,0.68)", lineHeight:1.75, maxWidth:500, margin:"0 auto 28px" }}>{slide.sub}</p>

            <div style={{ display:"flex", gap:10, justifyContent:"center", flexWrap:"wrap" }}>
              {!currentUser ? (
                <>
                  <button onClick={() => navigate("/register")} style={{ padding: isMobile?"11px 20px":"13px 28px", borderRadius:"var(--radius-sm)", background:slide.accent, color:"#fff", border:"none", fontFamily:"var(--font-body)", fontWeight:600, fontSize: isMobile?13:15, cursor:"pointer", boxShadow:`0 4px 16px ${slide.accent}44` }}>Get Started — It's Free</button>
                  <button onClick={() => navigate("/products")} style={{ padding: isMobile?"11px 20px":"13px 28px", borderRadius:"var(--radius-sm)", background:"transparent", color:"#fff", border:"1.5px solid rgba(255,255,255,0.32)", fontFamily:"var(--font-body)", fontWeight:600, fontSize: isMobile?13:15, cursor:"pointer" }}>Browse Listings</button>
                </>
              ) : (
                <>
                  <button onClick={() => navigate("/products")} style={{ padding: isMobile?"11px 20px":"13px 28px", borderRadius:"var(--radius-sm)", background:slide.accent, color:"#fff", border:"none", fontFamily:"var(--font-body)", fontWeight:600, fontSize: isMobile?13:15, cursor:"pointer" }}>Browse Products</button>
                  {!userDoc?.isSeller && (
                    <button onClick={() => navigate("/seller-dashboard")} style={{ padding: isMobile?"11px 20px":"13px 28px", borderRadius:"var(--radius-sm)", background:"transparent", color:"#fff", border:"1.5px solid rgba(255,255,255,0.32)", fontFamily:"var(--font-body)", fontWeight:600, fontSize: isMobile?13:15, cursor:"pointer" }}>Start Selling</button>
                  )}
                </>
              )}
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap: isMobile?8:16, marginTop: isMobile?28:42, maxWidth: isMobile?"100%":400, marginLeft:"auto", marginRight:"auto" }}>
              {[["1,000+","Products"],["500+","Services"],["99%","Satisfaction"]].map(([v,l]) => (
                <div key={l} style={{ textAlign:"center" }}>
                  <div style={{ fontFamily:"var(--font-display)", fontSize: isMobile?18:24, fontWeight:700, color:"#fff" }}>{v}</div>
                  <div style={{ fontSize: isMobile?10:12, color:"rgba(255,255,255,0.4)", marginTop:2 }}>{l}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display:"flex", justifyContent:"center", gap:7, marginTop: isMobile?22:28 }}>
            {HERO_SLIDES.map((_,i) => (
              <button key={i} onClick={() => { setSlideIndex(i); clearInterval(slideTimer.current); }}
                style={{ width:i===slideIndex?22:7, height:7, borderRadius:4, border:"none", cursor:"pointer", background:i===slideIndex?slide.accent:"rgba(255,255,255,0.25)", transition:"all 0.3s", padding:0 }}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── TRUST MARQUEE ─────────────────────────────────── */}
      <div style={{ background:"var(--primary)", borderBottom:"1px solid rgba(255,255,255,0.06)", padding:"11px 0", overflow:"hidden" }}>
        <div className="banner-track">
          {[...TRUST_ITEMS,...TRUST_ITEMS].map((item,i) => (
            <span key={i} style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"0 22px", fontSize: isMobile?11:13, color:"rgba(255,255,255,0.7)", fontFamily:"var(--font-body)", fontWeight:500, whiteSpace:"nowrap" }}>
              {item}<span style={{ color:"rgba(255,255,255,0.15)",marginLeft:10 }}>|</span>
            </span>
          ))}
        </div>
      </div>

      {/* ── MARKETPLACE PILLARS ───────────────────────────── */}
      <section style={{ background:"var(--surface-2)", borderBottom:"1px solid var(--border)", padding:"22px 0" }}>
        <div className="container">
          <div style={{
            display:"grid", gridTemplateColumns: isMobile?"1fr":"repeat(3,1fr)",
            gap:1, background:"var(--border)", borderRadius:"var(--radius-lg)", overflow:"hidden",
          }}>
            {[
              { icon:"📦", label:"Buy Products",   desc:"Physical & digital goods from verified sellers across Ghana", count:"1,000+ listings",    accent:"#4F8EFF", path:"/products",    cta:"Browse Products" },
              { icon:"🛠", label:"Hire Services",   desc:"Designers, developers, tutors, lawyers & more — pay safely",  count:"500+ professionals", accent:"#34D399", path:"/services",    cta:"Explore Services" },
              { icon:"📋", label:"Post a Request",  desc:"Tell sellers what you need — let them come to you",           count:"Free to post",        accent:"#F59E0B", path:"/requests/new",cta:"Post Request" },
            ].map(pl => (
              <button key={pl.label} onClick={() => navigate(pl.path)}
                style={{ display:"flex", flexDirection: isMobile?"row":"column", gap: isMobile?12:10, alignItems: isMobile?"center":"flex-start", padding: isMobile?"14px 14px":"20px 18px", background:"var(--surface)", border:"none", cursor:"pointer", textAlign:"left", transition:"background 0.18s" }}
                onMouseEnter={e => e.currentTarget.style.background="var(--surface-2)"}
                onMouseLeave={e => e.currentTarget.style.background="var(--surface)"}
              >
                <div style={{ width:42,height:42,borderRadius:11,flexShrink:0,background:`${pl.accent}16`,border:`1px solid ${pl.accent}2a`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20 }}>{pl.icon}</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:4, marginBottom: isMobile?0:3 }}>
                    <span style={{ fontFamily:"var(--font-display)", fontWeight:700, fontSize: isMobile?14:15, color:"var(--text)" }}>{pl.label}</span>
                    <span style={{ fontSize:10, fontWeight:600, padding:"2px 7px", borderRadius:99, background:`${pl.accent}10`, color:pl.accent, border:`1px solid ${pl.accent}22`, whiteSpace:"nowrap" }}>{pl.count}</span>
                  </div>
                  {!isMobile && <div style={{ fontSize:12,color:"var(--text-muted)",lineHeight:1.5,marginBottom:7 }}>{pl.desc}</div>}
                  <div style={{ fontSize:12,fontWeight:600,color:pl.accent }}>{pl.cta} →</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── CATEGORIES ────────────────────────────────────── */}
      <section style={{ padding:"26px 0 8px", background:"var(--surface)" }}>
        <div className="container">
          <h2 style={{ fontFamily:"var(--font-display)", fontSize: isMobile?17:20, fontWeight:700, marginBottom:14, color:"var(--text)" }}>Shop by Category</h2>
          <div style={{ display:"flex", gap:8, overflowX:"auto", paddingBottom:8, scrollbarWidth:"none" }}>
            {CATEGORIES.map(cat => (
              <button key={cat.label} onClick={() => navigate(`/products?category=${cat.label}`)}
                style={{ flexShrink:0, display:"flex", flexDirection:"column", alignItems:"center", gap:5, padding: isMobile?"9px 10px":"11px 14px", borderRadius:"var(--radius)", border:"1.5px solid var(--border)", background:"var(--surface-2)", cursor:"pointer", transition:"all 0.18s", minWidth: isMobile?60:72 }}
                onMouseEnter={e => { e.currentTarget.style.borderColor="var(--accent)"; e.currentTarget.style.background="var(--accent-glow)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor="var(--border)"; e.currentTarget.style.background="var(--surface-2)"; }}
              >
                <span style={{ fontSize: isMobile?18:20 }}>{cat.icon}</span>
                <span style={{ fontSize: isMobile?9:11, fontWeight:600, color:"var(--text-secondary)", whiteSpace:"nowrap" }}>{cat.label}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── AD ──────────────────────────────────────────────── */}
      <div className="container" style={{ paddingTop:18 }}><AdBanner /></div>

      {/* ── FEATURED ────────────────────────────────────────── */}
      <FeaturedGrid />

      <div className="container">

        {/* ── PRODUCTS ──────────────────────────────────────── */}
        <section style={{ padding:"34px 0 0" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:18 }}>
            <div>
              <h2 style={{ fontFamily:"var(--font-display)", fontSize: isMobile?17:22, fontWeight:700, margin:0 }}>Featured Products</h2>
              <p style={{ fontSize:12, color:"var(--text-muted)", marginTop:3 }}>Curated listings from verified sellers</p>
            </div>
            <Link to="/products" style={{ fontSize:13, fontWeight:600, color:"var(--accent)", textDecoration:"none" }}>View all →</Link>
          </div>
          {loading ? (
            <div style={{ display:"grid", gridTemplateColumns:`repeat(${cols},1fr)`, gap: isMobile?8:14 }}>
              {Array.from({length:cols}).map((_,i) => (
                <div key={i} style={{ borderRadius:"var(--radius-lg)", overflow:"hidden", border:"1px solid var(--border)" }}>
                  <div className="skeleton" style={{ height: isMobile?130:175 }}/>
                  <div style={{ padding:12 }}>
                    <div className="skeleton" style={{ height:12,width:"70%",marginBottom:7 }}/>
                    <div className="skeleton" style={{ height:10,width:"90%",marginBottom:9 }}/>
                    <div className="skeleton" style={{ height:15,width:"40%" }}/>
                  </div>
                </div>
              ))}
            </div>
          ) : products.length > 0 ? (
            <div style={{ display:"grid", gridTemplateColumns:`repeat(${cols},1fr)`, gap: isMobile?8:14 }}>
              {products.map(p => <ListingCard key={p.id} item={p} type="product"/>)}
            </div>
          ) : (
            <div style={{ textAlign:"center", padding:"36px 20px", background:"var(--surface-2)", borderRadius:"var(--radius-lg)", border:"1px dashed var(--border)" }}>
              <div style={{ fontSize:32,marginBottom:10 }}>📦</div>
              <p style={{ color:"var(--text-muted)",fontSize:13 }}>No products yet. <Link to="/seller-dashboard" style={{ color:"var(--accent)",fontWeight:600 }}>Be the first to list!</Link></p>
            </div>
          )}
        </section>

        {/* ── HOW IT WORKS ──────────────────────────────────── */}
        <section style={{ padding:"42px 0 0" }}>
          <div style={{ textAlign:"center", marginBottom:24 }}>
            <h2 style={{ fontFamily:"var(--font-display)", fontSize: isMobile?17:22, fontWeight:700, marginBottom:6 }}>How AlEcom Works</h2>
            <p style={{ color:"var(--text-muted)", fontSize:13, maxWidth:400, margin:"0 auto" }}>Transparent, secure, simple — from browsing to delivery.</p>
          </div>
          <div style={{ display:"grid", gridTemplateColumns: isMobile?"1fr 1fr":"repeat(4,1fr)", gap: isMobile?8:14 }}>
            {[
              { step:"01", icon:"🔍", title:"Browse Listings",  desc:"Explore thousands of products, services, and open requests." },
              { step:"02", icon:"💬", title:"Contact Seller",   desc:"Chat directly before committing to a purchase." },
              { step:"03", icon:"🔒", title:"Pay via Escrow",   desc:"Payment held securely until delivery confirmed." },
              { step:"04", icon:"✅", title:"Confirm & Review", desc:"Release payment, confirm receipt, leave a review." },
            ].map(s => (
              <div key={s.step} style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:"var(--radius-lg)", padding: isMobile?"14px 12px":"20px 16px", position:"relative", overflow:"hidden" }}>
                <div style={{ position:"absolute",top:10,right:12,fontFamily:"var(--font-display)",fontSize: isMobile?22:30,fontWeight:800,color:"var(--border)",userSelect:"none" }}>{s.step}</div>
                <div style={{ fontSize: isMobile?20:26, marginBottom:8 }}>{s.icon}</div>
                <div style={{ fontFamily:"var(--font-display)", fontWeight:700, fontSize: isMobile?12:14, marginBottom:5 }}>{s.title}</div>
                <p style={{ fontSize: isMobile?11:12, color:"var(--text-muted)", lineHeight:1.55, margin:0 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── SERVICES ──────────────────────────────────────── */}
        <section style={{ padding:"42px 0 0" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:18 }}>
            <div>
              <h2 style={{ fontFamily:"var(--font-display)", fontSize: isMobile?17:22, fontWeight:700, margin:0 }}>Professional Services</h2>
              <p style={{ fontSize:12, color:"var(--text-muted)", marginTop:3 }}>Hire skilled professionals across Ghana</p>
            </div>
            <Link to="/services" style={{ fontSize:13, fontWeight:600, color:"var(--accent)", textDecoration:"none" }}>View all →</Link>
          </div>
          {!loading && services.length > 0 ? (
            <div style={{ display:"grid", gridTemplateColumns:`repeat(${cols},1fr)`, gap: isMobile?8:14 }}>
              {services.map(s => <ListingCard key={s.id} item={s} type="service"/>)}
            </div>
          ) : !loading ? (
            <div style={{ textAlign:"center", padding:"28px", color:"var(--text-muted)", fontSize:13 }}>No services available yet.</div>
          ) : null}
        </section>

        {/* ── POST REQUEST BAND ─────────────────────────────── */}
        <section style={{ padding:"42px 0 0" }}>
          <div style={{
            background:"linear-gradient(135deg,#1a1200 0%,#2a1f00 100%)",
            border:"1px solid rgba(245,158,11,0.2)",
            borderRadius:"var(--radius-xl)",
            padding: isMobile?"22px 16px":"30px 26px",
            display:"flex", flexDirection: isMobile?"column":"row",
            alignItems: isMobile?"flex-start":"center",
            justifyContent:"space-between", gap:18,
            position:"relative", overflow:"hidden",
          }}>
            <div style={{ position:"absolute",right:-50,top:-50,width:200,height:200,borderRadius:"50%",background:"radial-gradient(circle,rgba(245,158,11,0.09) 0%,transparent 70%)",pointerEvents:"none" }}/>
            <div style={{ flex:1, position:"relative" }}>
              <div style={{ display:"inline-flex", alignItems:"center", gap:6, background:"rgba(245,158,11,0.1)", border:"1px solid rgba(245,158,11,0.25)", borderRadius:99, padding:"3px 10px", marginBottom:10 }}>
                <span style={{ fontSize:12 }}>📋</span>
                <span style={{ fontSize:10,fontWeight:600,color:"#F59E0B",textTransform:"uppercase",letterSpacing:"0.4px" }}>Buyer Feature</span>
              </div>
              <h3 style={{ fontFamily:"var(--font-display)", fontSize: isMobile?17:20, fontWeight:700, color:"#fff", marginBottom:7 }}>Can't find what you need?</h3>
              <p style={{ color:"rgba(255,255,255,0.5)", fontSize: isMobile?12:13, lineHeight:1.65, margin:0 }}>Post a request. Describe what you're looking for — price, location, deadline — and receive offers from sellers directly.</p>
            </div>
            <button onClick={() => navigate("/requests/new")} style={{ padding: isMobile?"12px 0":"12px 24px", width: isMobile?"100%":"auto", borderRadius:"var(--radius-sm)", background:"#F59E0B", color:"#000", border:"none", fontFamily:"var(--font-body)", fontWeight:700, fontSize: isMobile?14:15, cursor:"pointer", whiteSpace:"nowrap", flexShrink:0, boxShadow:"0 4px 16px rgba(245,158,11,0.28)", textAlign:"center" }}>
              Post a Request — Free
            </button>
          </div>
        </section>

        {/* ── OPEN REQUESTS ─────────────────────────────────── */}
        <section style={{ padding:"42px 0 0" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:18 }}>
            <div>
              <h2 style={{ fontFamily:"var(--font-display)", fontSize: isMobile?17:22, fontWeight:700, margin:0 }}>Open Requests</h2>
              <p style={{ fontSize:12, color:"var(--text-muted)", marginTop:3 }}>Buyers looking for sellers — make an offer</p>
            </div>
            <Link to="/requests" style={{ fontSize:13, fontWeight:600, color:"var(--accent)", textDecoration:"none" }}>View all →</Link>
          </div>
          {!loading && requests.length > 0 ? (
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {requests.map(r => <RequestCard key={r.id} item={r}/>)}
            </div>
          ) : !loading ? (
            <div style={{ textAlign:"center", padding:"28px", color:"var(--text-muted)", fontSize:13 }}>No open requests right now.</div>
          ) : null}
        </section>

        {/* ── WHY ALECOM ────────────────────────────────────── */}
        <section style={{ padding:"42px 0 0" }}>
          <div style={{ textAlign:"center", marginBottom:24 }}>
            <h2 style={{ fontFamily:"var(--font-display)", fontSize: isMobile?17:22, fontWeight:700, marginBottom:6 }}>Why Businesses Choose AlEcom</h2>
          </div>
          <div style={{ display:"grid", gridTemplateColumns: isMobile?"1fr 1fr":"repeat(3,1fr)", gap: isMobile?8:14 }}>
            {[
              { icon:"🔒", title:"Escrow Protection",   desc:"Payments held securely until the buyer confirms delivery." },
              { icon:"✓",  title:"Verified Sellers",    desc:"All sellers reviewed. Verified badge = identity confirmed." },
              { icon:"📱", title:"Mobile-First",        desc:"Manage your store and track orders from any device." },
              { icon:"💸", title:"Fast Wallet Payouts", desc:"Earnings land in your wallet once delivery is confirmed." },
              { icon:"🚩", title:"Fraud Protection",    desc:"Anti-fraud system monitors both sides of every transaction." },
              { icon:"📣", title:"Boost Listings",      desc:"Feature and advertise your listings to reach more buyers." },
            ].map(f => (
              <div key={f.title} className="card" style={{ padding: isMobile?12:18 }}>
                <div style={{ width:34,height:34,borderRadius:9,background:"var(--accent-glow)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,marginBottom:9 }}>{f.icon}</div>
                <div style={{ fontFamily:"var(--font-display)", fontWeight:700, fontSize: isMobile?12:14, marginBottom:4 }}>{f.title}</div>
                <p style={{ fontSize: isMobile?11:12, color:"var(--text-muted)", lineHeight:1.6, margin:0 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── INSTALL APP ───────────────────────────────────── */}
        {!pwaInstalled && (
          <section style={{ padding:"42px 0 0" }}>
            <div style={{
              background:"linear-gradient(135deg,#07101e 0%,#0f1a2e 100%)",
              border:"1px solid rgba(255,255,255,0.07)",
              borderRadius:"var(--radius-xl)",
              padding: isMobile?"20px 16px":"28px 24px",
              display:"flex", flexDirection: isMobile?"column":"row",
              alignItems: isMobile?"flex-start":"center",
              justifyContent:"space-between", gap:18,
              position:"relative", overflow:"hidden",
            }}>
              <div style={{ position:"absolute",left:-30,bottom:-30,width:160,height:160,borderRadius:"50%",background:"radial-gradient(circle,rgba(79,142,255,0.09) 0%,transparent 70%)",pointerEvents:"none" }}/>
              <div style={{ display:"flex", alignItems:"center", gap:14, flex:1, minWidth:0, position:"relative" }}>
                <div style={{ width: isMobile?44:52, height: isMobile?44:52, borderRadius:13, flexShrink:0, backgroundImage:"url('/logo.png')", backgroundSize:"cover", border:"1px solid rgba(255,255,255,0.09)" }}/>
                <div style={{ minWidth:0 }}>
                  <h3 style={{ fontFamily:"var(--font-display)", fontSize: isMobile?15:17, fontWeight:700, color:"#fff", marginBottom:4 }}>Get the AlEcom App</h3>
                  <p style={{ color:"rgba(255,255,255,0.4)", fontSize:12, lineHeight:1.5, margin:"0 0 7px" }}>Install from your browser — no app store needed.</p>
                  <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
                    {["⚡ Fast","📴 Offline","🔔 Notifications"].map(f => (
                      <span key={f} style={{ fontSize:10,color:"rgba(255,255,255,0.3)",fontWeight:500 }}>{f}</span>
                    ))}
                  </div>
                </div>
              </div>
              <button onClick={() => setShowPWA(true)} style={{ padding: isMobile?"11px 0":"11px 22px", width: isMobile?"100%":"auto", borderRadius:"var(--radius-sm)", background:"#4F8EFF", color:"#fff", border:"none", fontFamily:"var(--font-body)", fontWeight:700, fontSize:14, cursor:"pointer", flexShrink:0, boxShadow:"0 4px 12px rgba(79,142,255,0.3)", textAlign:"center" }}>
                📲 Install App
              </button>
            </div>
          </section>
        )}

        {/* ── BOTTOM CTA ────────────────────────────────────── */}
        <section style={{ padding:"42px 0 24px" }}>
          <div style={{
            background:"linear-gradient(135deg,var(--primary) 0%,#1a2560 100%)",
            borderRadius:"var(--radius-xl)",
            padding: isMobile?"24px 16px":"40px 30px",
            display:"flex", flexDirection: isMobile?"column":"row",
            alignItems: isMobile?"flex-start":"center",
            justifyContent:"space-between", gap:20,
            position:"relative", overflow:"hidden",
          }}>
            <div style={{ position:"absolute",right:-40,top:-40,width:180,height:180,borderRadius:"50%",background:"rgba(79,142,255,0.1)",pointerEvents:"none" }}/>
            <div style={{ maxWidth:440, position:"relative" }}>
              <h2 style={{ fontFamily:"var(--font-display)", fontSize: isMobile?18:24, fontWeight:700, color:"#fff", marginBottom:7 }}>Ready to Start Selling on AlEcom?</h2>
              <p style={{ color:"rgba(255,255,255,0.55)", fontSize: isMobile?12:14, lineHeight:1.7, margin:0 }}>Join verified sellers across Ghana. Escrow payments, real buyers, zero risk.</p>
            </div>
            <div style={{ display:"flex", gap:10, flexWrap:"wrap", flexShrink:0, width: isMobile?"100%":"auto" }}>
              {!currentUser ? (
                <button onClick={() => navigate("/register")} style={{ flex: isMobile?1:"none", padding:"11px 20px", borderRadius:"var(--radius-sm)", background:"#fff", color:"var(--primary)", border:"none", fontFamily:"var(--font-body)", fontWeight:700, fontSize:14, cursor:"pointer", textAlign:"center" }}>Create Free Account</button>
              ) : (
                <button onClick={() => navigate("/seller-dashboard")} style={{ flex: isMobile?1:"none", padding:"11px 20px", borderRadius:"var(--radius-sm)", background:"#fff", color:"var(--primary)", border:"none", fontFamily:"var(--font-body)", fontWeight:700, fontSize:14, cursor:"pointer", textAlign:"center" }}>Seller Dashboard</button>
              )}
              <button onClick={() => navigate("/manual")} style={{ flex: isMobile?1:"none", padding:"11px 20px", borderRadius:"var(--radius-sm)", background:"transparent", color:"#fff", border:"1.5px solid rgba(255,255,255,0.25)", fontFamily:"var(--font-body)", fontWeight:600, fontSize:14, cursor:"pointer", textAlign:"center" }}>How It Works</button>
            </div>
          </div>
        </section>

      </div>

      <style>{`
        @keyframes livePulse {
          0%,100% { opacity:1; box-shadow:0 0 5px #34D399; }
          50%      { opacity:0.45; box-shadow:0 0 2px #34D399; }
        }
        @keyframes fadeIn  { from{opacity:0} to{opacity:1} }
        @keyframes slideUp { from{transform:translateY(100%)} to{transform:translateY(0)} }
        ::-webkit-scrollbar { display:none; }
      `}</style>
    </div>
  );
}
