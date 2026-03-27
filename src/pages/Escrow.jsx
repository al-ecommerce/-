import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebase/config";
import {
  updateOrder, updateEscrow, creditWallet, createNotification,
  getUserDoc, getPlatformSettings
} from "../firebase/db";
import { sendOrderCompletedEmail } from "../services/emailService";
import { Spinner, PageHeader, EmptyState, StatusBadge, Badge, Button, Alert, Modal, FormTextarea, toast } from "../components/UI";

// ─── STATUS TIMELINE ──────────────────────────────────────
const EscrowTimeline = ({ escrow, isBuyer }) => {
  const steps = [
    { key: "held",     label: "Payment Received",   desc: "Buyer paid. Funds locked in escrow.",         icon: "💳" },
    { key: "delivery", label: "Awaiting Delivery",  desc: "Seller is fulfilling the order.",             icon: "📦" },
    { key: "confirm",  label: "Confirm Receipt",    desc: isBuyer ? "You confirm delivery." : "Awaiting buyer confirmation.", icon: "✅" },
    { key: "released", label: "Funds Released",     desc: "Payment sent to seller's wallet.",            icon: "💰" },
  ];
  const currentIdx =
    escrow.status === "held"     ? 1 :
    escrow.status === "released" ? 3 :
    escrow.status === "refunded" ? 3 : 2;

  return (
    <div style={{ display: "flex", gap: 0, margin: "20px 0", position: "relative" }}>
      {/* Connector line */}
      <div style={{
        position: "absolute", top: 20, left: "10%", right: "10%", height: 2,
        background: "var(--border)", zIndex: 0,
      }} />
      <div style={{
        position: "absolute", top: 20, left: "10%", height: 2, zIndex: 1,
        width: `${Math.min(currentIdx / (steps.length - 1), 1) * 80}%`,
        background: escrow.status === "refunded" ? "var(--danger)" : "var(--accent)",
        transition: "width 0.5s ease",
      }} />
      {steps.map((step, i) => {
        const done = i < currentIdx;
        const active = i === currentIdx;
        return (
          <div key={step.key} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", position: "relative", zIndex: 2 }}>
            <div style={{
              width: 40, height: 40, borderRadius: "50%", marginBottom: 10,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 18,
              background: done ? "var(--accent)" : active ? "var(--accent-glow)" : "var(--surface-3)",
              border: `2px solid ${done || active ? "var(--accent)" : "var(--border)"}`,
              transition: "all 0.3s",
            }}>
              {done ? "✓" : step.icon}
            </div>
            <div style={{ fontSize: 12, fontWeight: active || done ? 700 : 500, color: done || active ? "var(--text)" : "var(--text-muted)", textAlign: "center" }}>
              {step.label}
            </div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", textAlign: "center", marginTop: 2, maxWidth: 90 }}>
              {step.desc}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ─── ESCROW CARD ──────────────────────────────────────────
const EscrowCard = ({ escrow, currentUser, onAction }) => {
  const navigate = useNavigate();
  const isBuyer  = escrow.buyerId  === currentUser.uid;
  const isSeller = escrow.sellerId === currentUser.uid;
  const [showDispute, setShowDispute] = useState(false);
  const [disputeText, setDisputeText] = useState("");
  const [acting, setActing] = useState(false);

  const handleRelease = async () => {
    setActing(true);
    try { await onAction("release", escrow); toast.success("Payment released!"); }
    catch (e) { toast.error(e.message); }
    setActing(false);
  };

  const handleDispute = async () => {
    if (!disputeText.trim()) return toast.error("Please describe the issue");
    setActing(true);
    try { await onAction("dispute", escrow, disputeText); setShowDispute(false); toast.success("Dispute raised. Admin will review."); }
    catch (e) { toast.error(e.message); }
    setActing(false);
  };

  const statusColor = {
    held:     "var(--warning)",
    released: "var(--success)",
    refunded: "var(--danger)",
    disputed: "var(--danger)",
  }[escrow.status] || "var(--accent)";

  return (
    <div style={{
      background: "var(--surface)", border: "1px solid var(--border)",
      borderRadius: "var(--radius-xl)", overflow: "hidden", marginBottom: 16,
    }}>
      {/* Header */}
      <div style={{
        padding: "16px 20px", borderBottom: "1px solid var(--border)",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        background: "var(--surface-2)",
      }}>
        <div>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15 }}>
            Order #{escrow.orderId?.slice(0, 8)?.toUpperCase()}
          </div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
            {escrow.createdAt?.seconds ? new Date(escrow.createdAt.seconds * 1000).toLocaleString("en-GH", { dateStyle: "medium", timeStyle: "short" }) : "—"}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 20, color: "var(--accent)" }}>
            GHS {Number(escrow.amount).toFixed(2)}
          </div>
          <div style={{
            display: "inline-block", fontSize: 12, fontWeight: 700,
            padding: "2px 10px", borderRadius: 20,
            background: statusColor + "18", color: statusColor, marginTop: 2,
          }}>
            {escrow.status === "held" ? "🔒 In Escrow" : escrow.status === "released" ? "✓ Released" : escrow.status === "refunded" ? "↩ Refunded" : "⚠ Disputed"}
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: "20px" }}>
        {/* Role badge */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <Badge type={isBuyer ? "primary" : "success"}>
            {isBuyer ? "👤 You are the Buyer" : "🏪 You are the Seller"}
          </Badge>
          {escrow.itemTitle && <Badge type="muted">{escrow.itemTitle}</Badge>}
        </div>

        {/* Timeline */}
        <EscrowTimeline escrow={escrow} isBuyer={isBuyer} />

        {/* Breakdown */}
        <div style={{
          background: "var(--surface-2)", borderRadius: "var(--radius-sm)",
          padding: "14px 16px", marginBottom: 16,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 6 }}>
            <span style={{ color: "var(--text-muted)" }}>Item Amount</span>
            <span style={{ fontWeight: 600 }}>GHS {Number(escrow.amount).toFixed(2)}</span>
          </div>
          {escrow.escrowFee > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 6 }}>
              <span style={{ color: "var(--text-muted)" }}>Escrow Fee</span>
              <span>GHS {Number(escrow.escrowFee).toFixed(2)}</span>
            </div>
          )}
          {escrow.commission > 0 && isSeller && (
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 6 }}>
              <span style={{ color: "var(--text-muted)" }}>Platform Commission</span>
              <span style={{ color: "var(--danger)" }}>- GHS {Number(escrow.commission).toFixed(2)}</span>
            </div>
          )}
          <div style={{ height: 1, background: "var(--border)", margin: "8px 0" }} />
          <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: 15 }}>
            <span>{isBuyer ? "Total Paid" : "You Receive"}</span>
            <span style={{ color: "var(--accent)" }}>
              GHS {isBuyer
                ? (Number(escrow.amount) + Number(escrow.escrowFee || 0)).toFixed(2)
                : (Number(escrow.amount) - Number(escrow.commission || 0)).toFixed(2)
              }
            </span>
          </div>
        </div>

        {/* Buyer protection */}
        {isBuyer && escrow.status === "held" && (
          <div style={{
            background: "rgba(5,150,105,0.06)", border: "1px solid rgba(5,150,105,0.2)",
            borderRadius: "var(--radius-sm)", padding: "12px 14px", marginBottom: 16,
            fontSize: 13, color: "#065f46", lineHeight: 1.6,
          }}>
            🛡️ <strong>Buyer Protection Active.</strong> Your payment is locked in escrow. Only release funds after you have physically received and verified the item. You can raise a dispute within 7 days of delivery.
          </div>
        )}

        {/* Seller info */}
        {isSeller && escrow.status === "held" && (
          <div style={{
            background: "rgba(26,86,219,0.06)", border: "1px solid rgba(26,86,219,0.2)",
            borderRadius: "var(--radius-sm)", padding: "12px 14px", marginBottom: 16,
            fontSize: 13, color: "#1e40af", lineHeight: 1.6,
          }}>
            ⏳ <strong>Awaiting buyer confirmation.</strong> Deliver the item/service. Once the buyer confirms receipt, GHS {(Number(escrow.amount) - Number(escrow.commission || 0)).toFixed(2)} will be credited to your wallet automatically.
          </div>
        )}

        {/* Actions */}
        {escrow.status === "held" && (
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Button variant="secondary" size="sm" onClick={() => navigate(`/orders/${escrow.orderId}`)}>
              View Order
            </Button>
            {isBuyer && (
              <>
                <Button variant="success" size="sm" loading={acting} onClick={handleRelease}>
                  ✓ Confirm Delivery & Release Payment
                </Button>
                <Button variant="danger" size="sm" onClick={() => setShowDispute(true)}>
                  ⚠ Raise Dispute
                </Button>
              </>
            )}
            <Button variant="secondary" size="sm" onClick={() => navigate(`/chat?with=${isBuyer ? escrow.sellerId : escrow.buyerId}`)}>
              💬 Message {isBuyer ? "Seller" : "Buyer"}
            </Button>
          </div>
        )}

        {escrow.status !== "held" && (
          <Button variant="secondary" size="sm" onClick={() => navigate(`/orders/${escrow.orderId}`)}>
            View Order Details
          </Button>
        )}
      </div>

      {/* Dispute Modal */}
      <Modal
        isOpen={showDispute}
        onClose={() => setShowDispute(false)}
        title="Raise a Dispute"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowDispute(false)}>Cancel</Button>
            <Button variant="danger" loading={acting} onClick={handleDispute}>Submit Dispute</Button>
          </>
        }
      >
        <Alert type="warning">
          Only raise a dispute if there is a genuine problem. False disputes may result in account action.
        </Alert>
        <div style={{ fontSize: 14, color: "var(--text-secondary)", margin: "12px 0" }}>
          Describe the issue clearly. An admin will review and resolve within 24 hours.
        </div>
        <FormTextarea
          label="Describe the Problem *"
          value={disputeText}
          onChange={e => setDisputeText(e.target.value)}
          placeholder="e.g. Item not received, wrong item sent, item damaged..."
          rows={4}
        />
      </Modal>
    </div>
  );
};

