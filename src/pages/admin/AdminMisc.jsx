import { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../firebase/config";
import { useAuth } from "../../context/AuthContext";
import {
  getPlatformSettings, updatePlatformSettings,
  getAllAds, updateAd, createAd,
  getAllFeaturedListings, updateFeaturedListing,
  getAdminLogs, getAllUsers, getAllOrders, getAllTransactions,
  logAdminAction
} from "../../firebase/db";
import { sendAnnouncementEmail } from "../../services/emailService";
import { Spinner, Button, Badge, StatusBadge, PageHeader, StatCard, FormInput, Alert, Modal, FormTextarea, toast } from "../../components/UI";

// ─── PLATFORM SETTINGS ─────────────────────────────────────
export function AdminSettings() {
  const { userDoc: adminDoc } = useAuth();
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getPlatformSettings().then(s => { setSettings(s); setLoading(false); });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updatePlatformSettings(settings);
      await logAdminAction(adminDoc.uid, "updateSettings", {});
      toast.success("Settings saved!");
    } catch (e) { toast.error("Save failed"); }
    setSaving(false);
  };

  const f = (key) => ({
    value: settings?.[key] || "",
    onChange: e => setSettings(p => ({ ...p, [key]: parseFloat(e.target.value) || e.target.value }))
  });

  if (loading || !settings) return <Spinner center />;

  return (
    <div style={{ maxWidth: 680 }}>
      <PageHeader title="Platform Settings" subtitle="Configure fees and platform behavior" />
      <Alert type="warning">Changes take effect immediately for all new transactions.</Alert>

      <div className="card" style={{ marginBottom: 20 }}>
        <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, marginBottom: 16 }}>💰 Fee Settings</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <FormInput label="Platform Commission (%)" type="number" min="0" max="50" {...f("commissionRate")} hint="Applied on each completed order" />
          <FormInput label="Escrow Fee (%)" type="number" min="0" max="20" {...f("escrowFee")} hint="Added to each order total" />
          <FormInput label="Withdrawal Fee (%)" type="number" min="0" max="20" {...f("withdrawalFee")} hint="Deducted from withdrawal" />
          <FormInput label="Seller Verification Fee (GHS)" type="number" min="0" {...f("sellerVerificationFee")} hint="One-time fee for verification" />
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, marginBottom: 16 }}>📅 Subscription Plans</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <FormInput label="Basic Plan (GHS/month)" type="number" {...f("basicSubscriptionPrice")} />
          <FormInput label="Premium Plan (GHS/month)" type="number" {...f("premiumSubscriptionPrice")} />
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, marginBottom: 16 }}>⭐ Featured Listings</h3>
        <FormInput label="Featured Listing Fee (GHS)" type="number" {...f("featuredListingFee")} hint="Fee to feature a listing" />
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, marginBottom: 16 }}>📋 Installment Settings</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
          <FormInput label="3-month Interest (%)" type="number" {...f("installment3Rate")} />
          <FormInput label="6-month Interest (%)" type="number" {...f("installment6Rate")} />
          <FormInput label="12-month Interest (%)" type="number" {...f("installment12Rate")} />
        </div>
      </div>

      <Button variant="primary" loading={saving} onClick={handleSave} size="lg">Save All Settings</Button>
    </div>
  );
}

