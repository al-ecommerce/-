import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  getAllMomoPayments, updateMomoPayment, creditWallet,
  createNotification, logAdminAction, getUserDoc,
  updateOrder, createEscrow, getPlatformSettings
} from "../../firebase/db";
import { sendMomoVerifiedEmail, sendMomoRejectedEmail, sendOrderReceivedEmail } from "../../services/emailService";
import { Spinner, Button, Badge, StatusBadge, PageHeader, StatCard, EmptyState, Modal, toast } from "../../components/UI";

export default function AdminMomo() {
  const { userDoc: adminDoc } = useAuth();
  const [payments,    setPayments]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason,setRejectReason]= useState("");
  const [processing,  setProcessing]  = useState("");
  const [tab,         setTab]         = useState("pending");

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try { setPayments(await getAllMomoPayments()); } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleVerify = async (payment) => {
    setProcessing(payment.id);
    try {
      const settings = await getPlatformSettings();

      if (payment.type === "checkout") {
        // ── Checkout payment: activate the order + escrow ──
        if (!payment.orderId) throw new Error("No order linked to this payment");

        // Update order to paid
        await updateOrder(payment.orderId, {
          status: "paid",
          paymentVerifiedAt: new Date(),
          paymentVerifiedBy: adminDoc.uid,
        });

        // Create escrow for the order
        await createEscrow({
          orderId:    payment.orderId,
          buyerId:    payment.uid,
          sellerId:   payment.sellerId || "",
          amount:     payment.amount - (payment.amount * (settings.escrowFee || 2) / 100),
          commission: payment.amount * (settings.commissionRate || 10) / 100,
          escrowFee:  payment.amount * (settings.escrowFee || 2) / 100,
          status:     "held",
          itemTitle:  payment.itemTitle || "",
        });

        // Notify buyer
        await createNotification(payment.uid, {
          title: "✅ Order Confirmed!",
          body:  `Your MoMo payment for "${payment.itemTitle}" has been verified. Your order is now active.`,
          type:  "order",
          link:  `/orders/${payment.orderId}`,
        });

        // Notify seller
        if (payment.sellerId) {
          const seller = await getUserDoc(payment.sellerId);
          await createNotification(payment.sellerId, {
            title: "New Order Received!",
            body:  `A buyer's payment for "${payment.itemTitle}" has been verified. Order is now active.`,
            type:  "order",
            link:  `/orders/${payment.orderId}`,
          });
          if (seller?.email) {
            await sendOrderReceivedEmail(seller.email, seller.displayName, payment.orderId, payment.itemTitle, payment.userName);
          }
        }

      } else {
        // ── Wallet top-up: credit wallet ──
        await creditWallet(payment.uid, payment.amount,
          `MoMo wallet top-up — Ref: ${payment.reference}`);

        await createNotification(payment.uid, {
          title: "💰 Wallet Credited!",
          body:  `GHS ${Number(payment.amount).toFixed(2)} has been added to your wallet. Reference: ${payment.reference}`,
          type:  "payment",
          link:  "/wallet",
        });
      }

      // Mark payment as verified
      await updateMomoPayment(payment.id, {
        status: "verified",
        verifiedAt: new Date(),
        verifiedBy: adminDoc.uid,
      });
      await logAdminAction(adminDoc.uid, "verifyMomoPayment", { paymentId: payment.id, amount: payment.amount });

      // Email buyer
      const user = await getUserDoc(payment.uid);
      if (user?.email) await sendMomoVerifiedEmail(user.email, user.displayName, payment.amount);

      setPayments(prev => prev.map(p => p.id === payment.id ? { ...p, status: "verified" } : p));
      toast.success(`GHS ${payment.amount} verified — ${payment.type === "checkout" ? "order activated" : "wallet credited"}`);
    } catch (e) {
      toast.error("Verification failed: " + e.message);
    }
    setProcessing("");
  };

  const handleReject = async () => {
    if (!rejectModal) return;
    setProcessing(rejectModal.id);
    try {
      await updateMomoPayment(rejectModal.id, {
        status: "rejected",
        rejectReason: rejectReason || "Could not verify transaction reference",
        rejectedAt: new Date(),
        rejectedBy: adminDoc.uid,
      });
      await logAdminAction(adminDoc.uid, "rejectMomoPayment", { paymentId: rejectModal.id });

      if (rejectModal.type === "checkout" && rejectModal.orderId) {
        await updateOrder(rejectModal.orderId, { status: "cancelled" });
      }

      await createNotification(rejectModal.uid, {
        title: "Payment Not Verified",
        body:  `Your MoMo payment of GHS ${rejectModal.amount} was rejected. Reason: ${rejectReason || "Reference not found."}`,
        type:  "payment",
      });
      const user = await getUserDoc(rejectModal.uid);
      if (user?.email) await sendMomoRejectedEmail(user.email, user.displayName, rejectModal.amount, rejectReason);

      setPayments(prev => prev.map(p => p.id === rejectModal.id ? { ...p, status: "rejected" } : p));
      toast.success("Rejected and user notified");
    } catch (e) { toast.error("Rejection failed: " + e.message); }
    setProcessing("");
    setRejectModal(null);
    setRejectReason("");
  };

  // Check if a checkout payment is expired (>30 min old and still pending)
  const isExpired = (p) => {
    if (p.type !== "checkout" || p.status !== "pending") return false;
    const deadline = p.paymentDeadline?.seconds
      ? new Date(p.paymentDeadline.seconds * 1000)
      : p.paymentDeadline ? new Date(p.paymentDeadline) : null;
    return deadline && deadline < new Date();
  };

  const pending   = payments.filter(p => p.status === "pending");
  const verified  = payments.filter(p => p.status === "verified");
  const rejected  = payments.filter(p => p.status === "rejected");
  const display   = tab === "pending" ? pending : tab === "verified" ? verified : rejected;
  const totalIn   = verified.reduce((a, p) => a + (p.amount || 0), 0);

  return (
    <div>
      <PageHeader title="MoMo Payment Verification" subtitle="Verify payments and activate orders" />

      <div className="grid grid-4" style={{ gap: 16, marginBottom: 24 }}>
        <StatCard icon="⏳" label="Pending"       value={pending.length}               color="#D97706" />
        <StatCard icon="✓"  label="Verified"      value={verified.length}              color="#059669" />
        <StatCard icon="💰" label="Total Verified" value={`GHS ${totalIn.toFixed(0)}`} color="#1A56DB" />
        <StatCard icon="✕"  label="Rejected"      value={rejected.length}              color="#DC2626" />
      </div>

      {pending.length > 0 && (
        <div className="alert alert-warning" style={{ marginBottom: 20 }}>
          <span>⚡</span>
          <span>
            <strong>{pending.length} payment{pending.length > 1 ? "s" : ""} waiting.</strong>{" "}
            Checkout payments must be verified within 30 minutes or the order expires automatically.
          </span>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: "2px solid var(--border)", marginBottom: 20 }}>
        {[
          { key: "pending",  label: `Pending (${pending.length})` },
          { key: "verified", label: `Verified (${verified.length})` },
          { key: "rejected", label: `Rejected (${rejected.length})` },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            padding: "10px 18px", border: "none", background: "none", cursor: "pointer",
            fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 14,
            color: tab === t.key ? "var(--accent)" : "var(--text-muted)",
            borderBottom: `2px solid ${tab === t.key ? "var(--accent)" : "transparent"}`,
            marginBottom: -2,
          }}>{t.label}</button>
        ))}
      </div>

      {loading ? <Spinner center /> : display.length === 0 ? (
        <EmptyState icon="💳" title={`No ${tab} payments`} />
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Type</th><th>User</th><th>Amount</th>
                <th>Platform Ref</th><th>User Ref</th><th>Phone</th>
                <th>Status</th><th>Time</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {display.map(p => {
                const expired = isExpired(p);
                return (
                  <tr key={p.id} style={{ background: expired ? "rgba(220,38,38,0.04)" : p.type === "checkout" ? "rgba(26,86,219,0.03)" : "transparent" }}>
                    <td>
                      <Badge type={p.type === "checkout" ? "primary" : "muted"}>
                        {p.type === "checkout" ? "🛒 Order" : "💰 Top-up"}
                      </Badge>
                      {p.itemTitle && <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{p.itemTitle}</div>}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{p.userName}</div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{p.userEmail}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 800, fontSize: 15, color: "var(--accent)" }}>GHS {Number(p.amount).toFixed(2)}</div>
                    </td>
                    <td>
                      <code style={{ background: "var(--surface-3)", padding: "2px 8px", borderRadius: 4, fontSize: 12, fontWeight: 700, letterSpacing: "1px" }}>
                        {p.reference}
                      </code>
                    </td>
                    <td>
                      <code style={{ background: "var(--surface-2)", padding: "2px 8px", borderRadius: 4, fontSize: 11 }}>
                        {p.userReference || "—"}
                      </code>
                    </td>
                    <td style={{ fontSize: 13 }}>{p.senderPhone || "—"}</td>
                    <td>
                      {expired ? <Badge type="danger">Expired</Badge> : <StatusBadge status={p.status} />}
                    </td>
                    <td style={{ fontSize: 11, color: "var(--text-muted)" }}>
                      {p.createdAt?.seconds ? new Date(p.createdAt.seconds * 1000).toLocaleString("en-GH", { dateStyle: "short", timeStyle: "short" }) : "—"}
                    </td>
                    <td>
                      {p.status === "pending" && !expired && (
                        <div style={{ display: "flex", gap: 5 }}>
                          <Button size="sm" variant="success" loading={processing === p.id} onClick={() => handleVerify(p)}>✓ Verify</Button>
                          <Button size="sm" variant="danger" onClick={() => setRejectModal(p)} disabled={processing === p.id}>✕</Button>
                        </div>
                      )}
                      {expired && <span style={{ fontSize: 11, color: "var(--danger)" }}>Auto-cancelled</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Reject Modal */}
      <Modal
        isOpen={!!rejectModal}
        onClose={() => { setRejectModal(null); setRejectReason(""); }}
        title="Reject Payment"
        footer={
          <>
            <Button variant="secondary" onClick={() => { setRejectModal(null); setRejectReason(""); }}>Cancel</Button>
            <Button variant="danger" loading={!!processing} onClick={handleReject}>Reject & Notify</Button>
          </>
        }
      >
        <p style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 16 }}>
          Rejecting <strong>GHS {rejectModal?.amount}</strong> from <strong>{rejectModal?.userName}</strong>.
          {rejectModal?.type === "checkout" && " The linked order will be cancelled."}
        </p>
        <div className="form-group">
          <label className="form-label">Reason (shown to user)</label>
          <textarea className="form-textarea" rows={3} value={rejectReason}
            onChange={e => setRejectReason(e.target.value)}
            placeholder="e.g. Transaction ID not found, amount does not match, wrong reference used..."
          />
        </div>
      </Modal>
    </div>
  );
}
