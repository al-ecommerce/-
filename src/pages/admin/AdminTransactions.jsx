import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  getAllOrders, updateOrder, getAllWithdrawals, updateWithdrawal,
  getAllEscrow, updateEscrow, getAllReports, updateReport,
  getAllTransactions, creditWallet, getUserDoc, logAdminAction, createNotification
} from "../../firebase/db";
import { sendWithdrawalApprovedEmail } from "../../services/emailService";
import { Spinner, Button, Badge, StatusBadge, PageHeader, EmptyState, PriceTag, StatCard, toast } from "../../components/UI";

// ─── MANAGE ORDERS ─────────────────────────────────────────
export function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllOrders().then(d => { setOrders(d); setLoading(false); });
  }, []);

  return (
    <div>
      <PageHeader title="All Orders" subtitle={`${orders.length} orders`} />
      {loading ? <Spinner center /> : (
        <div className="table-wrapper">
          <table>
            <thead><tr><th>Order ID</th><th>Item</th><th>Buyer</th><th>Amount</th><th>Commission</th><th>Status</th><th>Date</th></tr></thead>
            <tbody>
              {orders.map(o => (
                <tr key={o.id}>
                  <td style={{ fontFamily: "monospace", fontSize: 12 }}>#{o.id.slice(0, 8)}</td>
                  <td><div className="truncate" style={{ maxWidth: 140 }}>{o.itemTitle}</div></td>
                  <td style={{ fontSize: 13 }}>{o.buyerName}</td>
                  <td style={{ fontWeight: 700 }}>GHS {o.amount?.toFixed(2)}</td>
                  <td style={{ color: "var(--success)" }}>GHS {o.commission?.toFixed(2) || "0.00"}</td>
                  <td><StatusBadge status={o.status} /></td>
                  <td style={{ fontSize: 12, color: "var(--text-muted)" }}>
                    {o.createdAt?.seconds ? new Date(o.createdAt.seconds * 1000).toLocaleDateString() : "—"}
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

// ─── MANAGE PAYMENTS ───────────────────────────────────────
export function AdminPayments() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllTransactions().then(d => { setTransactions(d); setLoading(false); });
  }, []);

  const totalCredits = transactions.filter(t => t.type === "credit").reduce((a, t) => a + t.amount, 0);
  const totalDebits = transactions.filter(t => t.type === "debit").reduce((a, t) => a + t.amount, 0);

  return (
    <div>
      <PageHeader title="Payment Transactions" subtitle={`${transactions.length} transactions`} />
      <div className="grid grid-4" style={{ gap: 16, marginBottom: 24 }}>
        <StatCard icon="📥" label="Total Credits" value={`GHS ${totalCredits.toFixed(0)}`} color="#10B981" />
        <StatCard icon="📤" label="Total Debits" value={`GHS ${totalDebits.toFixed(0)}`} color="#EF4444" />
        <StatCard icon="💰" label="Net Flow" value={`GHS ${(totalCredits - totalDebits).toFixed(0)}`} color="#4F7CFF" />
        <StatCard icon="📊" label="Transactions" value={transactions.length} color="#F59E0B" />
      </div>
      {loading ? <Spinner center /> : (
        <div className="table-wrapper">
          <table>
            <thead><tr><th>User</th><th>Type</th><th>Amount</th><th>Note</th><th>Date</th></tr></thead>
            <tbody>
              {transactions.map(t => (
                <tr key={t.id}>
                  <td style={{ fontSize: 13, fontFamily: "monospace" }}>{t.uid?.slice(0, 12)}...</td>
                  <td><Badge type={t.type === "credit" ? "success" : "danger"}>{t.type}</Badge></td>
                  <td style={{ fontWeight: 700, color: t.type === "credit" ? "var(--success)" : "var(--danger)" }}>
                    {t.type === "credit" ? "+" : "-"} GHS {t.amount?.toFixed(2)}
                  </td>
                  <td style={{ fontSize: 13, maxWidth: 200 }}><div className="truncate">{t.note || "—"}</div></td>
                  <td style={{ fontSize: 12, color: "var(--text-muted)" }}>
                    {t.createdAt?.seconds ? new Date(t.createdAt.seconds * 1000).toLocaleString() : "—"}
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

// ─── MANAGE ESCROW ─────────────────────────────────────────
export function AdminEscrow() {
  const { userDoc: adminDoc } = useAuth();
  const [escrows, setEscrows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllEscrow().then(d => { setEscrows(d); setLoading(false); });
  }, []);

  const handleRelease = async (escrow) => {
    await updateEscrow(escrow.id, { status: "released" });
    const commission = escrow.commission || 0;
    const sellerAmount = escrow.amount - commission;
    await creditWallet(escrow.sellerId, sellerAmount, `Escrow release order #${escrow.orderId?.slice(0, 8)}`);
    await updateOrder(escrow.orderId, { status: "completed" });
    await createNotification(escrow.sellerId, { title: "Escrow Released", body: `GHS ${sellerAmount.toFixed(2)} released to your wallet`, type: "payment" });
    await logAdminAction(adminDoc.uid, "releaseEscrow", { escrowId: escrow.id });
    setEscrows(prev => prev.map(e => e.id === escrow.id ? { ...e, status: "released" } : e));
    toast.success("Escrow released");
  };

  const handleRefund = async (escrow) => {
    await updateEscrow(escrow.id, { status: "refunded" });
    await creditWallet(escrow.buyerId, escrow.amount + (escrow.escrowFee || 0), `Escrow refund order #${escrow.orderId?.slice(0, 8)}`);
    await updateOrder(escrow.orderId, { status: "refunded" });
    await createNotification(escrow.buyerId, { title: "Refund Processed", body: `GHS ${escrow.amount.toFixed(2)} refunded to your wallet`, type: "payment" });
    setEscrows(prev => prev.map(e => e.id === escrow.id ? { ...e, status: "refunded" } : e));
    toast.success("Refund issued");
  };

  const heldTotal = escrows.filter(e => e.status === "held").reduce((a, e) => a + (e.amount || 0), 0);

  return (
    <div>
      <PageHeader title="Escrow Management" subtitle="Review and manage held funds" />
      <div className="grid grid-4" style={{ gap: 16, marginBottom: 24 }}>
        <StatCard icon="🔒" label="Funds Held" value={`GHS ${heldTotal.toFixed(0)}`} color="#F59E0B" />
        <StatCard icon="📦" label="Active Escrows" value={escrows.filter(e => e.status === "held").length} color="#4F7CFF" />
        <StatCard icon="✓" label="Released" value={escrows.filter(e => e.status === "released").length} color="#10B981" />
        <StatCard icon="↩" label="Refunded" value={escrows.filter(e => e.status === "refunded").length} color="#EF4444" />
      </div>
      {loading ? <Spinner center /> : (
        <div className="table-wrapper">
          <table>
            <thead><tr><th>Order ID</th><th>Amount</th><th>Buyer</th><th>Seller</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead>
            <tbody>
              {escrows.map(e => (
                <tr key={e.id}>
                  <td style={{ fontFamily: "monospace", fontSize: 12 }}>#{e.orderId?.slice(0, 8)}</td>
                  <td style={{ fontWeight: 700 }}>GHS {e.amount?.toFixed(2)}</td>
                  <td style={{ fontSize: 12, fontFamily: "monospace" }}>{e.buyerId?.slice(0, 10)}...</td>
                  <td style={{ fontSize: 12, fontFamily: "monospace" }}>{e.sellerId?.slice(0, 10)}...</td>
                  <td><StatusBadge status={e.status} /></td>
                  <td style={{ fontSize: 12, color: "var(--text-muted)" }}>
                    {e.createdAt?.seconds ? new Date(e.createdAt.seconds * 1000).toLocaleDateString() : "—"}
                  </td>
                  <td>
                    {e.status === "held" && (
                      <div style={{ display: "flex", gap: 5 }}>
                        <Button size="sm" variant="success" onClick={() => handleRelease(e)}>Release</Button>
                        <Button size="sm" variant="danger" onClick={() => handleRefund(e)}>Refund</Button>
                      </div>
                    )}
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

// ─── MANAGE WITHDRAWALS ────────────────────────────────────
export function AdminWithdrawals() {
  const { userDoc: adminDoc } = useAuth();
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllWithdrawals().then(d => { setWithdrawals(d); setLoading(false); });
  }, []);

  const handleApprove = async (w) => {
    await updateWithdrawal(w.id, { status: "approved", approvedAt: new Date() });
    await logAdminAction(adminDoc.uid, "approveWithdrawal", { withdrawalId: w.id, amount: w.amount });
    await createNotification(w.uid, { title: "Withdrawal Approved", body: `GHS ${w.netAmount?.toFixed(2)} sent to ${w.method}`, type: "payment" });
    try {
      const user = await getUserDoc(w.uid);
      if (user?.email) await sendWithdrawalApprovedEmail(user.email, user.displayName, w.netAmount);
    } catch (e) { }
    setWithdrawals(prev => prev.map(x => x.id === w.id ? { ...x, status: "approved" } : x));
    toast.success("Withdrawal approved!");
  };

  const handleReject = async (w) => {
    await updateWithdrawal(w.id, { status: "rejected" });
    await creditWallet(w.uid, w.amount, `Withdrawal refund - rejected`);
    await createNotification(w.uid, { title: "Withdrawal Rejected", body: "Your withdrawal was rejected. Funds returned to wallet.", type: "payment" });
    setWithdrawals(prev => prev.map(x => x.id === w.id ? { ...x, status: "rejected" } : x));
    toast.success("Rejection processed, funds returned");
  };

  const pendingTotal = withdrawals.filter(w => w.status === "pending").reduce((a, w) => a + w.amount, 0);

  return (
    <div>
      <PageHeader title="Withdrawal Requests" subtitle={`${withdrawals.filter(w => w.status === "pending").length} pending`} />
      <div className="grid grid-4" style={{ gap: 16, marginBottom: 24 }}>
        <StatCard icon="⏳" label="Pending" value={withdrawals.filter(w => w.status === "pending").length} color="#F59E0B" />
        <StatCard icon="💸" label="Pending Amount" value={`GHS ${pendingTotal.toFixed(0)}`} color="#F59E0B" />
        <StatCard icon="✓" label="Approved" value={withdrawals.filter(w => w.status === "approved").length} color="#10B981" />
        <StatCard icon="✕" label="Rejected" value={withdrawals.filter(w => w.status === "rejected").length} color="#EF4444" />
      </div>
      {loading ? <Spinner center /> : (
        <div className="table-wrapper">
          <table>
            <thead><tr><th>User</th><th>Amount</th><th>Fee</th><th>Net</th><th>Method</th><th>Account</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {withdrawals.map(w => (
                <tr key={w.id}>
                  <td style={{ fontSize: 12, fontFamily: "monospace" }}>{w.uid?.slice(0, 10)}...</td>
                  <td style={{ fontWeight: 700 }}>GHS {w.amount?.toFixed(2)}</td>
                  <td style={{ color: "var(--danger)", fontSize: 13 }}>-{w.fee?.toFixed(2)}</td>
                  <td style={{ fontWeight: 700, color: "var(--success)" }}>GHS {w.netAmount?.toFixed(2)}</td>
                  <td>{w.method}</td>
                  <td style={{ fontSize: 13 }}>{w.accountNumber}</td>
                  <td><StatusBadge status={w.status} /></td>
                  <td>
                    {w.status === "pending" && (
                      <div style={{ display: "flex", gap: 5 }}>
                        <Button size="sm" variant="success" onClick={() => handleApprove(w)}>✓ Approve</Button>
                        <Button size="sm" variant="danger" onClick={() => handleReject(w)}>✕ Reject</Button>
                      </div>
                    )}
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

// ─── MANAGE REPORTS ────────────────────────────────────────
export function AdminReports() {
  const { userDoc: adminDoc } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllReports().then(d => { setReports(d); setLoading(false); });
  }, []);

  const handleReview = async (id, status) => {
    await updateReport(id, { status });
    await logAdminAction(adminDoc.uid, `reportReviewed_${status}`, { reportId: id });
    setReports(prev => prev.map(r => r.id === id ? { ...r, status } : r));
    toast.success("Report updated");
  };

  const pendingCount = reports.filter(r => r.status === "pending").length;

  return (
    <div>
      <PageHeader title="Reports" subtitle={`${pendingCount} pending review`} />
      {loading ? <Spinner center /> : reports.length === 0 ? (
        <EmptyState icon="🚩" title="No reports" description="All clear!" />
      ) : (
        <div className="table-wrapper">
          <table>
            <thead><tr><th>Type</th><th>Target</th><th>Reporter</th><th>Reason</th><th>Details</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead>
            <tbody>
              {reports.map(r => (
                <tr key={r.id}>
                  <td><Badge type="muted">{r.targetType}</Badge></td>
                  <td style={{ fontSize: 12, fontFamily: "monospace" }}>{r.targetId?.slice(0, 10)}...</td>
                  <td style={{ fontSize: 13 }}>{r.reporterName}</td>
                  <td style={{ fontSize: 13 }}>{r.reason}</td>
                  <td style={{ fontSize: 12, maxWidth: 150 }}><div className="truncate">{r.details || "—"}</div></td>
                  <td><StatusBadge status={r.status} /></td>
                  <td style={{ fontSize: 12, color: "var(--text-muted)" }}>
                    {r.createdAt?.seconds ? new Date(r.createdAt.seconds * 1000).toLocaleDateString() : "—"}
                  </td>
                  <td>
                    {r.status === "pending" && (
                      <div style={{ display: "flex", gap: 5 }}>
                        <Button size="sm" variant="success" onClick={() => handleReview(r.id, "resolved")}>✓</Button>
                        <Button size="sm" variant="secondary" onClick={() => handleReview(r.id, "dismissed")}>Dismiss</Button>
                      </div>
                    )}
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
