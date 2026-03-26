import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { logout } from "../firebase/auth";
import { listenToNotifications } from "../firebase/db";
import { Avatar } from "./UI";

const NAV_LINKS = [
  { path: "/", label: "Home", icon: "🏠" },
  { path: "/products", label: "Products", icon: "📦" },
  { path: "/services", label: "Services", icon: "🛠" },
  { path: "/requests", label: "Requests", icon: "📋" },
];

const BOTTOM_NAV = [
  { path: "/", icon: "🏠", label: "Home" },
  { path: "/products", icon: "📦", label: "Products" },
  { path: "/services", icon: "🛠", label: "Services" },
  { path: "/requests", icon: "📋", label: "Requests" },
  { path: "/profile", icon: "👤", label: "Profile" },
];

export const Navbar = () => {
  const { currentUser, userDoc, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const searchRef = useRef(null);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
    }
  };

  useEffect(() => {
    if (!currentUser) return;
    const unsub = listenToNotifications(currentUser.uid, (notifs) => {
      setUnread(notifs.filter(n => !n.read).length);
    });
    return unsub;
  }, [currentUser]);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <nav style={{
      position: "sticky", top: 0, zIndex: 100,
      background: "rgba(255,255,255,0.95)",
      backdropFilter: "blur(12px)",
      borderBottom: "1px solid var(--border)",
      height: "var(--nav-height)"
    }}>
      <div className="container" style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        {/* Logo */}
        <Link to="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <div style={{
            width: 36, height: 36, background: "var(--accent)",
            borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "var(--font-display)", fontWeight: 800, color: "#fff", fontSize: 16
          }}>A</div>
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 20, color: "var(--text)" }}>ASVAN</span>
        </Link>

        {/* Desktop Nav Links */}
        <div className="hide-mobile" style={{ display: "flex", gap: 4, alignItems: "center" }}>
          {NAV_LINKS.map(l => (
            <Link key={l.path} to={l.path} style={{
              padding: "8px 14px", borderRadius: 8, fontSize: 14, fontWeight: 500,
              color: location.pathname === l.path ? "var(--accent)" : "var(--text-secondary)",
              background: location.pathname === l.path ? "var(--accent-glow)" : "transparent",
              textDecoration: "none"
            }}>{l.label}</Link>
          ))}
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="hide-mobile" style={{ flex: "0 0 220px" }}>
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: "var(--text-muted)" }}>🔍</span>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search..."
              style={{
                width: "100%", padding: "7px 12px 7px 30px",
                border: "1.5px solid var(--border)", borderRadius: 20,
                fontSize: 13, outline: "none", background: "var(--surface-2)",
                fontFamily: "var(--font-body)", color: "var(--text)"
              }}
            />
          </div>
        </form>

        {/* Right side */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {currentUser ? (
            <>
              {/* Notifications */}
              <Link to="/notifications" style={{ position: "relative", padding: 8, textDecoration: "none" }}>
                <span style={{ fontSize: 20 }}>🔔</span>
                {unread > 0 && (
                  <span style={{
                    position: "absolute", top: 2, right: 2,
                    background: "var(--danger)", color: "#fff", fontSize: 10,
                    fontWeight: 700, borderRadius: "50%", width: 18, height: 18,
                    display: "flex", alignItems: "center", justifyContent: "center"
                  }}>{unread > 9 ? "9+" : unread}</span>
                )}
              </Link>

              {/* User Menu */}
              <div style={{ position: "relative" }}>
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, padding: "4px 8px", borderRadius: 8 }}
                >
                  <Avatar name={userDoc?.displayName || currentUser.email} photoURL={userDoc?.photoURL} size="sm" />
                  <span className="hide-mobile" style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>
                    {userDoc?.displayName?.split(" ")[0] || "User"}
                  </span>
                  <span style={{ fontSize: 10, color: "var(--text-muted)" }}>▾</span>
                </button>

                {menuOpen && (
                  <div style={{
                    position: "absolute", top: "calc(100% + 8px)", right: 0,
                    background: "var(--surface)", border: "1px solid var(--border)",
                    borderRadius: "var(--radius-lg)", padding: 8, minWidth: 200,
                    boxShadow: "var(--shadow-lg)", zIndex: 200
                  }} onClick={() => setMenuOpen(false)}>
                    <NavMenuItem icon="👤" label="Profile" path="/profile" />
                    <NavMenuItem icon="📱" label="Top Up Wallet" path="/momo-payment" />
                    <NavMenuItem icon="💼" label="Orders" path="/orders" />
                    <NavMenuItem icon="💰" label="Wallet" path="/wallet" />
                    <NavMenuItem icon="💬" label="Chat" path="/chat" />
                    {userDoc?.isSeller && <NavMenuItem icon="🏪" label="Seller Dashboard" path="/seller-dashboard" />}
                    {userDoc?.isSeller && <NavMenuItem icon="📋" label="My Listings" path="/my-listings" />}
                    {userDoc?.isSeller && <NavMenuItem icon="⭐" label="Feature a Listing" path="/featured" />}
                    {userDoc?.isSeller && <NavMenuItem icon="📢" label="My Ads" path="/ads" />}
                    {userDoc?.isSeller && <NavMenuItem icon="🎁" label="Subscription" path="/subscriptions" />}
                    {isAdmin && <NavMenuItem icon="⚙️" label="Admin Panel" path="/admin" />}
                    <NavMenuItem icon="📚" label="User Manual" path="/manual" />
                    <hr style={{ margin: "8px 0", border: "none", borderTop: "1px solid var(--border)" }} />
                    <button
                      onClick={handleLogout}
                      style={{
                        display: "flex", alignItems: "center", gap: 10, padding: "8px 12px",
                        width: "100%", border: "none", background: "none", cursor: "pointer",
                        borderRadius: 8, fontSize: 14, color: "var(--danger)", fontFamily: "var(--font-body)"
                      }}
                    >🚪 Sign Out</button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div style={{ display: "flex", gap: 8 }}>
              <Link to="/login" style={{
                padding: "8px 16px", borderRadius: 8, fontSize: 14, fontWeight: 600,
                color: "var(--text)", textDecoration: "none", border: "1.5px solid var(--border)"
              }}>Login</Link>
              <Link to="/register" style={{
                padding: "8px 16px", borderRadius: 8, fontSize: 14, fontWeight: 600,
                background: "var(--accent)", color: "#fff", textDecoration: "none"
              }}>Sign Up</Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

const NavMenuItem = ({ icon, label, path }) => (
  <Link to={path} style={{
    display: "flex", alignItems: "center", gap: 10, padding: "8px 12px",
    borderRadius: 8, textDecoration: "none", color: "var(--text)",
    fontSize: 14, transition: "background 0.15s"
  }}
    onMouseEnter={e => e.currentTarget.style.background = "var(--surface-3)"}
    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
  >
    <span>{icon}</span>{label}
  </Link>
);

export const BottomNav = () => {
  const { currentUser } = useAuth();
  const location = useLocation();

  if (!currentUser) return null;

  return (
    <nav className="show-mobile" style={{
      position: "fixed", bottom: 0, left: 0, right: 0,
      height: "var(--bottom-nav-height)",
      background: "rgba(255,255,255,0.97)",
      backdropFilter: "blur(12px)",
      borderTop: "1px solid var(--border)",
      display: "flex", zIndex: 100
    }}>
      {BOTTOM_NAV.map(item => {
        const active = location.pathname === item.path;
        return (
          <Link key={item.path} to={item.path} style={{
            flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
            justifyContent: "center", textDecoration: "none", gap: 3,
            color: active ? "var(--accent)" : "var(--text-muted)",
            transition: "color 0.2s"
          }}>
            <span style={{ fontSize: 20 }}>{item.icon}</span>
            <span style={{ fontSize: 10, fontWeight: 600 }}>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
};
