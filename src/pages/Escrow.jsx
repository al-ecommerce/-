import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebase/config";
import {
  updateOrder,
  updateEscrow,
  creditWallet,
  createNotification,
  getUserDoc,
  getPlatformSettings
} from "../firebase/db";
import { sendOrderCompletedEmail } from "../services/emailService";
import {
  Spinner,
  PageHeader,
  EmptyState,
  Badge,
  Button,
  Alert,
  Modal,
  FormTextarea,
  toast
} from "../components/UI";

// ─── STATUS MAP ───────────────────────────────────────────
const STATUS = {
  held: { label: "🔒 In Escrow", color: "var(--warning)" },
  released: { label: "✓ Released", color: "var(--success)" },
  refunded: { label: "↩ Refunded", color: "var(--danger)" },
  disputed: { label: "⚠ Disputed", color: "var(--danger)" }
};

// ─── STATUS TIMELINE ──────────────────────────────────────
const EscrowTimeline = ({ escrow, isBuyer }) => {
  const steps = [
    { key: "held", label: "Payment Received", desc: "Buyer paid. Funds locked in escrow.", icon: "💳" },
    { key: "delivery", label: "Awaiting Delivery", desc: "Seller is fulfilling the order.", icon: "📦" },
    { key: "confirm", label: "Confirm Receipt", desc: isBuyer ? "You confirm delivery." : "Awaiting buyer confirmation.", icon: "✅" },
    { key: "released", label: "Funds Released", desc: "Payment sent to seller wallet.", icon: "💰" }
  ];

  const currentIdx =
    escrow.status === "held" ? 1 :
    escrow.status === "released" ? 3 :
    escrow.status === "refunded" ? 3 : 2;

  return (
    <div style={{ display: "flex", gap: 0, margin: "20px 0", position: "relative" }}>
      <div style={{
        position: "absolute",
        top: 20,
        left: "10%",
        right: "10%",
        height: 2,
        background: "var(--border)",
        zIndex: 0
      }} />
      <div style={{
        position: "absolute",
        top: 20,
        left: "10%",
        height: 2,
        zIndex: 1,
        width: `${Math.min(currentIdx / (steps.length - 1), 1) * 80}%`,
        background: escrow.status === "refunded" ? "var(--danger)" : "var(--accent)",
        transition: "width 0.5s ease"
      }} />
      {steps.map((step, i) => {
        const done = i < currentIdx;
        const active = i === currentIdx;
        return (
          <div key={step.key} style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            position: "relative",
            zIndex: 2
          }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              marginBottom: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 18,
              background: done ? "var(--accent)" : active ? "var(--accent-glow)" : "var(--surface-3)",
              border: `2px solid ${done || active ? "var(--accent)" : "var(--border)"}`,
              transition: "all 0.3s"
            }}>
              {done ? "✓" : step.icon}
            </div>
            <div style={{
              fontSize: 12,
              fontWeight: active || done ? 700 : 500,
              color: done || active ? "var(--text)" : "var(--text-muted)",
              textAlign: "center"
            }}>
              {step.label}
            </div>
            <div style={{
              fontSize: 11,
              color: "var(--text-muted)",
              textAlign: "center",
              marginTop: 2,
              maxWidth: 90
            }}>
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
  const isBuyer = escrow.buyerId === currentUser.uid;
  const isSeller = escrow.sellerId === currentUser.uid;

  const [showDispute, setShowDispute] = useState(false);
  const [disputeText, setDisputeText] = useState("");
  const [acting, setActing] = useState(false);

  const handleRelease = async () => {
    setActing(true);
    try {
      await onAction("release", escrow);
      toast.success("Payment released!");
    } catch (e) {
      toast.error(e.message);
    }
    setActing(false);
  };

  const handleDispute = async () => {
    if (!disputeText.trim()) return toast.error("Please describe the issue");
    setActing(true);
    try {
      await onAction("dispute", escrow, disputeText);
      setShowDispute(false);
      toast.success("Dispute raised.");
    } catch (e) {
      toast.error(e.message);
    }
    setActing(false);
  };

  const statusColor = STATUS[escrow.status]?.color || "var(--accent)";

  return (
    <div style={{
      background: "var(--surface)",
      border: "1px solid var(--border)",
      borderRadius: "var(--radius-xl)",
      overflow: "hidden",
      marginBottom: 16
    }}>
      <div style={{
        padding: "16px 20px",
        borderBottom: "1px solid var(--border)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        background: "var(--surface-2)"
      }}>
        <div>
          <div style={{
            fontWeight: 700,
            fontSize: 15
          }}>
            Order #{escrow.orderId?.slice(0, 8)?.toUpperCase()}
          </div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
            {escrow.createdAt?.seconds
              ? new Date(escrow.createdAt.seconds * 1000).toLocaleString()
              : "—"}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{
            fontWeight: 800,
            fontSize: 20,
            color: "var(--accent)"
          }}>
            GHS {Number(escrow.amount).toFixed(2)}
          </div>
          <div style={{
            display: "inline-block",
            fontSize: 12,
            fontWeight: 700,
            padding: "2px 10px",
            borderRadius: 20,
            background: statusColor + "18",
            color: statusColor,
            marginTop: 2
          }}>
            {STATUS[escrow.status]?.label}
          </div>
        </div>
      </div>

      <div style={{ padding: "20px" }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <Badge type={isBuyer ? "primary" : "success"}>
            {isBuyer ? "You are the Buyer" : "You are the Seller"}
          </Badge>
          {escrow.itemTitle && <Badge type="muted">{escrow.itemTitle}</Badge>}
        </div>

        <EscrowTimeline escrow={escrow} isBuyer={isBuyer} />

        {escrow.status === "held" && (
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Button variant="secondary" size="sm" onClick={() => navigate(`/orders/${escrow.orderId}`)}>
              View Order
            </Button>
            {isBuyer && (
              <>
                <Button variant="success" size="sm" loading={acting} onClick={handleRelease}>
                  Confirm Delivery & Release Payment
                </Button>
                <Button variant="danger" size="sm" onClick={() => setShowDispute(true)}>
                  Raise Dispute
                </Button>
              </>
            )}
            <Button variant="secondary" size="sm" onClick={() => navigate(`/chat?with=${isBuyer ? escrow.sellerId : escrow.buyerId}`)}>
              Message
            </Button>
          </div>
        )}

        {escrow.status !== "held" && (
          <Button variant="secondary" size="sm" onClick={() => navigate(`/orders/${escrow.orderId}`)}>
            View Order Details
          </Button>
        )}
      </div>

      <Modal
        isOpen={showDispute}
        onClose={() => setShowDispute(false)}
        title="Raise a Dispute"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowDispute(false)}>Cancel</Button>
            <Button variant="danger" loading={acting} onClick={handleDispute}>Submit</Button>
          </>
        }
      >
        <Alert type="warning">
          Only raise a dispute if there is a genuine problem.
        </Alert>
        <FormTextarea
          label="Describe the Problem"
          value={disputeText}
          onChange={e => setDisputeText(e.target.value)}
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
        getDocs(query(collection(db, "escrow"), where("buyerId", "==", currentUser.uid))),
        getDocs(query(collection(db, "escrow"), where("sellerId", "==", currentUser.uid)))
      ]);
      const all = [
        ...snap1.docs.map(d => ({ id: d.id, ...d.data() })),
        ...snap2.docs.map(d => ({ id: d.id, ...d.data() }))
      ];
      const unique = Array.from(new Map(all.map(e => [e.id, e])).values())
        .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setEscrows(unique);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [currentUser]);

  const handleAction = async (action, escrow, disputeText = "") => {
    if (action === "release") {
      const settings = await getPlatformSettings();
      const commission = escrow.commission || (escrow.amount * (settings.commissionRate || 10)) / 100;
      const sellerAmount = escrow.amount - commission;

      await updateEscrow(escrow.id, { status: "released", releasedAt: new Date() });
      await updateOrder(escrow.orderId, { status: "completed", completedAt: new Date() });
      await creditWallet(escrow.sellerId, sellerAmount);

      const seller = await getUserDoc(escrow.sellerId);
      await createNotification(escrow.sellerId, {
        title: "Payment Released",
        body: `GHS ${sellerAmount.toFixed(2)} added to your wallet.`,
        type: "payment",
        link: "/wallet"
      });

      if (seller?.email) {
        await sendOrderCompletedEmail(
          seller.email,
          seller.displayName,
          escrow.orderId,
          sellerAmount
        );
      }

      setEscrows(prev =>
        prev.map(e => e.id === escrow.id ? { ...e, status: "released" } : e)
      );
    }

    if (action === "dispute") {
      await updateEscrow(escrow.id, {
        status: "disputed",
        disputeReason: disputeText,
        disputedAt: new Date()
      });

      await updateOrder(escrow.orderId, { status: "disputed" });

      await createNotification(escrow.sellerId, {
        title: "Dispute Raised",
        body: `Buyer raised a dispute on Order #${escrow.orderId?.slice(0, 8)}`,
        type: "alert"
      });

      setEscrows(prev =>
        prev.map(e => e.id === escrow.id ? { ...e, status: "disputed" } : e)
      );
    }
  };

  const active = escrows.filter(e => e.status === "held" || e.status === "disputed");
  const history = escrows.filter(e => e.status === "released" || e.status === "refunded");
  const display = tab === "active" ? active : history;

  const totalHeld = active
    .filter(e => e.status === "held")
    .reduce((a, e) => a + (e.amount || 0), 0);

  return (
    <div className="page-wrapper">
      <div className="container" style={{ paddingTop: 28 }}>
        <PageHeader title="Escrow" subtitle="Secure payment protection for every transaction" />

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginBottom: 28 }}>
          {[
            { icon: "🔒", label: "Funds in Escrow", value: `GHS ${totalHeld.toFixed(2)}`, color: "var(--warning)" },
            { icon: "✓", label: "Active Transactions", value: active.length, color: "var(--accent)" },
            { icon: "📋", label: "Total History", value: escrows.length, color: "var(--success)" }
          ].map(s => (
            <div key={s.label} style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-lg)",
              padding: "20px 18px"
            }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>{s.icon}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", borderBottom: "2px solid var(--border)", marginBottom: 20 }}>
          {[
            { key: "active", label: `Active (${active.length})` },
            { key: "history", label: `Completed (${history.length})` }
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                padding: "10px 20px",
                border: "none",
                background: "none",
                cursor: "pointer",
                fontWeight: 600,
                fontSize: 14,
                color: tab === t.key ? "var(--accent)" : "var(--text-muted)",
                borderBottom: `2px solid ${tab === t.key ? "var(--accent)" : "transparent"}`,
                marginBottom: -2
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <Spinner center />
        ) : display.length === 0 ? (
          <EmptyState
            icon="🔒"
            title={tab === "active" ? "No active escrow" : "No completed transactions"}
            description={tab === "active" ? "Place an order to see escrow protection" : "Completed transactions appear here"}
          />
        ) : (
          display.map(e => (
            <EscrowCard
              key={e.id}
              escrow={e}
              currentUser={currentUser}
              onAction={handleAction}
            />
          ))
        )}
      </div>
    </div>
  );
}