// ─── MAIN ESCROW PAGE ─────────────────────────────────────
export function EscrowPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [escrows, setEscrows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("active");

  const load = async () => {
    if (!currentUser) return navigate("/login");
    setLoading(true);
    try {
      const [snap1, snap2] = await Promise.all([
        getDocs(query(collection(db, "escrow"), where("buyerId",  "==", currentUser.uid))),
        getDocs(query(collection(db, "escrow"), where("sellerId", "==", currentUser.uid))),
      ]);
      const all = [
        ...snap1.docs.map(d => ({ id: d.id, ...d.data() })),
        ...snap2.docs.map(d => ({ id: d.id, ...d.data() })),
      ];
      const unique = Array.from(new Map(all.map(e => [e.id, e])).values())
        .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setEscrows(unique);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [currentUser]);

  const handleAction = async (action, escrow, disputeText = "") => {
    if (action === "release") {
      const settings = await getPlatformSettings();
      const commission   = escrow.commission  || (escrow.amount * (settings.commissionRate || 10)) / 100;
      const sellerAmount = escrow.amount - commission;

      await updateEscrow(escrow.id, { status: "released", releasedAt: new Date() });
      await updateOrder(escrow.orderId, { status: "completed", completedAt: new Date() });
      await creditWallet(escrow.sellerId, sellerAmount, `Escrow released — Order #${escrow.orderId?.slice(0, 8)}`);

      const seller = await getUserDoc(escrow.sellerId);
      await createNotification(escrow.sellerId, {
        title: "💰 Payment Released!",
        body:  `GHS ${sellerAmount.toFixed(2)} has been added to your wallet for Order #${escrow.orderId?.slice(0, 8)?.toUpperCase()}.`,
        type:  "payment",
        link:  "/wallet",
      });
      if (seller?.email) {
        await sendOrderCompletedEmail(seller.email, seller.displayName, escrow.orderId, sellerAmount);
      }
      setEscrows(prev => prev.map(e => e.id === escrow.id ? { ...e, status: "released" } : e));
    }

    if (action === "dispute") {
      await updateEscrow(escrow.id, { status: "disputed", disputeReason: disputeText, disputedAt: new Date() });
      await updateOrder(escrow.orderId, { status: "disputed" });
      await createNotification(escrow.sellerId, {
        title: "⚠ Dispute Raised",
        body:  `The buyer has raised a dispute on Order #${escrow.orderId?.slice(0, 8)?.toUpperCase()}. Admin is reviewing.`,
        type:  "alert",
      });
      setEscrows(prev => prev.map(e => e.id === escrow.id ? { ...e, status: "disputed" } : e));
    }
  };

  const active   = escrows.filter(e => e.status === "held" || e.status === "disputed");
  const history  = escrows.filter(e => e.status === "released" || e.status === "refunded");
  const display  = tab === "active" ? active : history;

  const totalHeld = active.filter(e => e.status === "held").reduce((a, e) => a + (e.amount || 0), 0);

  return (
    <div className="page-wrapper">
      <div className="container" style={{ paddingTop: 28 }}>
        <PageHeader title="Escrow" subtitle="Secure payment protection for every transaction" />

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginBottom: 28 }}>
          {[
            { icon: "🔒", label: "Funds in Escrow", value: `GHS ${totalHeld.toFixed(2)}`, color: "var(--warning)" },
            { icon: "✓",  label: "Active Transactions", value: active.length, color: "var(--accent)" },
            { icon: "📋", label: "Total History", value: escrows.length, color: "var(--success)" },
          ].map(s => (
            <div key={s.label} style={{
              background: "var(--surface)", border: "1px solid var(--border)",
              borderRadius: "var(--radius-lg)", padding: "20px 18px",
            }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>{s.icon}</div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* How it works */}
        <div style={{
          background: "linear-gradient(135deg, var(--primary), #1a2560)",
          borderRadius: "var(--radius-xl)", padding: "24px", marginBottom: 24, color: "#fff",
        }}>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 16, marginBottom: 16 }}>
            🔒 How Escrow Protects You
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>
            {[
              { icon: "💳", n: "1", t: "Buyer Pays",         d: "Funds locked, never touched" },
              { icon: "📦", n: "2", t: "Seller Delivers",     d: "Fulfil the order fully" },
              { icon: "✅", n: "3", t: "Buyer Confirms",      d: "Release when satisfied" },
              { icon: "💰", n: "4", t: "Seller Gets Paid",    d: "Instant wallet credit" },
            ].map(s => (
              <div key={s.n} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 24, marginBottom: 6 }}>{s.icon}</div>
                <div style={{
                  width: 22, height: 22, borderRadius: "50%", background: "rgba(255,255,255,0.2)",
                  margin: "0 auto 8px", display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 12, fontWeight: 700,
                }}>{s.n}</div>
                <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 2 }}>{s.t}</div>
                <div style={{ fontSize: 11, opacity: 0.65 }}>{s.d}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", borderBottom: "2px solid var(--border)", marginBottom: 20 }}>
          {[
            { key: "active",  label: `Active (${active.length})` },
            { key: "history", label: `Completed (${history.length})` },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              padding: "10px 20px", border: "none", background: "none", cursor: "pointer",
              fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 14,
              color: tab === t.key ? "var(--accent)" : "var(--text-muted)",
              borderBottom: `2px solid ${tab === t.key ? "var(--accent)" : "transparent"}`,
              marginBottom: -2,
            }}>{t.label}</button>
          ))}
        </div>

        {loading ? <Spinner center /> : display.length === 0 ? (
          <EmptyState
            icon="🔒"
            title={tab === "active" ? "No active escrow" : "No completed transactions"}
            description={tab === "active" ? "Place an order to see escrow protection in action" : "Completed transactions appear here"}
          />
        ) : (
          display.map(e => (
            <EscrowCard key={e.id} escrow={e} currentUser={currentUser} onAction={handleAction} />
          ))
        )}
      </div>
    </div>
  );
}