// ─── ANALYTICS ─────────────────────────────────────────────
export function AdminAnalytics() {
  const [data, setData] = useState({ users: [], orders: [], transactions: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getAllUsers(), getAllOrders(), getAllTransactions()])
      .then(([users, orders, transactions]) => {
        setData({ users, orders, transactions });
        setLoading(false);
      });
  }, []);

  if (loading) return <Spinner center />;

  const totalRevenue = data.orders.filter(o => o.status === "completed").reduce((a, o) => a + (o.commission || 0), 0);
  const totalEscrowFees = data.orders.reduce((a, o) => a + (o.escrowFee || 0), 0);
  const sellers = data.users.filter(u => u.isSeller).length;
  const buyers = data.users.filter(u => !u.isSeller).length;
  const completedOrders = data.orders.filter(o => o.status === "completed").length;
  const cancelledOrders = data.orders.filter(o => o.status === "cancelled").length;
  const conversionRate = data.orders.length > 0 ? ((completedOrders / data.orders.length) * 100).toFixed(1) : 0;

  const barMax = Math.max(...Object.values({ completed: completedOrders, cancelled: cancelledOrders, pending: data.orders.filter(o => o.status === "paid").length }) || [1]);

  return (
    <div>
      <PageHeader title="Platform Analytics" subtitle="Performance metrics and insights" />

      <div className="grid grid-4" style={{ gap: 16, marginBottom: 28 }}>
        <StatCard icon="💰" label="Platform Revenue" value={`GHS ${totalRevenue.toFixed(0)}`} color="#10B981" sublabel="From commissions" />
        <StatCard icon="🔒" label="Escrow Fees" value={`GHS ${totalEscrowFees.toFixed(0)}`} color="#6B48FF" />
        <StatCard icon="📈" label="Conversion Rate" value={`${conversionRate}%`} color="#4F7CFF" />
        <StatCard icon="👥" label="Total Users" value={data.users.length} color="#F59E0B" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24 }}>
        {/* User Breakdown */}
        <div className="card">
          <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, marginBottom: 16 }}>User Breakdown</h3>
          {[
            { label: "Buyers", value: buyers, color: "#4F7CFF" },
            { label: "Sellers", value: sellers, color: "#10B981" },
            { label: "Admins", value: data.users.filter(u => u.role === "admin").length, color: "#EF4444" },
            { label: "Verified Sellers", value: data.users.filter(u => u.isSellerVerified).length, color: "#F59E0B" },
          ].map(item => (
            <div key={item.label} style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: 14 }}>
                <span>{item.label}</span><span style={{ fontWeight: 700 }}>{item.value}</span>
              </div>
              <div style={{ height: 8, background: "var(--surface-3)", borderRadius: 4, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${data.users.length ? (item.value / data.users.length) * 100 : 0}%`, background: item.color, borderRadius: 4 }} />
              </div>
            </div>
          ))}
        </div>

        {/* Order Status */}
        <div className="card">
          <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, marginBottom: 16 }}>Order Status</h3>
          {[
            { label: "Completed", value: completedOrders, color: "#10B981" },
            { label: "Pending", value: data.orders.filter(o => o.status === "paid").length, color: "#F59E0B" },
            { label: "Cancelled", value: cancelledOrders, color: "#EF4444" },
            { label: "Refunded", value: data.orders.filter(o => o.status === "refunded").length, color: "#6B7280" },
          ].map(item => (
            <div key={item.label} style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: 14 }}>
                <span>{item.label}</span><span style={{ fontWeight: 700 }}>{item.value}</span>
              </div>
              <div style={{ height: 8, background: "var(--surface-3)", borderRadius: 4, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${barMax ? (item.value / barMax) * 100 : 0}%`, background: item.color, borderRadius: 4 }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Revenue Breakdown */}
      <div className="card">
        <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, marginBottom: 16 }}>Revenue Sources</h3>
        <div className="grid grid-4" style={{ gap: 16 }}>
          {[
            { label: "Order Commissions", value: totalRevenue, icon: "💹" },
            { label: "Escrow Fees", value: totalEscrowFees, icon: "🔒" },
            { label: "Verification Fees", value: data.transactions.filter(t => t.note?.includes("verification")).reduce((a, t) => a + t.amount, 0), icon: "✓" },
            { label: "Featured Fees", value: data.transactions.filter(t => t.note?.includes("featured")).reduce((a, t) => a + t.amount, 0), icon: "⭐" },
          ].map(r => (
            <div key={r.label} style={{ textAlign: "center", padding: "16px 12px", background: "var(--surface-3)", borderRadius: "var(--radius-sm)" }}>
              <div style={{ fontSize: 24 }}>{r.icon}</div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 800, marginTop: 6 }}>GHS {r.value.toFixed(0)}</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{r.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── ADMIN LOGS ─────────────────────────────────────────────
export function AdminLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAdminLogs().then(d => { setLogs(d); setLoading(false); });
  }, []);

  return (
    <div>
      <PageHeader title="Admin Activity Logs" subtitle="Track all admin actions" />
      {loading ? <Spinner center /> : (
        <div className="table-wrapper">
          <table>
            <thead><tr><th>Admin</th><th>Action</th><th>Details</th><th>Time</th></tr></thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.id}>
                  <td style={{ fontSize: 12, fontFamily: "monospace" }}>{log.adminId?.slice(0, 12)}...</td>
                  <td><Badge type="primary">{log.action}</Badge></td>
                  <td style={{ fontSize: 12, maxWidth: 200 }}><div className="truncate">{JSON.stringify(log.details)}</div></td>
                  <td style={{ fontSize: 12, color: "var(--text-muted)" }}>
                    {log.createdAt?.seconds ? new Date(log.createdAt.seconds * 1000).toLocaleString() : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── ANNOUNCEMENTS ─────────────────────────────────────────
export function AdminAnnounce() {
  const { userDoc: adminDoc } = useAuth();
  const [form, setForm] = useState({ subject: "", message: "", targetRole: "all" });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSend = async () => {
    if (!form.subject || !form.message) return toast.error("Fill all fields");
    setLoading(true);
    try {
      const users = await getAllUsers();
      const targets = users.filter(u => form.targetRole === "all" || (form.targetRole === "sellers" && u.isSeller) || (form.targetRole === "buyers" && !u.isSeller));
      let sent = 0;
      for (const user of targets) {
        try {
          await sendAnnouncementEmail(user.email, user.displayName, form.subject, form.message);
          sent++;
          await new Promise(r => setTimeout(r, 100)); // rate limit
        } catch (e) { }
      }
      await logAdminAction(adminDoc.uid, "sendAnnouncement", { subject: form.subject, targetRole: form.targetRole, sent });
      setDone(true);
      toast.success(`Announcement sent to ${sent} users!`);
    } catch (e) { toast.error("Send failed"); }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: 600 }}>
      <PageHeader title="Send Announcement" subtitle="Broadcast email to platform users" />
      {done && <Alert type="success">Announcement sent successfully!</Alert>}
      <div className="card">
        <div className="form-group">
          <label className="form-label">Target Audience</label>
          <select className="form-select" value={form.targetRole} onChange={e => setForm(p => ({ ...p, targetRole: e.target.value }))}>
            <option value="all">All Users</option>
            <option value="sellers">Sellers Only</option>
            <option value="buyers">Buyers Only</option>
          </select>
        </div>
        <FormInput label="Subject" value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))} placeholder="Platform Announcement" />
        <div className="form-group">
          <label className="form-label">Message</label>
          <textarea className="form-textarea" rows={6} value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))} placeholder="Write your announcement..." />
        </div>
        <div style={{ background: "var(--accent-glow)", borderRadius: "var(--radius-sm)", padding: 12, marginBottom: 16, fontSize: 13, color: "var(--text-secondary)" }}>
          ⚠️ This will send an email to all users matching your filter. Use responsibly.
        </div>
        <Button variant="primary" loading={loading} onClick={handleSend}>📣 Send Announcement</Button>
      </div>
    </div>
  );
}