// ─── INSTALLMENTS PAGE ────────────────────────────────────
export function InstallmentsPage() {
  const navigate = useNavigate();

  return (
    <div className="page-wrapper">
      <div className="container" style={{ paddingTop: 28, maxWidth: 680 }}>
        <PageHeader title="Installment Plans" subtitle="Pay for big purchases in smaller amounts" />
        <Alert type="info">
          Installment payment requires wallet funding. Contact admin to arrange a custom installment plan.
        </Alert>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, margin: "24px 0" }}>
          {[
            { icon: "💳", title: "Split Payments", desc: "Break purchases into months" },
            { icon: "📅", title: "Flexible Terms", desc: "Choose schedule" },
            { icon: "🔒", title: "Escrow Protected", desc: "Each payment secured" }
          ].map(f => (
            <div key={f.title} className="card" style={{ textAlign: "center", padding: 20 }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>{f.icon}</div>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>{f.title}</div>
              <div style={{ fontSize: 13, color: "var(--text-muted)" }}>{f.desc}</div>
            </div>
          ))}
        </div>

        <div className="card">
          <h3 style={{ fontWeight: 700, marginBottom: 16 }}>Request an Installment Plan</h3>
          <p style={{ fontSize: 14, marginBottom: 16 }}>
            Found a product you want on installments? Contact the admin and share the product link.
          </p>
          <div style={{ display: "flex", gap: 12 }}>
            <Button variant="primary" onClick={() => navigate("/chat?with=admin")}>
              Contact Admin
            </Button>
            <Button variant="secondary" onClick={() => navigate("/momo-payment")}>
              Top Up Wallet
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}