export function InstallmentsPage() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  return (
    <div className="page-wrapper">
      <div className="container" style={{ paddingTop: 28, maxWidth: 680 }}>
        <PageHeader title="Installment Plans" subtitle="Pay for big purchases in smaller amounts" />
        <Alert type="info">
          Installment payment requires MoMo wallet integration. Top up your wallet and contact admin to arrange a custom installment plan.
        </Alert>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, margin: "24px 0" }}>
          {[
            { icon: "💳", title: "Split Payments", desc: "Break large purchases into 3-12 months" },
            { icon: "📅", title: "Flexible Terms",  desc: "Choose the schedule that works for you" },
            { icon: "🔒", title: "Escrow Protected", desc: "Each payment secured until delivery" },
          ].map(f => (
            <div key={f.title} className="card" style={{ textAlign: "center", padding: 20 }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>{f.icon}</div>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>{f.title}</div>
              <div style={{ fontSize: 13, color: "var(--text-muted)" }}>{f.desc}</div>
            </div>
          ))}
        </div>
        <div className="card">
          <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, marginBottom: 16 }}>Request an Installment Plan</h3>
          <p style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 16, lineHeight: 1.7 }}>
            Found a product you want on installments? Contact the admin through chat and share the product link. The admin will set up a custom plan with escrow protection on each payment.
          </p>
          <div style={{ display: "flex", gap: 12 }}>
            <Button variant="primary" onClick={() => navigate("/chat?with=admin")}>Contact Admin</Button>
            <Button variant="secondary" onClick={() => navigate("/momo-payment")}>Top Up Wallet First</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
