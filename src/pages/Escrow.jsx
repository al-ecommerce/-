import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebase/config";
import { getAllEscrow, getUserOrders } from "../firebase/db";
import { Spinner, PageHeader, EmptyState, StatusBadge, Badge, Button, Alert } from "../components/UI";

export function EscrowPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [escrows, setEscrows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return navigate("/login");
    const load = async () => {
      try {
        const snap = await getDocs(query(collection(db, "escrow"),
          where("buyerId", "==", currentUser.uid)));
        const snap2 = await getDocs(query(collection(db, "escrow"),
          where("sellerId", "==", currentUser.uid)));
        const all = [
          ...snap.docs.map(d => ({ id: d.id, ...d.data() })),
          ...snap2.docs.map(d => ({ id: d.id, ...d.data() }))
        ];
        const unique = Array.from(new Map(all.map(e => [e.id, e])).values());
        setEscrows(unique.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)));
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    load();
  }, [currentUser]);

  return (
    <div className="page-wrapper">
      <div className="container" style={{ paddingTop: 28 }}>
        <PageHeader title="Escrow" subtitle="Track your secured transactions" />

        <Alert type="info">
          🔒 Escrow holds your payment securely until both parties complete the transaction. Funds are only released when you confirm delivery.
        </Alert>

        {/* How it works */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, margin: "24px 0" }}>
          {[
            { step: "1", title: "Buyer Pays", desc: "Funds locked in escrow", icon: "💳" },
            { step: "2", title: "Seller Delivers", desc: "Item/service delivered", icon: "📦" },
            { step: "3", title: "Buyer Confirms", desc: "Buyer confirms receipt", icon: "✓" },
            { step: "4", title: "Funds Released", desc: "Seller receives payment", icon: "💰" },
          ].map(s => (
            <div key={s.step} className="card" style={{ textAlign: "center", padding: 16 }}>
              <div style={{ fontSize: 28, marginBottom: 6 }}>{s.icon}</div>
              <div style={{ background: "var(--accent)", color: "#fff", borderRadius: "50%", width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, margin: "0 auto 8px" }}>{s.step}</div>
              <div style={{ fontWeight: 700, fontSize: 13 }}>{s.title}</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{s.desc}</div>
            </div>
          ))}
        </div>

        {loading ? <Spinner center /> : escrows.length === 0 ? (
          <EmptyState icon="🔒" title="No escrow transactions" description="Your escrow history will appear here" />
        ) : (
          <div className="table-wrapper">
            <table>
              <thead><tr><th>Order ID</th><th>Amount</th><th>Role</th><th>Status</th><th>Date</th><th></th></tr></thead>
              <tbody>
                {escrows.map(e => (
                  <tr key={e.id}>
                    <td style={{ fontFamily: "monospace", fontSize: 13 }}>#{e.orderId?.slice(0, 8)}</td>
                    <td style={{ fontWeight: 700 }}>GHS {e.amount?.toFixed(2)}</td>
                    <td><Badge type="muted">{e.buyerId === currentUser.uid ? "Buyer" : "Seller"}</Badge></td>
                    <td><StatusBadge status={e.status} /></td>
                    <td style={{ color: "var(--text-muted)", fontSize: 13 }}>
                      {e.createdAt?.seconds ? new Date(e.createdAt.seconds * 1000).toLocaleDateString() : "—"}
                    </td>
                    <td><Button variant="secondary" size="sm" onClick={() => navigate(`/orders/${e.orderId}`)}>View Order</Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export function InstallmentsPage() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const mockPlans = [
    { id: 1, item: "Samsung TV 55\"", total: 4500, paid: 1500, installments: 3, perInstallment: 1500, nextDue: "2024-02-15", status: "active" },
    { id: 2, item: "iPhone 15 Pro", total: 12000, paid: 4000, installments: 3, perInstallment: 4000, nextDue: "2024-03-01", status: "active" },
  ];

  return (
    <div className="page-wrapper">
      <div className="container" style={{ paddingTop: 28, maxWidth: 800 }}>
        <PageHeader title="Installment Plans" subtitle="Pay for big purchases in smaller amounts" />

        <Alert type="warning">
          ⚠️ Installment payment is a mock feature. In production, this would integrate with a payment provider.
        </Alert>

        {/* Features */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, margin: "24px 0" }}>
          {[
            { icon: "💳", title: "0% Interest", desc: "On select items" },
            { icon: "📅", title: "Flexible Terms", desc: "3, 6, or 12 months" },
            { icon: "🔒", title: "Secure", desc: "Escrow protected" },
          ].map(f => (
            <div key={f.title} className="card" style={{ textAlign: "center" }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>{f.icon}</div>
              <div style={{ fontWeight: 700 }}>{f.title}</div>
              <div style={{ fontSize: 13, color: "var(--text-muted)" }}>{f.desc}</div>
            </div>
          ))}
        </div>

        {!currentUser ? (
          <Alert type="info">Please <span style={{ fontWeight: 700, cursor: "pointer" }} onClick={() => navigate("/login")}>login</span> to view your installment plans.</Alert>
        ) : (
          <div>
            <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, marginBottom: 16 }}>Active Plans (Demo)</h3>
            {mockPlans.map(plan => (
              <div key={plan.id} className="card" style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{plan.item}</div>
                    <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>
                      Next payment: {plan.nextDue}
                    </div>
                  </div>
                  <Badge type="success">Active</Badge>
                </div>
                {/* Progress */}
                <div style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
                    <span>GHS {plan.paid.toLocaleString()} paid</span>
                    <span>GHS {plan.total.toLocaleString()} total</span>
                  </div>
                  <div style={{ height: 8, background: "var(--surface-3)", borderRadius: 4, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${(plan.paid / plan.total) * 100}%`, background: "var(--accent)", borderRadius: 4 }} />
                  </div>
                </div>
                <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                  <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{plan.installments} installments of GHS {plan.perInstallment.toLocaleString()}</span>
                  <Button variant="primary" size="sm">Pay GHS {plan.perInstallment.toLocaleString()}</Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* How it works */}
        <div style={{ marginTop: 32 }}>
          <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, marginBottom: 16 }}>How Installments Work</h3>
          {[
            ["Choose installment option at checkout", "Select 3, 6, or 12 month plan"],
            ["Pay first installment", "Down payment locks your order in escrow"],
            ["Receive your item", "Seller delivers after first payment"],
            ["Continue monthly payments", "Remaining installments auto-deducted from wallet"],
          ].map(([title, desc], i) => (
            <div key={i} style={{ display: "flex", gap: 16, marginBottom: 16, alignItems: "flex-start" }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--accent-glow)", color: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, flexShrink: 0 }}>{i + 1}</div>
              <div>
                <div style={{ fontWeight: 600 }}>{title}</div>
                <div style={{ fontSize: 13, color: "var(--text-muted)" }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
