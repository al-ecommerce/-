import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  getServices, getServiceById, getReviewsForTarget,
  createOrder, createEscrow, debitWallet, getWallet,
  getPlatformSettings, createNotification, getUserDoc,
  submitMomoPayment
} from "../firebase/db";
import { ListingCard } from "../components/ListingCard";
import { Spinner, Button, Badge, Alert, StarRating, Modal, PriceTag, PageHeader, SearchBar, EmptyState, VerifiedBadge, ReportButton, FormInput } from "../components/UI";
import { ReportModal } from "../components/ReportModal";
import { sendOrderPlacedEmail, sendMomoSubmittedEmail } from "../services/emailService";
import { toast } from "../components/UI";

const generateRef = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let ref = "ASVAN-";
  for (let i = 0; i < 6; i++) ref += chars[Math.floor(Math.random() * chars.length)];
  return ref;
};

const Countdown = ({ seconds, onExpire }) => {
  const [left, setLeft] = useState(seconds);
  useEffect(() => {
    if (left <= 0) { onExpire(); return; }
    const t = setTimeout(() => setLeft(l => l - 1), 1000);
    return () => clearTimeout(t);
  }, [left]);
  const m = String(Math.floor(left / 60)).padStart(2, "0");
  const s = String(left % 60).padStart(2, "0");
  const urgent = left < 300;
  return (
    <div style={{
      textAlign: "center", padding: "12px 16px",
      background: urgent ? "rgba(220,38,38,0.08)" : "rgba(5,150,105,0.08)",
      border: `1px solid ${urgent ? "rgba(220,38,38,0.25)" : "rgba(5,150,105,0.25)"}`,
      borderRadius: "var(--radius-sm)", marginBottom: 16,
    }}>
      <div style={{ fontSize: 12, color: urgent ? "var(--danger)" : "var(--success)", fontWeight: 600, marginBottom: 4 }}>
        {urgent ? "⚠ Time running out!" : "⏱ Time remaining to complete payment"}
      </div>
      <div style={{ fontFamily: "var(--font-display)", fontSize: 32, fontWeight: 800, color: urgent ? "var(--danger)" : "var(--text)", letterSpacing: "2px" }}>
        {m}:{s}
      </div>
    </div>
  );
};

const CATEGORIES = ["All", "Design", "Development", "Writing", "Marketing", "Tutoring", "Legal", "Finance", "Health", "Other"];

export function ServicesPage() {
  const { isSeller } = useAuth();
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const filters = {};
        if (category !== "All") filters.category = category;
        const data = await getServices(filters);
        setServices(data);
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    load();
  }, [category]);

  const filtered = services.filter(s => !search || s.title?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="page-wrapper">
      <div className="container" style={{ paddingTop: 28 }}>
        <PageHeader
          title="Services"
          subtitle={`${filtered.length} services available`}
          action={isSeller && <Button variant="primary" onClick={() => navigate("/seller-dashboard?tab=services")}>+ Add Service</Button>}
        />
        <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 240px" }}>
            <SearchBar value={search} onChange={setSearch} placeholder="Search services..." />
          </div>
          <div style={{ flex: "0 0 160px" }}>
            <select className="form-select" value={category} onChange={e => setCategory(e.target.value)}>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 16, marginBottom: 8 }}>
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => setCategory(c)} style={{
              flexShrink: 0, padding: "6px 14px", borderRadius: 20,
              border: "1.5px solid " + (category === c ? "var(--accent)" : "var(--border)"),
              background: category === c ? "var(--accent-glow)" : "var(--surface)",
              color: category === c ? "var(--accent)" : "var(--text-secondary)",
              fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-body)"
            }}>{c}</button>
          ))}
        </div>
        {loading ? <Spinner center />
          : filtered.length > 0
            ? <div className="grid grid-4" style={{ gap: 16 }}>
                {filtered.map(s => <ListingCard key={s.id} item={s} type="service" />)}
              </div>
            : <EmptyState icon="🛠" title="No services found" description="Try adjusting your search or filters" />
        }
      </div>
    </div>
  );
}

