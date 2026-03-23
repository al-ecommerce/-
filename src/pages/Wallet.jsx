import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { listenToWallet, getTransactions, createWithdrawal, getUserWithdrawals, debitWallet, getPlatformSettings } from "../firebase/db";
import { Spinner, Button, Badge, Alert, Modal, PageHeader, EmptyState, PriceTag, FormInput, FormSelect, StatusBadge, toast } from "../components/UI";

export default function Wallet() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [tab, setTab] = useState("transactions");

  useEffect(() => {
    if (!currentUser) return navigate("/login");
    const unsub = listenToWallet(currentUser.uid, setWallet);
    const load = async () => {
      try {
        const [txns, wdls, s] = await Promise.all([
          getTransactions(currentUser.uid),
          getUserWithdrawals(currentUser.uid),
          getPlatformSettings()
        ]);
        setTransactions(txns);
        setWithdrawals(wdls);
        setSettings(s);
      } catch (e) { }
      setLoading(false);
    };
    load();
    return unsub;
  }, [currentUser]);

  if (loading || !wallet) return <Spinner center />;

  const totalIn = transactions.filter(t => t.type === "credit").reduce((a, t) => a + t.amount, 0);
  const totalOut = transactions.filter(t => t.type === "debit").reduce((a, t) => a + t.amount, 0);

  return (
    <div className="page-wrapper">
      <div className="container" style={{ paddingTop: 28 }}>
        <PageHeader title="My Wallet" subtitle="Manage your funds and transactions" />

        {/* Balance Card */}
        <div style={{
          background: "linear-gradient(135deg, var(--primary), var(--accent))",
          borderRadius: "var(--radius-xl)", padding: "32px 28px", marginBottom: 24, color: "#fff"
        }}>
          <div style={{ fontSize: 14, opacity: 0.8, marginBottom: 8 }}>Available Balance</div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 42, fontWeight: 800, lineHeight: 1 }}>
            GHS {wallet.balance?.toFixed(2) || "0.00"}
          </div>
          <div style={{ display: "flex", gap: 16, marginTop: 24 }}>
            <div style={{ flex: 1, background: "rgba(255,255,255,0.1)", borderRadius: 12, padding: "14px 16px" }}>
              <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 4 }}>Total In</div>
              <div style={{ fontWeight: 700 }}>GHS {totalIn.toFixed(2)}</div>
            </div>
            <div style={{ flex: 1, background: "rgba(255,255,255,0.1)", borderRadius: 12, padding: "14px 16px" }}>
              <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 4 }}>Total Out</div>
              <div style={{ fontWeight: 700 }}>GHS {totalOut.toFixed(2)}</div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 28 }}>
          <Button variant="primary" full size="lg" onClick={() => setShowWithdraw(true)}>
            💸 Withdraw Funds
          </Button>
          <Button variant="secondary" full size="lg" onClick={() => navigate("/escrow")}>
            🔒 View Escrow
          </Button>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", borderBottom: "2px solid var(--border)", marginBottom: 20 }}>
          {["transactions", "withdrawals"].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: "10px 18px", border: "none", background: "none", cursor: "pointer",
              fontWeight: 600, fontSize: 14, fontFamily: "var(--font-body)",
              color: tab === t ? "var(--accent)" : "var(--text-muted)",
              borderBottom: `2px solid ${tab === t ? "var(--accent)" : "transparent"}`,
              marginBottom: -2
            }}>
              {t === "transactions" ? "Transactions" : "Withdrawals"}
            </button>
          ))}
        </div>

        {tab === "transactions" && (
          transactions.length === 0
            ? <EmptyState icon="💰" title="No transactions yet" description="Your wallet activity will appear here" />
            : <div className="table-wrapper">
                <table>
                  <thead><tr><th>Description</th><th>Amount</th><th>Type</th><th>Date</th></tr></thead>
                  <tbody>
                    {transactions.map(t => (
                      <tr key={t.id}>
                        <td style={{ maxWidth: 240 }}><div className="truncate">{t.note || "Transaction"}</div></td>
                        <td style={{ fontWeight: 700, color: t.type === "credit" ? "var(--success)" : "var(--danger)" }}>
                          {t.type === "credit" ? "+" : "-"} GHS {t.amount?.toFixed(2)}
                        </td>
                        <td><Badge type={t.type === "credit" ? "success" : "danger"}>{t.type}</Badge></td>
                        <td style={{ color: "var(--text-muted)", fontSize: 13 }}>
                          {t.createdAt?.seconds ? new Date(t.createdAt.seconds * 1000).toLocaleDateString() : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
        )}

        {tab === "withdrawals" && (
          withdrawals.length === 0
            ? <EmptyState icon="💸" title="No withdrawal requests" description="Submit a withdrawal to get your funds" />
            : <div className="table-wrapper">
                <table>
                  <thead><tr><th>Amount</th><th>Method</th><th>Status</th><th>Date</th></tr></thead>
                  <tbody>
                    {withdrawals.map(w => (
                      <tr key={w.id}>
                        <td style={{ fontWeight: 700 }}>GHS {w.amount?.toFixed(2)}</td>
                        <td>{w.method}</td>
                        <td><StatusBadge status={w.status} /></td>
                        <td style={{ color: "var(--text-muted)", fontSize: 13 }}>
                          {w.createdAt?.seconds ? new Date(w.createdAt.seconds * 1000).toLocaleDateString() : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
        )}
      </div>

      <WithdrawModal
        isOpen={showWithdraw}
        onClose={() => setShowWithdraw(false)}
        balance={wallet.balance}
        settings={settings}
        uid={currentUser.uid}
        onSuccess={() => { setShowWithdraw(false); getUserWithdrawals(currentUser.uid).then(setWithdrawals); }}
      />
    </div>
  );
}

const WithdrawModal = ({ isOpen, onClose, balance, settings, uid, onSuccess }) => {
  const { userDoc } = useAuth();
  const [form, setForm] = useState({ amount: "", method: "Mobile Money", accountNumber: "", accountName: "" });
  const [loading, setLoading] = useState(false);

  const fee = ((parseFloat(form.amount) || 0) * (settings.withdrawalFee || 1.5)) / 100;
  const net = (parseFloat(form.amount) || 0) - fee;

  const handleSubmit = async () => {
    const amt = parseFloat(form.amount);
    if (!amt || amt < 10) return toast.error("Minimum withdrawal is GHS 10");
    if (amt > balance) return toast.error("Insufficient balance");
    if (!form.accountNumber) return toast.error("Enter account details");
    setLoading(true);
    try {
      await debitWallet(uid, amt, `Withdrawal request`);
      await createWithdrawal({
        uid, amount: amt, fee, netAmount: net,
        method: form.method, accountNumber: form.accountNumber,
        accountName: form.accountName || userDoc?.displayName,
        status: "pending"
      });
      toast.success("Withdrawal request submitted! Awaiting admin approval.");
      onSuccess();
    } catch (e) { toast.error(e.message || "Withdrawal failed"); }
    setLoading(false);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Withdraw Funds"
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button variant="primary" loading={loading} onClick={handleSubmit}>Request Withdrawal</Button></>}
    >
      <Alert type="info">Withdrawals are reviewed by admin within 24 hours.</Alert>
      <div style={{ margin: "4px 0 16px", fontSize: 14, color: "var(--text-secondary)" }}>
        Available: <strong>GHS {balance?.toFixed(2)}</strong>
      </div>
      <FormInput label="Amount (GHS)" type="number" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} placeholder="Minimum GHS 10" />
      {form.amount && (
        <div style={{ background: "var(--surface-3)", borderRadius: "var(--radius-sm)", padding: 12, marginBottom: 16, fontSize: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span>Withdrawal Fee ({settings.withdrawalFee || 1.5}%)</span>
            <span style={{ color: "var(--danger)" }}>- GHS {fee.toFixed(2)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700 }}>
            <span>You Receive</span>
            <span style={{ color: "var(--success)" }}>GHS {net.toFixed(2)}</span>
          </div>
        </div>
      )}
      <div className="form-group">
        <label className="form-label">Payment Method</label>
        <select className="form-select" value={form.method} onChange={e => setForm(p => ({ ...p, method: e.target.value }))}>
          <option>Mobile Money</option>
          <option>Bank Transfer</option>
        </select>
      </div>
      <FormInput label="Account Number / Phone" value={form.accountNumber} onChange={e => setForm(p => ({ ...p, accountNumber: e.target.value }))} placeholder="e.g. 0244000000" />
      <FormInput label="Account Name" value={form.accountName} onChange={e => setForm(p => ({ ...p, accountName: e.target.value }))} placeholder="Name on account" />
    </Modal>
  );
};