// ─── MANAGE ADS ─────────────────────────────────────────────
export function AdminAds() {
  const { userDoc: adminDoc } = useAuth();
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllAds().then(d => { setAds(d); setLoading(false); });
  }, []);

  const handleStatus = async (id, status) => {
    await updateAd(id, { status });
    await logAdminAction(adminDoc.uid, `ad_${status}`, { adId: id });
    setAds(prev => prev.map(a => a.id === id ? { ...a, status } : a));
    toast.success(`Ad ${status}`);
  };

  return (
    <div>
      <PageHeader title="Manage Ads" subtitle={`${ads.length} advertisements`} />
      {loading ? <Spinner center /> : (
        <div className="table-wrapper">
          <table>
            <thead><tr><th>Title</th><th>Advertiser</th><th>Clicks</th><th>Impressions</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {ads.map(a => (
                <tr key={a.id}>
                  <td style={{ fontWeight: 600 }}>{a.title}</td>
                  <td style={{ fontSize: 13 }}>{a.advertiserName}</td>
                  <td>{a.clicks || 0}</td>
                  <td>{a.impressions || 0}</td>
                  <td><StatusBadge status={a.status} /></td>
                  <td>
                    <div style={{ display: "flex", gap: 5 }}>
                      {a.status !== "approved" && <Button size="sm" variant="success" onClick={() => handleStatus(a.id, "approved")}>✓ Approve</Button>}
                      {a.status !== "rejected" && <Button size="sm" variant="danger" onClick={() => handleStatus(a.id, "rejected")}>✕ Reject</Button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── MANAGE FEATURED ───────────────────────────────────────
export function AdminFeatured() {
  const { userDoc: adminDoc } = useAuth();
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllFeaturedListings().then(d => { setFeatured(d); setLoading(false); });
  }, []);

  const handleStatus = async (id, status) => {
    await updateFeaturedListing(id, { status });
    await logAdminAction(adminDoc.uid, `featured_${status}`, { listingId: id });
    setFeatured(prev => prev.map(f => f.id === id ? { ...f, status } : f));
    toast.success(`Featured listing ${status}`);
  };

  return (
    <div>
      <PageHeader title="Featured Listings" subtitle="Manage promoted listings" />
      {loading ? <Spinner center /> : (
        <div className="table-wrapper">
          <table>
            <thead><tr><th>Item</th><th>Seller</th><th>Type</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {featured.map(f => (
                <tr key={f.id}>
                  <td style={{ fontWeight: 600 }}>{f.itemTitle}</td>
                  <td style={{ fontSize: 13 }}>{f.sellerName}</td>
                  <td><Badge type="muted">{f.itemType}</Badge></td>
                  <td><StatusBadge status={f.status} /></td>
                  <td>
                    <div style={{ display: "flex", gap: 5 }}>
                      {f.status !== "approved" && <Button size="sm" variant="success" onClick={() => handleStatus(f.id, "approved")}>✓</Button>}
                      {f.status !== "rejected" && <Button size="sm" variant="danger" onClick={() => handleStatus(f.id, "rejected")}>✕</Button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── SUSPICIOUS ACTIVITY ────────────────────────────────
export function AdminSuspiciousActivity() {
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const snap = await getDocs(collection(db, "suspiciousActivity"));
        setItems(
          snap.docs
            .map(d => ({ id: d.id, ...d.data() }))
            .sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0))
        );
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    load();
  }, []);

  const typeColor = {
    fake_momo_ref:       "var(--danger)",
    momo_rate_limit_hit: "var(--warning)",
    db_flood_attempt:    "var(--danger)",
    spam_detected:       "var(--warning)",
  };

  return (
    <div>
      <PageHeader title="Suspicious Activity" subtitle="Flagged actions requiring admin review" />
      {loading ? <Spinner center /> : items.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🛡️</div>
          <h3>No suspicious activity</h3>
          <p>Platform is clean.</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr><th>Type</th><th>User ID</th><th>Details</th><th>Time</th></tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id}>
                  <td>
                    <span style={{ color: typeColor[item.type] || "var(--text)", fontWeight: 700, fontSize: 13 }}>
                      ⚠ {item.type?.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td style={{ fontFamily: "monospace", fontSize: 12 }}>{item.uid?.slice(0, 14)}...</td>
                  <td style={{ fontSize: 12, maxWidth: 200 }}>
                    <div className="truncate">{JSON.stringify(item.details)}</div>
                  </td>
                  <td style={{ fontSize: 12, color: "var(--text-muted)" }}>
                    {item.timestamp?.seconds ? new Date(item.timestamp.seconds * 1000).toLocaleString() : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── DISPUTE CENTER ───────────────────────────────────────
export function AdminDisputeCenter() {
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const snap = await getDocs(collection(db, "disputes"));
        setDisputes(
          snap.docs.map(d => ({ id: d.id, ...d.data() }))
        );
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    };
    load();
  }, []);

  return (
    <div>
      <PageHeader title="Dispute Center" subtitle="Resolve buyer and seller disputes" />
      {loading ? <Spinner center /> : disputes.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">⚖️</div>
          <h3>No disputes</h3>
          <p>All transactions are clean.</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Order</th>
                <th>Buyer</th>
                <th>Seller</th>
                <th>Reason</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {disputes.map(d => (
                <tr key={d.id}>
                  <td>{d.orderId}</td>
                  <td style={{ fontSize: 12 }}>{d.buyerId?.slice(0, 10)}...</td>
                  <td style={{ fontSize: 12 }}>{d.sellerId?.slice(0, 10)}...</td>
                  <td>{d.reason}</td>
                  <td><StatusBadge status={d.status || "pending"} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}