export function ServiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser, userDoc } = useAuth();
  const [service,      setService]      = useState(null);
  const [reviews,      setReviews]      = useState([]);
  const [seller,       setSeller]       = useState(null);
  const [settings,     setSettings]     = useState({});
  const [loading,      setLoading]      = useState(true);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [showReport,   setShowReport]   = useState(false);

  // Payment flow
  const [payStep,     setPayStep]     = useState("choose");
  const [payMethod,   setPayMethod]   = useState("momo");
  const [processing,  setProcessing]  = useState(false);
  const [momoRef,     setMomoRef]     = useState("");
  const [userRef,     setUserRef]     = useState("");
  const [senderPhone, setSenderPhone] = useState("");
  const [expired,     setExpired]     = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [s, r, st] = await Promise.all([getServiceById(id), getReviewsForTarget(id), getPlatformSettings()]);
        if (!s) { navigate("/services"); return; }
        setService(s); setReviews(r); setSettings(st);
        if (s.sellerId) setSeller(await getUserDoc(s.sellerId));
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    load();
  }, [id]);

  const escrowFeeAmt = ((service?.price || 0) * (settings.escrowFee || 2)) / 100;
  const grandTotal   = (service?.price || 0) + escrowFeeAmt;

  const openBuy = () => {
    if (!currentUser)               return navigate("/login");
    if (!currentUser.emailVerified) return toast.error("Please verify your email address first");
    setPayStep("choose"); setPayMethod("momo");
    setMomoRef(generateRef()); setUserRef(""); setSenderPhone(""); setExpired(false);
    setShowBuyModal(true);
  };

  // Wallet pay
  const handleWalletPay = async () => {
    setProcessing(true);
    try {
      const wallet = await getWallet(currentUser.uid);
      if (wallet.balance < grandTotal) {
        toast.error(`Insufficient wallet balance. You need GHS ${grandTotal.toFixed(2)}.`);
        setProcessing(false); return;
      }
      await debitWallet(currentUser.uid, grandTotal, `Service: ${service.title}`);
      const order = await createOrder({
        buyerId: currentUser.uid, buyerName: userDoc?.displayName,
        sellerId: service.sellerId, itemId: id, itemTitle: service.title,
        itemType: "service", amount: service.price,
        commission: (service.price * (settings.commissionRate || 10)) / 100,
        escrowFee: escrowFeeAmt, grandTotal,
        status: "paid", paymentMethod: "wallet",
      });
      await createEscrow({
        orderId: order.id, buyerId: currentUser.uid, sellerId: service.sellerId,
        amount: service.price, escrowFee: escrowFeeAmt,
        commission: (service.price * (settings.commissionRate || 10)) / 100,
        status: "held", itemTitle: service.title,
      });
      await createNotification(service.sellerId, {
        title: "New Booking!", body: `${userDoc?.displayName} booked "${service.title}"`,
        type: "order", link: `/orders/${order.id}`,
      });
      try { await sendOrderPlacedEmail(currentUser.email, userDoc?.displayName, order.id, service.price, service.title); } catch (e) {}
      setShowBuyModal(false);
      toast.success("Service booked! Payment held in escrow.");
      navigate(`/orders/${order.id}`);
    } catch (e) { toast.error(e.message || "Payment failed"); }
    setProcessing(false);
  };

  // MoMo direct
  const handleMomoProceed = () => {
    if (!senderPhone.trim()) return toast.error("Please enter your MoMo phone number");
    setPayStep("momo");
  };

  const handleMomoConfirm = async () => {
    if (!userRef.trim()) return toast.error("Please enter the transaction ID from your MoMo SMS");
    setProcessing(true);
    try {
      const order = await createOrder({
        buyerId: currentUser.uid, buyerName: userDoc?.displayName,
        sellerId: service.sellerId, itemId: id, itemTitle: service.title,
        itemType: "service", amount: service.price,
        commission: (service.price * (settings.commissionRate || 10)) / 100,
        escrowFee: escrowFeeAmt, grandTotal,
        status: "awaiting_payment", paymentMethod: "momo_direct",
        momoReference: momoRef, userReference: userRef.trim(),
        senderPhone: senderPhone.trim(),
        paymentDeadline: new Date(Date.now() + 30 * 60 * 1000),
      });
      await submitMomoPayment({
        uid: currentUser.uid, userName: userDoc?.displayName,
        userEmail: currentUser.email, amount: grandTotal,
        reference: momoRef, userReference: userRef.trim(),
        senderPhone: senderPhone.trim(), adminMomo: "0549548274",
        orderId: order.id, sellerId: service.sellerId,
        itemTitle: service.title, type: "checkout",
      });
      await createNotification("admin", {
        title: `⚡ Payment to Verify — GHS ${grandTotal.toFixed(2)}`,
        body: `${userDoc?.displayName} sent GHS ${grandTotal.toFixed(2)} for "${service.title}". Ref: ${momoRef}.`,
        type: "payment", link: "/admin/momo",
      });
      try { await sendMomoSubmittedEmail(currentUser.email, userDoc?.displayName, grandTotal, momoRef); } catch (e) {}
      setPayStep("submitted");
    } catch (e) { toast.error(e.message || "Submission failed"); }
    setProcessing(false);
  };

  if (loading) return <Spinner center />;
  if (!service) return null;

  const avgRating = reviews.length ? reviews.reduce((a, r) => a + r.rating, 0) / reviews.length : 0;

  return (
    <div className="page-wrapper">
      <div className="container" style={{ paddingTop: 28 }}>
        <button onClick={() => navigate(-1)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, color: "var(--text-muted)", fontSize: 14, marginBottom: 20 }}>← Back</button>
        <div style={{ display: "grid", gridTemplateColumns: "1fr min(320px,100%)", gap: 28 }} className="detail-grid">
          <div>
            {service.imageURL && (
              <div style={{ width: "100%", height: 340, borderRadius: "var(--radius-xl)", overflow: "hidden", marginBottom: 24, border: "1px solid var(--border)" }}>
                <img src={service.imageURL} alt={service.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <h1 style={{ fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 700 }}>{service.title}</h1>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
                  <StarRating value={avgRating} readonly />
                  <span style={{ fontSize: 14, color: "var(--text-muted)" }}>({reviews.length} reviews)</span>
                </div>
              </div>
              <ReportButton onReport={() => setShowReport(true)} />
            </div>
            <p style={{ color: "var(--text-secondary)", lineHeight: 1.8, margin: "20px 0" }}>{service.description}</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 24 }}>
              {service.category     && <Badge type="muted">📁 {service.category}</Badge>}
              {service.deliveryTime && <Badge type="muted">⏱ {service.deliveryTime}</Badge>}
              {service.location     && <Badge type="muted">📍 {service.location}</Badge>}
            </div>
            {seller && (
              <div className="card" style={{ marginBottom: 24 }}>
                <div style={{ fontWeight: 700, marginBottom: 12 }}>Service Provider</div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: "50%", background: "var(--accent-glow)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "var(--accent)", fontSize: 18 }}>
                    {seller.displayName?.[0] || "S"}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontWeight: 700 }}>{seller.displayName}</span>
                      {seller.isSellerVerified && <VerifiedBadge />}
                    </div>
                    <div style={{ fontSize: 13, color: "var(--text-muted)" }}>{seller.location || "Ghana"}</div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => navigate(`/chat?with=${service.sellerId}`)}>💬 Chat</Button>
                </div>
              </div>
            )}
            <div>
              <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, marginBottom: 16 }}>Reviews</h3>
              {reviews.length === 0 ? <p style={{ color: "var(--text-muted)", fontSize: 14 }}>No reviews yet.</p>
                : reviews.map(r => (
                  <div key={r.id} className="card" style={{ padding: 16, marginBottom: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                      <span style={{ fontWeight: 600 }}>{r.reviewerName || "User"}</span>
                      <StarRating value={r.rating} readonly />
                    </div>
                    <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>{r.comment}</p>
                  </div>
                ))}
            </div>
          </div>

          {/* Buy box */}
          <div>
            <div className="card" style={{ position: "sticky", top: "calc(var(--nav-height) + 16px)" }}>
              <PriceTag amount={service.price} size="lg" />
              <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>{service.priceType || "fixed price"}</div>
              <hr style={{ margin: "16px 0", borderColor: "var(--border)" }} />
              {service.deliveryTime && (
                <div style={{ display: "flex", gap: 8, marginBottom: 12, fontSize: 14 }}>
                  <span>⏱</span><span><strong>Delivery:</strong> {service.deliveryTime}</span>
                </div>
              )}
              <div style={{ background: "var(--surface-2)", borderRadius: "var(--radius-sm)", padding: 14, marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 4 }}>
                  <span style={{ color: "var(--text-muted)" }}>Service fee</span>
                  <span>GHS {service.price?.toFixed(2)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 4 }}>
                  <span style={{ color: "var(--text-muted)" }}>Escrow fee ({settings.escrowFee || 2}%)</span>
                  <span>GHS {escrowFeeAmt.toFixed(2)}</span>
                </div>
                <hr style={{ margin: "8px 0", borderColor: "var(--border)" }} />
                <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700 }}>
                  <span>Total</span><span style={{ color: "var(--accent)" }}>GHS {grandTotal.toFixed(2)}</span>
                </div>
              </div>
              {service.sellerId === currentUser?.uid
                ? <Alert type="info">This is your service</Alert>
                : <Button variant="primary" full size="lg" onClick={openBuy}>📅 Book Service</Button>
              }
              <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 6, fontSize: 12, color: "var(--text-muted)", marginTop: 14 }}>
                <div>🔒 Escrow Protection — pay only when satisfied</div>
                <div>📱 Pay via MoMo or Wallet</div>
                <div>🛡 Buyer Protection Guaranteed</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal — same flow as ProductDetail */}
      <Modal
        isOpen={showBuyModal}
        onClose={() => { if (payStep !== "momo" || expired) setShowBuyModal(false); }}
        title={
          payStep === "choose"    ? "Choose Payment Method" :
          payStep === "momo"      ? "Complete MoMo Payment" :
          "Payment Submitted!"
        }
      >
        {payStep === "choose" && (
          <div>
            <div style={{ fontWeight: 600, marginBottom: 6, fontSize: 15 }}>{service.title}</div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22, color: "var(--accent)", marginBottom: 20 }}>
              GHS {grandTotal.toFixed(2)}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
              {[
                { key: "momo",   icon: "📱", title: "Pay via MoMo",     desc: "MTN · Vodafone · AirtelTigo — pay now, no pre-loading" },
                { key: "wallet", icon: "💰", title: "Pay from Wallet",   desc: "Use your ASVAN wallet balance — instant confirmation" },
              ].map(m => (
                <div key={m.key} onClick={() => setPayMethod(m.key)} style={{
                  border: `2px solid ${payMethod === m.key ? "var(--accent)" : "var(--border)"}`,
                  borderRadius: "var(--radius)", padding: "16px", cursor: "pointer",
                  background: payMethod === m.key ? "var(--accent-glow)" : "var(--surface)",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ fontSize: 28 }}>{m.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>{m.title}</div>
                      <div style={{ fontSize: 13, color: "var(--text-muted)" }}>{m.desc}</div>
                    </div>
                    {payMethod === m.key && <div style={{ width: 20, height: 20, borderRadius: "50%", background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 12, fontWeight: 700 }}>✓</div>}
                  </div>
                </div>
              ))}
            </div>
            {payMethod === "momo" && (
              <FormInput label="Your MoMo Phone Number" type="tel" value={senderPhone} onChange={e => setSenderPhone(e.target.value)} placeholder="e.g. 0244000000" hint="The number you will send from" />
            )}
            <Alert type="info">🔒 Payment held in escrow until you confirm the service is delivered.</Alert>
            <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
              <Button variant="secondary" full onClick={() => setShowBuyModal(false)}>Cancel</Button>
              <Button variant="primary" full loading={processing} onClick={payMethod === "wallet" ? handleWalletPay : handleMomoProceed}>
                {payMethod === "wallet" ? "Pay from Wallet" : "Continue to MoMo →"}
              </Button>
            </div>
          </div>
        )}

        {payStep === "momo" && !expired && (
          <div>
            <Countdown seconds={1800} onExpire={() => setExpired(true)} />
            <div style={{ background: "var(--primary)", borderRadius: "var(--radius)", padding: "20px", textAlign: "center", marginBottom: 20 }}>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginBottom: 6, fontWeight: 600, letterSpacing: "1px" }}>YOUR UNIQUE PAYMENT CODE</div>
              <div style={{ fontFamily: "monospace", fontSize: 28, fontWeight: 900, color: "#fff", letterSpacing: "4px" }}>{momoRef}</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 6 }}>Use this exact code as your payment reference</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
              {[
                { n: "1", t: `Dial *170# or open your MoMo app` },
                { n: "2", t: `Send GHS ${grandTotal.toFixed(2)} to 0549548274 (ASVAN)` },
                { n: "3", t: `Type ${momoRef} in the narration/reference field`, highlight: true },
                { n: "4", t: "Copy the transaction ID from your confirmation SMS and paste below" },
              ].map(s => (
                <div key={s.n} style={{ display: "flex", gap: 10, padding: "10px 12px", background: s.highlight ? "rgba(26,86,219,0.06)" : "var(--surface-2)", border: `1px solid ${s.highlight ? "rgba(26,86,219,0.2)" : "var(--border)"}`, borderRadius: "var(--radius-sm)" }}>
                  <div style={{ width: 22, height: 22, borderRadius: "50%", flexShrink: 0, background: "var(--accent)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700 }}>{s.n}</div>
                  <div style={{ fontSize: 13, lineHeight: 1.5 }}>{s.t}</div>
                </div>
              ))}
            </div>
            <FormInput label="Transaction ID from your MoMo SMS *" value={userRef} onChange={e => setUserRef(e.target.value)} placeholder="e.g. MP241015ABCDE" hint="Found in the confirmation SMS after sending" />
            <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
              <Button variant="secondary" full onClick={() => setPayStep("choose")}>← Back</Button>
              <Button variant="primary" full loading={processing} onClick={handleMomoConfirm}>I Have Sent the Payment ✓</Button>
            </div>
          </div>
        )}

        {payStep === "momo" && expired && (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>⏰</div>
            <h3 style={{ fontFamily: "var(--font-display)", marginBottom: 10 }}>Payment Time Expired</h3>
            <p style={{ color: "var(--text-muted)", fontSize: 14, marginBottom: 20 }}>The 30-minute window passed. Please start a new booking.</p>
            <Button variant="primary" onClick={() => { setShowBuyModal(false); setExpired(false); }}>Try Again</Button>
          </div>
        )}

        {payStep === "submitted" && (
          <div style={{ textAlign: "center", padding: "10px 0" }}>
            <div style={{ fontSize: 52, marginBottom: 12 }}>✅</div>
            <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, marginBottom: 10 }}>Payment Submitted!</h3>
            <p style={{ color: "var(--text-secondary)", fontSize: 14, lineHeight: 1.7, marginBottom: 20 }}>
              Your payment of <strong>GHS {grandTotal.toFixed(2)}</strong> is being verified by an admin. You will be notified once your booking is confirmed.
            </p>
            <div style={{ background: "var(--surface-2)", borderRadius: "var(--radius-sm)", padding: "12px 16px", marginBottom: 20, fontSize: 13 }}>
              <div style={{ color: "var(--text-muted)", marginBottom: 4 }}>Reference Code</div>
              <div style={{ fontFamily: "monospace", fontWeight: 800, fontSize: 18, letterSpacing: "2px" }}>{momoRef}</div>
            </div>
            <Button variant="primary" full onClick={() => { setShowBuyModal(false); navigate("/orders"); }}>View My Orders</Button>
          </div>
        )}
      </Modal>

      <ReportModal isOpen={showReport} onClose={() => setShowReport(false)} targetId={id} targetType="service" />
    </div>
  );
}
