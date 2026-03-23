import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getAllUsers, getAllProducts, getAllOrders, getAllTransactions, getAllReports, getAdminLogs, getAllWithdrawals, getAllEscrow } from "../../firebase/db";
import { Spinner, StatCard, PageHeader, Badge, StatusBadge } from "../../components/UI";
import { onSnapshot, collection, query, orderBy, limit } from "firebase/firestore";
import { db } from "../../firebase/config";

const ADMIN_NAV = [
  { path: "/admin", label: "Dashboard", icon: "📊" },
  { path: "/admin/users", label: "Users", icon: "👥" },
  { path: "/admin/sellers", label: "Sellers", icon: "🏪" },
  { path: "/admin/products", label: "Products", icon: "📦" },
  { path: "/admin/services", label: "Services", icon: "🛠" },
  { path: "/admin/orders", label: "Orders", icon: "📋" },
  { path: "/admin/requests", label: "Requests", icon: "📝" },
  { path: "/admin/payments", label: "Payments", icon: "💰" },
  { path: "/admin/escrow", label: "Escrow", icon: "🔒" },
  { path: "/admin/withdrawals", label: "Withdrawals", icon: "💸" },
  { path: "/admin/ads", label: "Ads", icon: "📢" },
  { path: "/admin/featured", label: "Featured", icon: "⭐" },
  { path: "/admin/reports", label: "Reports", icon: "🚩" },
  { path: "/admin/verification", label: "Verification", icon: "✓" },
  { path: "/admin/settings", label: "Settings", icon: "⚙️" },
  { path: "/admin/analytics", label: "Analytics", icon: "📈" },
  { path: "/admin/logs", label: "Logs", icon: "📝" },
  { path: "/admin/announce", label: "Announce", icon: "📣" },
];

