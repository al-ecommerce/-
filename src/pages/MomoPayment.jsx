import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { submitMomoPayment, getUserMomoPayments, createNotification } from "../firebase/db";
import { sendMomoSubmittedEmail } from "../services/emailService";
import { validateMomoSubmission, sanitizeText, logSuspiciousActivity } from "../services/abuseProtection";
import { Spinner, Button, Alert, FormInput, PageHeader, StatusBadge, Badge, Modal, toast } from "../components/UI";

const ADMIN_MOMO = "0549548274";
const ADMIN_NAME = "ASVAN Marketplace";
const NETWORK    = "MTN MoMo";          // change if different

export default function MomoPayment() {
  const { currentUser, userDoc } = useAuth();
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (!currentUser) return navigate("/login");
    loadHistory();
  }, [currentUser]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const data = await getUserMomoPayments(currentUser.uid);
      setHistory(data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  return (
    <div className="page-wrapper">
      <div className="container" style={{ paddingTop: 28, maxWidth: 680 }}>
        <PageHeader
          title="Top Up Wallet via MoMo"
          subtitle="Send payment to the admin number and submit your reference here"
          action={<Button variant="primary" onClick={() => setShowForm(true)}>+ Submit Payment</Button>}
        />

        {/* Instructions Card */}
        <div style={{
          background: "linear-gradient(135deg, #0A0F1E, #1a2560)",
          borderRadius: "var(--radius-xl)", padding: "28px 24px",
          color: "#fff", marginBottom: 28,
        }}>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 700, marginBottom: 16, letterSpacing: "-0.2px" }}>
            📱 How to Top Up Your Wallet
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {[
              {
                step: "1",
                title: "Send MoMo Payment",
                desc: `Dial *170# on your phone and send any amount to the ASVAN admin number.`,
                highlight: true,
              },
              {
                step: "2",
                title: "Admin MoMo Number",
                desc: `${ADMIN_MOMO} — ${ADMIN_NAME} (${NETWORK})`,
                highlight: true,
                big: true,
              },
              {
                step: "3",
                title: "Note Your Reference",
                desc: "After sending, note the transaction ID/reference from your MoMo confirmation message.",
                highlight: false,
              },
              {
                step: "4",
                title: "Submit Here",
                desc: 'Click "Submit Payment", enter the amount and your reference. Admin will verify and credit your wallet within minutes.',
                highlight: false,
              },
            ].map(s => (
              <div key={s.step} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                <div style={{
                  width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                  background: "rgba(255,255,255,0.15)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontWeight: 700, fontSize: 13,
                }}>{s.step}</div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>{s.title}</div>
                  <div style={{
                    fontSize: s.big ? 20 : 13,
                    fontFamily: s.big ? "var(--font-display)" : "var(--font-body)",
                    fontWeight: s.big ? 800 : 400,
                    color: s.highlight ? "#93C5FD" : "rgba(255,255,255,0.7)",
                    letterSpacing: s.big ? "1px" : "normal",
                  }}>{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Payment History */}
        <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18, marginBottom: 16, letterSpacing: "-0.2px" }}>
          My Payment History
        </div>

        {loading ? <Spinner center /> : history.length === 0 ? (
          <div style={{
            textAlign: "center", padding: "40px 20px",
            background: "var(--surface-2)", borderRadius: "var(--radius-lg)",
            border: "1px dashed var(--border)",
          }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>💳</div>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>No payment submissions yet</div>
            <div style={{ fontSize: 14, color: "var(--text-muted)", marginBottom: 20 }}>
              Submit your first MoMo payment to get started
            </div>
            <Button variant="primary" onClick={() => setShowForm(true)}>Submit Payment</Button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {history.map(p => (
              <div key={p.id} style={{
                background: "var(--surface)", border: "1px solid var(--border)",
                borderRadius: "var(--radius-lg)", padding: "16px 20px",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 18, fontFamily: "var(--font-display)", color: "var(--accent)" }}>
                      GHS {Number(p.amount).toFixed(2)}
                    </div>
                    <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>
                      Ref: <span style={{ fontFamily: "monospace", fontWeight: 600, color: "var(--text)" }}>{p.reference}</span>
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                      {p.network} · {p.createdAt?.seconds ? new Date(p.createdAt.seconds * 1000).toLocaleString() : ""}
                    </div>
                  </div>
                  <StatusBadge status={p.status} />
                </div>

                {/* Status messages */}
                {p.status === "pending" && (
                  <div style={{ marginTop: 12, padding: "10px 14px", background: "rgba(217,119,6,0.08)", borderRadius: "var(--radius-sm)", fontSize: 13, color: "var(--warning)", fontWeight: 500 }}>
                    ⏳ Awaiting admin verification. Usually done within minutes.
                  </div>
                )}
                {p.status === "verified" && (
                  <div style={{ marginTop: 12, padding: "10px 14px", background: "rgba(5,150,105,0.08)", borderRadius: "var(--radius-sm)", fontSize: 13, color: "var(--success)", fontWeight: 500 }}>
                    ✓ Payment verified. GHS {Number(p.amount).toFixed(2)} has been credited to your wallet.
                  </div>
                )}
                {p.status === "rejected" && (
                  <div style={{ marginTop: 12, padding: "10px 14px", background: "rgba(220,38,38,0.08)", borderRadius: "var(--radius-sm)", fontSize: 13, color: "var(--danger)", fontWeight: 500 }}>
                    ✕ Rejected: {p.rejectReason || "Reference could not be verified. Contact support."}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <SubmitPaymentModal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        currentUser={currentUser}
        userDoc={userDoc}
        onSubmitted={() => { setShowForm(false); loadHistory(); }}
      />
    </div>
  );
}

// ── Submit Payment Modal ──────────────────────────────────
function SubmitPaymentModal({ isOpen, onClose, currentUser, userDoc, onSubmitted }) {
  const [form, setForm] = useState({ amount: "", reference: "", network: "MTN MoMo", senderPhone: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!form.amount || !form.reference) return toast.error("Amount and transaction reference are required");
    const amt = parseFloat(form.amount);
    if (isNaN(amt) || amt <= 0) return toast.error("Enter a valid amount");
    if (form.reference.trim().length < 4) return toast.error("Enter a valid transaction reference");

    setLoading(true);

    // ── Fraud & abuse validation ──────────────────────────
    const validation = await validateMomoSubmission(currentUser.uid, {
      amount:        amt,
      reference:     form.reference.trim(),
      userReference: form.reference.trim(),
      senderPhone:   form.senderPhone.trim(),
    });
    if (!validation.valid) {
      toast.error(validation.reason);
      setLoading(false);
      return;
    }

    try {
      await submitMomoPayment({
        uid:        currentUser.uid,
        userName:   userDoc?.displayName,
        userEmail:  currentUser.email,
        amount:     amt,
        reference:  sanitizeText(form.reference.trim(), 50),
        network:    form.network,
        senderPhone: sanitizeText(form.senderPhone.trim(), 20),
        adminMomo:  ADMIN_MOMO,
      });

      // In-app notification
      await createNotification(currentUser.uid, {
        title: "Payment Submitted for Verification",
        body: `GHS ${amt.toFixed(2)} MoMo payment submitted. Reference: ${form.reference.trim()}. Awaiting admin verification.`,
        type: "payment",
        link: "/momo-payment",
      });

      // Email confirmation to user
      await sendMomoSubmittedEmail(currentUser.email, userDoc?.displayName, amt, form.reference.trim());

      toast.success("Payment submitted! You will be notified once verified.");
      setForm({ amount: "", reference: "", network: "MTN MoMo", senderPhone: "" });
      onSubmitted();
    } catch (e) {
      console.error(e);
      toast.error("Submission failed — " + e.message);
    }
    setLoading(false);
  };

  const f = k => ({ value: form[k], onChange: e => setForm(p => ({ ...p, [k]: e.target.value })) });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Submit MoMo Payment"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" loading={loading} onClick={handleSubmit}>Submit for Verification</Button>
        </>
      }
    >
      <Alert type="info">
        Send money to <strong>{ADMIN_MOMO}</strong> ({ADMIN_NAME}) first, then submit the reference here.
      </Alert>

      <div style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "12px 16px", marginBottom: 16 }}>
        <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>Send MoMo to this number:</div>
        <div style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 800, letterSpacing: "1px", color: "var(--accent)" }}>{ADMIN_MOMO}</div>
        <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>{ADMIN_NAME}</div>
      </div>

      <FormInput label="Amount Sent (GHS) *" type="number" placeholder="e.g. 50.00" {...f("amount")} />

      <div className="form-group">
        <label className="form-label">Mobile Network *</label>
        <select className="form-select" value={form.network} onChange={e => setForm(p => ({ ...p, network: e.target.value }))}>
          <option>MTN MoMo</option>
          <option>Vodafone Cash</option>
          <option>AirtelTigo Money</option>
        </select>
      </div>

      <FormInput
        label="Your Phone Number"
        placeholder="e.g. 0244000000"
        {...f("senderPhone")}
        hint="The number you sent from"
      />

      <FormInput
        label="Transaction Reference / ID *"
        placeholder="e.g. 1234567890 or MP241015ABCDE"
        {...f("reference")}
        hint="Found in your MoMo confirmation SMS after sending"
      />

      <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 8, lineHeight: 1.6, padding: "10px 14px", background: "var(--surface-3)", borderRadius: "var(--radius-sm)" }}>
        ℹ️ An admin will verify your reference against MoMo records and credit your wallet. This usually takes just a few minutes during working hours.
      </div>
    </Modal>
  );
}
