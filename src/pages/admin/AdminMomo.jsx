import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  getAllMomoPayments, updateMomoPayment, creditWallet,
  createNotification, logAdminAction, getUserDoc
} from "../../firebase/db";
import { sendMomoVerifiedEmail, sendMomoRejectedEmail } from "../../services/emailService";
import { Spinner, Button, Badge, StatusBadge, PageHeader, StatCard, EmptyState, Modal, FormInput, toast } from "../../components/UI";

export default function AdminMomo() {
  const { userDoc: adminDoc } = useAuth();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [processing, setProcessing] = useState("");

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try { setPayments(await getAllMomoPayments()); } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleVerify = async (payment) => {
    setProcessing(payment.id);
    try {
      // 1. Credit the user's wallet
      await creditWallet(payment.uid, payment.amount, `MoMo top-up — Ref: ${payment.reference}`);

      // 2. Mark payment as verified
      await updateMomoPayment(payment.id, { status: "verified", verifiedAt: new Date(), verifiedBy: adminDoc.uid });

      // 3. Log the action
      await logAdminAction(adminDoc.uid, "verifyMomoPayment", { paymentId: payment.id, amount: payment.amount, uid: payment.uid });

      // 4. In-app notification
      await createNotification(payment.uid, {
        title: "✅ Payment Verified!",
        body: `GHS ${Number(payment.amount).toFixed(2)} has been credited to your wallet. Reference: ${payment.reference}`,
        type: "payment",
        link: "/wallet",
      });

      // 5. Email the user
      const user = await getUserDoc(payment.uid);
      if (user?.email) await sendMomoVerifiedEmail(user.email, user.displayName, payment.amount);

      setPayments(prev => prev.map(p => p.id === payment.id ? { ...p, status: "verified" } : p));
      toast.success(`GHS ${payment.amount} credited to ${payment.userName}`);
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
      await createNotification(rejectModal.uid, {
        title: "Payment Submission Rejected",
        body: `Your MoMo payment submission of GHS ${rejectModal.amount} was rejected. Reason: ${rejectReason || "Could not verify reference."}`,
        type: "payment",
      });
      const user = await getUserDoc(rejectModal.uid);
      if (user?.email) await sendMomoRejectedEmail(user.email, user.displayName, rejectModal.amount, rejectReason);
      setPayments(prev => prev.map(p => p.id === rejectModal.id ? { ...p, status: "rejected" } : p));
      toast.success("Rejected and user notified");
    } catch (e) {
      toast.error("Rejection failed: " + e.message);
    }
    setProcessing("");
    setRejectModal(null);
    setRejectReason("");
  };

  const pending  = payments.filter(p => p.status === "pending");
  const verified = payments.filter(p => p.status === "verified");
  const rejected = payments.filter(p => p.status === "rejected");
  const totalVerified = verified.reduce((a, p) => a + (p.amount || 0), 0);

  return (
    <div>
      <PageHeader title="MoMo Payment Verification" subtitle="Verify user payments and credit their wallets" />

      {/* Stats */}
      <div className="grid grid-4" style={{ gap: 16, marginBottom: 28 }}>
        <StatCard icon="⏳" label="Pending"       value={pending.length}               color="#D97706" />
        <StatCard icon="✓"  label="Verified"      value={verified.length}              color="#059669" />
        <StatCard icon="💰" label="Total Credited" value={`GHS ${totalVerified.toFixed(0)}`} color="#1A56DB" />
        <StatCard icon="✕"  label="Rejected"      value={rejected.length}              color="#DC2626" />
      </div>

      {/* Pending alert */}
      {pending.length > 0 && (
        <div className="alert alert-warning" style={{ marginBottom: 20 }}>
          <span>⏳</span>
          <span><strong>{pending.length} payment{pending.length > 1 ? "s" : ""} waiting for verification.</strong> Verify promptly so users can shop without delay.</span>
        </div>
      )}

      {loading ? <Spinner center /> : payments.length === 0 ? (
        <EmptyState icon="💳" title="No payment submissions yet" />
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Amount</th>
                <th>Network</th>
                <th>Reference</th>
                <th>Phone</th>
                <th>Status</th>
                <th>Submitted</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {payments.map(p => (
                <tr key={p.id} style={{ background: p.status === "pending" ? "rgba(217,119,6,0.04)" : "transparent" }}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{p.userName}</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{p.userEmail}</div>
                  </td>
                  <td style={{ fontWeight: 800, fontSize: 15, color: "var(--accent)" }}>
                    GHS {Number(p.amount).toFixed(2)}
                  </td>
                  <td style={{ fontSize: 13 }}>{p.network}</td>
                  <td>
                    <code style={{
                      background: "var(--surface-3)", padding: "3px 8px",
                      borderRadius: 4, fontSize: 12, fontWeight: 600,
                    }}>{p.reference}</code>
                  </td>
                  <td style={{ fontSize: 13 }}>{p.senderPhone || "—"}</td>
                  <td><StatusBadge status={p.status} /></td>
                  <td style={{ fontSize: 12, color: "var(--text-muted)" }}>
                    {p.createdAt?.seconds ? new Date(p.createdAt.seconds * 1000).toLocaleString() : "—"}
                  </td>
                  <td>
                    {p.status === "pending" && (
                      <div style={{ display: "flex", gap: 6 }}>
                        <Button
                          size="sm"
                          variant="success"
                          loading={processing === p.id}
                          onClick={() => handleVerify(p)}
                        >
                          ✓ Verify
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => setRejectModal(p)}
                          disabled={processing === p.id}
                        >
                          ✕ Reject
                        </Button>
                      </div>
                    )}
                    {p.status === "rejected" && p.rejectReason && (
                      <div style={{ fontSize: 11, color: "var(--danger)", maxWidth: 160 }}>{p.rejectReason}</div>
                    )}
                  </td>
                </tr>
              ))}
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
            <Button variant="danger" loading={!!processing} onClick={handleReject}>Reject & Notify User</Button>
          </>
        }
      >
        <p style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 16 }}>
          Rejecting payment of <strong>GHS {rejectModal?.amount}</strong> from <strong>{rejectModal?.userName}</strong>. The user will be notified by email and in-app.
        </p>
        <div className="form-group">
          <label className="form-label">Reason for Rejection</label>
          <textarea
            className="form-textarea"
            rows={3}
            value={rejectReason}
            onChange={e => setRejectReason(e.target.value)}
            placeholder="e.g. Transaction reference not found, amount mismatch..."
          />
        </div>
      </Modal>
    </div>
  );
}