export const AdminLayout = ({ children }) => {
  const { isAdmin, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !isAdmin) navigate("/");
  }, [isAdmin, loading]);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (loading) return <Spinner center />;
  if (!isAdmin) return null;

  return (
    <div style={{ display: "flex", minHeight: "calc(100vh - var(--nav-height))", flexDirection: "column" }}>
      {/* Mobile Admin Nav Bar */}
      <div className="show-mobile" style={{
        background: "var(--primary)", padding: "12px 16px",
        display: "flex", alignItems: "center", justifyContent: "space-between"
      }}>
        <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 14, color: "#fff" }}>⚙️ Admin Panel</span>
        <button
          onClick={() => setMobileMenuOpen(v => !v)}
          style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "#fff", borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontFamily: "var(--font-body)", fontSize: 13 }}
        >
          {mobileMenuOpen ? "✕ Close" : "☰ Menu"}
        </button>
      </div>
      {mobileMenuOpen && (
        <div className="show-mobile" style={{
          background: "var(--primary)", borderBottom: "1px solid rgba(255,255,255,0.1)",
          display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 2, padding: 8
        }}>
          {ADMIN_NAV.map(item => (
            <Link key={item.path} to={item.path}
              onClick={() => setMobileMenuOpen(false)}
              style={{
                display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
                padding: "10px 6px", borderRadius: 8, textDecoration: "none",
                color: "rgba(255,255,255,0.8)", fontSize: 11, fontWeight: 600, textAlign: "center"
              }}
            >
              <span style={{ fontSize: 18 }}>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
      )}

      <div style={{ display: "flex", flex: 1 }}>
        {/* Sidebar - desktop only */}
        <aside style={{
          width: 220, background: "var(--primary)", color: "#fff",
          display: "flex", flexDirection: "column", flexShrink: 0
        }} className="hide-mobile">
          <div style={{ padding: "20px 16px 12px", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 15 }}>⚙️ Admin Panel</div>
          </div>
          <nav style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
            {ADMIN_NAV.map(item => (
              <Link
                key={item.path}
                to={item.path}
                style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "9px 16px",
                  color: "rgba(255,255,255,0.75)", textDecoration: "none", fontSize: 13,
                  transition: "all 0.15s"
                }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = "#fff"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "rgba(255,255,255,0.75)"; }}
              >
                <span style={{ fontSize: 16 }}>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>
          <div style={{ padding: "12px 16px", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
            <Link to="/" style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, textDecoration: "none" }}>← Back to Site</Link>
          </div>
        </aside>

        {/* Content */}
        <main style={{ flex: 1, overflowY: "auto", background: "var(--surface-2)", padding: "28px 24px", minWidth: 0 }}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default function AdminDashboard() {
  const [stats, setStats] = useState({ users: 0, products: 0, orders: 0, revenue: 0, reports: 0, withdrawals: 0 });
  const [recentOrders, setRecentOrders] = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [users, products, orders, transactions, reports, withdrawals] = await Promise.all([
          getAllUsers(), getAllProducts(), getAllOrders(), getAllTransactions(), getAllReports(), getAllWithdrawals()
        ]);
        const revenue = transactions.filter(t => t.type === "credit" && t.note?.includes("order")).reduce((a, t) => a + (t.amount || 0), 0);
        setStats({
          users: users.length,
          products: products.length,
          orders: orders.length,
          revenue,
          reports: reports.filter(r => r.status === "pending").length,
          withdrawals: withdrawals.filter(w => w.status === "pending").length
        });
        setRecentOrders(orders.slice(0, 5));
        setRecentUsers(users.slice(0, 5));
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <Spinner center />;

  return (
    <div>
      <PageHeader title="Admin Dashboard" subtitle="Platform overview and management" />

      {/* Alerts */}
      {(stats.reports > 0 || stats.withdrawals > 0) && (
        <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
          {stats.reports > 0 && (
            <div className="alert alert-warning" style={{ flex: 1 }}>
              <span>🚩</span>
              <span>{stats.reports} pending report{stats.reports > 1 ? "s" : ""} require review. <Link to="/admin/reports" style={{ fontWeight: 700 }}>Review now →</Link></span>
            </div>
          )}
          {stats.withdrawals > 0 && (
            <div className="alert alert-info" style={{ flex: 1 }}>
              <span>💸</span>
              <span>{stats.withdrawals} withdrawal{stats.withdrawals > 1 ? "s" : ""} pending approval. <Link to="/admin/withdrawals" style={{ fontWeight: 700 }}>Approve →</Link></span>
            </div>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-4" style={{ gap: 16, marginBottom: 28 }}>
        <StatCard icon="👥" label="Total Users" value={stats.users} color="#4F7CFF" />
        <StatCard icon="📦" label="Listings" value={stats.products} color="#10B981" />
        <StatCard icon="📋" label="Orders" value={stats.orders} color="#F59E0B" />
        <StatCard icon="💰" label="Revenue" value={`GHS ${stats.revenue.toFixed(0)}`} color="#6B48FF" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        {/* Recent Orders */}
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
            <div style={{ fontWeight: 700 }}>Recent Orders</div>
            <Link to="/admin/orders" style={{ fontSize: 13, color: "var(--accent)" }}>View all</Link>
          </div>
          {recentOrders.length === 0 ? <div style={{ color: "var(--text-muted)", fontSize: 14 }}>No orders yet</div> :
            recentOrders.map(o => (
              <div key={o.id} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--border)", fontSize: 14 }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{o.itemTitle}</div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>#{o.id.slice(0, 8)}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: 700 }}>GHS {o.amount?.toFixed(2)}</div>
                  <StatusBadge status={o.status} />
                </div>
              </div>
            ))
          }
        </div>

        {/* Recent Users */}
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
            <div style={{ fontWeight: 700 }}>Recent Users</div>
            <Link to="/admin/users" style={{ fontSize: 13, color: "var(--accent)" }}>View all</Link>
          </div>
          {recentUsers.map(u => (
            <div key={u.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--accent-glow)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "var(--accent)", fontSize: 13 }}>
                {u.displayName?.[0] || "?"}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{u.displayName}</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{u.email}</div>
              </div>
              <Badge type={u.isSeller ? "primary" : "muted"}>{u.isSeller ? "Seller" : "Buyer"}</Badge>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Admin Actions */}
      <div className="card" style={{ marginTop: 24 }}>
        <div style={{ fontWeight: 700, marginBottom: 16 }}>Quick Actions</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 10 }}>
          {[
            { icon: "📦", label: "Review Products", path: "/admin/products" },
            { icon: "🏪", label: "Approve Sellers", path: "/admin/sellers" },
            { icon: "🚩", label: "Review Reports", path: "/admin/reports" },
            { icon: "💸", label: "Withdrawals", path: "/admin/withdrawals" },
            { icon: "✓", label: "Verification", path: "/admin/verification" },
            { icon: "📣", label: "Announce", path: "/admin/announce" },
            { icon: "⚙️", label: "Settings", path: "/admin/settings" },
            { icon: "📈", label: "Analytics", path: "/admin/analytics" },
          ].map(a => (
            <Link key={a.path} to={a.path} style={{
              display: "flex", flexDirection: "column", alignItems: "center",
              gap: 6, padding: "14px 12px", border: "1.5px solid var(--border)",
              borderRadius: "var(--radius-sm)", textDecoration: "none", color: "var(--text)",
              fontSize: 13, fontWeight: 600, textAlign: "center", transition: "all 0.2s"
            }}
              onMouseEnter={e => e.currentTarget.style.borderColor = "var(--accent)"}
              onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border)"}
            >
              <span style={{ fontSize: 22 }}>{a.icon}</span>
              {a.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
