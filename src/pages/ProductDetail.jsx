import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  getProductById, getReviewsForTarget, createOrder, createEscrow,
  getWallet, getPlatformSettings, createNotification, getUserDoc, updateProduct,
  submitMomoPayment, debitWallet
} from "../firebase/db";
import { sendOrderPlacedEmail, sendMomoSubmittedEmail } from "../services/emailService";
import {
  Spinner, Button, Badge, Alert, StarRating, Modal,
  PriceTag, ReportButton, VerifiedBadge, toast, FormInput
} from "../components/UI";
import { ReportModal } from "../components/ReportModal";
import ProductGallery from "../components/ProductGallery";
import { ShareProductButton } from "../components/ShareProduct";
import { SellerBadgeList } from "../components/SellerBadges";

// ─── HELPERS ─────────────────────────────────────────────
const generateRef = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let ref = "ASVAN-";
  for (let i = 0; i < 6; i++) ref += chars[Math.floor(Math.random() * chars.length)];
  return ref;
};

// ─── COUNTDOWN ───────────────────────────────────────────
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
      <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
        Order will auto-cancel if payment not confirmed by admin
      </div>
    </div>
  );
};

// ─── MICRO STYLES ────────────────────────────────────────
const tileWrap  = { padding: "10px 12px", background: "var(--surface-2)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)" };
const tileLabel = { fontSize: 11, color: "var(--text-muted)", fontWeight: 600, marginBottom: 2 };
const tileValue = { fontSize: 13, fontWeight: 700, color: "var(--text)" };

// ─── SELLER CARD ─────────────────────────────────────────
// Only shows public, non-sensitive info: name, verified status, region, badges.
// Phone, WhatsApp, and full address are intentionally excluded to prevent fraud.
const SellerCard = ({ seller, sellerId, navigate }) => {
  // Safe public fields only — never expose phone, WhatsApp, or precise address
  const regionLabel = seller.region || null;

  return (
    <div className="card" style={{ marginBottom: 24 }}>
      <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>About the Seller</div>

      {/* Avatar row */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
        <div style={{
          width: 52, height: 52, borderRadius: "50%", flexShrink: 0,
          background: "var(--accent-glow)", display: "flex", alignItems: "center",
          justifyContent: "center", fontWeight: 800, color: "var(--accent)",
          fontSize: 22, border: "2px solid var(--accent)",
        }}>
          {seller.displayName?.[0]?.toUpperCase() || "S"}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            <span style={{ fontWeight: 700, fontSize: 15 }}>{seller.displayName}</span>
            {seller.isSellerVerified && <VerifiedBadge />}
          </div>
          {/* Show region only — not city, town, or street-level info */}
          {regionLabel && (
            <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>
              📍 {regionLabel}, Ghana
            </div>
          )}
          <div style={{ marginTop: 6 }}>
            <SellerBadgeList userDoc={seller} size="sm" />
          </div>
        </div>
      </div>

      {/* Region tile — only if available */}
      {regionLabel && (
        <div style={{ marginBottom: 16 }}>
          <div style={tileWrap}>
            <div style={tileLabel}>🗺 Region</div>
            <div style={tileValue}>{regionLabel}</div>
          </div>
        </div>
      )}

      {/* Info notice — direct contact handled securely via platform chat */}
      <div style={{
        padding: "10px 12px", marginBottom: 14,
        background: "rgba(79,142,255,0.06)",
        border: "1px solid rgba(79,142,255,0.18)",
        borderRadius: "var(--radius-sm)",
        fontSize: 12, color: "var(--text-muted)", lineHeight: 1.6,
      }}>
        💬 Contact the seller safely through our in-platform messaging — no personal details needed.
      </div>

      {/* Actions — platform-mediated only */}
      <div style={{ display: "flex", gap: 8 }}>
        <Button variant="secondary" size="sm" full onClick={() => navigate(`/store/${sellerId}`)}>
          🏪 View Store
        </Button>
        <Button variant="outline" size="sm" full onClick={() => navigate(`/chat?with=${sellerId}`)}>
          💬 Message Seller
        </Button>
      </div>
    </div>
  );
};

// ─── GUEST GATE ──────────────────────────────────────────
const GuestGate = ({ navigate, product }) => (
  <div style={{ margin: "28px 0", border: "1.5px solid var(--border)", borderRadius: "var(--radius-xl)", overflow: "hidden" }}>

    {/* Blurred description preview */}
    <div style={{ position: "relative", overflow: "hidden" }}>
      <div style={{
        padding: "20px 24px 0", fontSize: 14, color: "var(--text-secondary)",
        lineHeight: 1.8, filter: "blur(5px)", userSelect: "none",
        pointerEvents: "none", maxHeight: 96,
      }}>
        {product.description || "Full product description, seller details, reviews, and secure checkout are available to registered members."}
      </div>
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 64, background: "linear-gradient(transparent, var(--surface))" }} />
    </div>

    {/* Dark CTA */}
    <div style={{ padding: "28px 24px", background: "linear-gradient(135deg, #0A0F1E 0%, #1a2560 100%)", textAlign: "center" }}>
      <div style={{ fontSize: 38, marginBottom: 10 }}>🔐</div>
      <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, color: "#fff", fontSize: 18, marginBottom: 8 }}>
        Sign in to see the full listing
      </div>
      <p style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", marginBottom: 20, lineHeight: 1.7, maxWidth: 320, margin: "0 auto 20px" }}>
        Free members unlock the full description, seller profile, all reviews, delivery options, and escrow-protected checkout.
      </p>

      {/* What you unlock */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 22, textAlign: "left" }}>
        {[
          "📝 Full product description",
          "🏪 Seller profile & store",
          "⭐ All reviews & ratings",
          "🚚 Delivery options & fee",
          "🔒 Escrow-protected checkout",
          "💬 Direct seller messaging",
        ].map(item => (
          <div key={item} style={{
            fontSize: 12, color: "rgba(255,255,255,0.8)",
            display: "flex", alignItems: "center", gap: 6,
            padding: "7px 10px", background: "rgba(255,255,255,0.07)",
            borderRadius: "var(--radius-sm)",
          }}>
            {item}
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
        <button
          onClick={() => navigate("/register")}
          style={{ flex: 1, maxWidth: 180, padding: "12px 0", background: "var(--accent)", color: "#fff", border: "none", borderRadius: "var(--radius-sm)", fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 14, cursor: "pointer" }}
        >
          Create Free Account
        </button>
        <button
          onClick={() => navigate("/login")}
          style={{ flex: 1, maxWidth: 180, padding: "12px 0", background: "transparent", color: "rgba(255,255,255,0.85)", border: "1px solid rgba(255,255,255,0.25)", borderRadius: "var(--radius-sm)", fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 14, cursor: "pointer" }}
        >
          Sign In
        </button>
      </div>
    </div>
  </div>
);

// ─── MAIN COMPONENT ───────────────────────────────────────
export default function ProductDetail() {
  const { id }      = useParams();
  const navigate    = useNavigate();
  const { currentUser, userDoc, loading: authLoading } = useAuth();

  const [product,         setProduct]         = useState(null);
  const [reviews,         setReviews]         = useState([]);
  const [seller,          setSeller]          = useState(null);
  const [settings,        setSettings]        = useState({});
  const [loading,         setLoading]         = useState(true);
  const [showBuyModal,    setShowBuyModal]    = useState(false);
  const [showReport,      setShowReport]      = useState(false);
  const [showGuestPrompt, setShowGuestPrompt] = useState(false);
  const [qty,             setQty]             = useState(1);

  const [payStep,     setPayStep]     = useState("delivery");
  const [payMethod,   setPayMethod]   = useState("momo");
  const [processing,  setProcessing]  = useState(false);
  const [momoRef,     setMomoRef]     = useState("");
  const [userRef,     setUserRef]     = useState("");
  const [senderPhone, setSenderPhone] = useState("");
  const [expired,     setExpired]     = useState(false);

  const [deliveryType,     setDeliveryType]     = useState("delivery");
  const [deliveryAddress,  setDeliveryAddress]  = useState("");
  const [deliveryLandmark, setDeliveryLandmark] = useState("");
  const [preferredTime,    setPreferredTime]    = useState("");
  const [deliveryNote,     setDeliveryNote]     = useState("");

  // ── Load product ─────────────────────────────────────────
  useEffect(() => {
    if (authLoading) return;

    const load = async () => {
      try {
        const p = await getProductById(id).catch(() => null);
        if (!p) { navigate("/products"); return; }
        setProduct(p);

        const [r, s] = await Promise.all([
          getReviewsForTarget(id).catch(() => []),
          getPlatformSettings().catch(() => ({ commissionRate: 10, escrowFee: 2, withdrawalFee: 1.5 })),
        ]);
        setReviews(r);
        setSettings(s);

        if (p.sellerId) {
          getUserDoc(p.sellerId)
            .then(sellerData => {
              // Strip sensitive fields before storing in state — defence in depth.
              // Even if getUserDoc returns them, we never put them in component state.
              const { phone, whatsapp, email, address, street, houseNumber, ...safe } = sellerData || {};
              setSeller(safe);
            })
            .catch(e => console.warn("Seller load:", e.message));
        }

        if (currentUser) {
          updateProduct(id, { views: (p.views || 0) + 1 }).catch(() => {});
        }
      } catch (e) {
        console.error("ProductDetail load:", e.message);
      }
      setLoading(false);
    };
    load();
  }, [id, authLoading]);

  // ── Derived values ────────────────────────────────────────
  const total        = (product?.price || 0) * qty;
  const escrowFeeAmt = (total * (settings.escrowFee || 2)) / 100;
  const grandTotal   = total + escrowFeeAmt;
  const isLarge      = grandTotal >= 500;
  const avgRating    = reviews.length ? reviews.reduce((a, r) => a + r.rating, 0) / reviews.length : 0;
  const isGuest      = !currentUser;

  const deliveryFee = (() => {
    if (deliveryType === "meetup") return 0;
    if (product?.deliveryFee > 0) return product.deliveryFee;
    // Compare only region/town — not precise address
    const sellerRegion = (seller?.region || "").toLowerCase().trim();
    const buyerTown    = (deliveryAddress || userDoc?.town || "").split(",")[0].toLowerCase().trim();
    if (!sellerRegion || !buyerTown) return 10;
    return sellerRegion.includes(buyerTown) || buyerTown.includes(sellerRegion) ? 5 : 20;
  })();

  const openBuy = () => {
    if (!currentUser) { setShowGuestPrompt(true); return; }
    if (!currentUser.emailVerified) return toast.error("Please verify your email address first");
    if (product.sellerId === currentUser.uid) return toast.error("You cannot purchase your own listing.");
    if (product.status !== "active" && product.status !== "approved") return toast.error("This listing is not currently available.");
    setPayStep("delivery");
    setPayMethod("momo");
    setMomoRef(generateRef());
    setUserRef(""); setSenderPhone(""); setExpired(false);
    setDeliveryAddress(userDoc?.location || "");
    setDeliveryLandmark(userDoc?.deliveryLandmark || "");
    setPreferredTime(""); setDeliveryNote("");
    setShowBuyModal(true);
  };

  const deliveryData = {
    deliveryType, deliveryFee,
    deliveryAddress:  deliveryAddress.trim(),
    deliveryLandmark: deliveryLandmark.trim(),
    preferredTime,
    deliveryNote:     deliveryNote.trim(),
    // Store buyer's own phone for delivery coordination — never seller's
    buyerPhone: userDoc?.phone || "",
    buyerTown:  userDoc?.town  || "",
  };

  const handleWalletPay = async () => {
    setProcessing(true);
    const finalTotal = total + deliveryFee + escrowFeeAmt;
    try {
      const wallet = await getWallet(currentUser.uid);
      if (wallet.balance < finalTotal) {
        toast.error(`Insufficient balance. Need GHS ${finalTotal.toFixed(2)}.`);
        setProcessing(false); return;
      }
      await debitWallet(currentUser.uid, finalTotal, `Purchase: ${product.title}`);
      const order = await createOrder({
        buyerId: currentUser.uid, buyerName: userDoc?.displayName, buyerPhone: userDoc?.phone || "",
        sellerId: product.sellerId, itemId: id, itemTitle: product.title,
        itemType: "product", quantity: qty, amount: total,
        commission: (total * (settings.commissionRate || 10)) / 100,
        escrowFee: escrowFeeAmt, grandTotal: finalTotal,
        status: "paid", paymentMethod: "wallet", ...deliveryData,
      });
      await createEscrow({
        orderId: order.id, buyerId: currentUser.uid, sellerId: product.sellerId,
        amount: total, commission: (total * (settings.commissionRate || 10)) / 100,
        escrowFee: escrowFeeAmt, status: "held", itemTitle: product.title,
      });
      await createNotification(product.sellerId, {
        title: "🛒 New Order!",
        body: `${userDoc?.displayName} ordered "${product.title}"`,
        type: "order", link: `/orders/${order.id}`,
      });
      try { await sendOrderPlacedEmail(currentUser.email, userDoc?.displayName, order.id, total, product.title); } catch (_) {}
      setShowBuyModal(false);
      toast.success("Order placed! Payment held in escrow.");
      navigate(`/orders/${order.id}`);
    } catch (e) { toast.error(e.message || "Payment failed"); }
    setProcessing(false);
  };

  const handleMomoProceed = () => {
    if (!senderPhone.trim()) return toast.error("Enter the phone number you will send from");
    setPayStep("momo");
  };

  const handleMomoConfirm = async () => {
    if (!userRef.trim() || userRef.trim().length < 4) return toast.error("Enter the transaction ID from your MoMo SMS");
    setProcessing(true);
    try {
      const order = await createOrder({
        buyerId: currentUser.uid, buyerName: userDoc?.displayName,
        sellerId: product.sellerId, itemId: id, itemTitle: product.title,
        itemType: "product", quantity: qty, amount: total,
        commission: (total * (settings.commissionRate || 10)) / 100,
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
        orderId: order.id, sellerId: product.sellerId,
        itemTitle: product.title, type: "checkout",
      });
      await createNotification("admin", {
        title: `⚡ Payment to Verify — GHS ${grandTotal.toFixed(2)}`,
        body: `${userDoc?.displayName} — "${product.title}". Ref: ${momoRef}`,
        type: "payment", link: "/admin/momo",
      });
      try { await sendMomoSubmittedEmail(currentUser.email, userDoc?.displayName, grandTotal, momoRef); } catch (_) {}
      try { await sendOrderPlacedEmail(currentUser.email, userDoc?.displayName, order.id, total, product.title); } catch (_) {}
      setPayStep("submitted");
    } catch (e) { toast.error(e.message || "Submission failed"); }
    setProcessing(false);
  };

  const handleExpire = () => { setExpired(true); toast.error("Payment time expired. Please try again."); };

  if (authLoading || loading) return <Spinner center />;
  if (!product) return null;

  // ── RENDER ────────────────────────────────────────────────
  return (
    <div className="page-wrapper">
      <div className="container" style={{ paddingTop: 28 }}>
        <button
          onClick={() => navigate(-1)}
          style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, color: "var(--text-muted)", fontSize: 14, marginBottom: 20 }}
        >← Back</button>

        {/* ════════════ GUEST LAYOUT ════════════ */}
        {isGuest ? (
          <div style={{ maxWidth: 680, margin: "0 auto" }}>
            <ProductGallery product={product} />

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginTop: 24, marginBottom: 12 }}>
              <div>
                <h1 style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 700 }}>{product.title}</h1>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
                  <StarRating value={avgRating} readonly />
                  <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
                    {reviews.length} review{reviews.length !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>
              <ShareProductButton product={product} />
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
              <PriceTag amount={product.price} size="lg" />
              {product.category  && <Badge type="muted">📁 {product.category}</Badge>}
              {product.condition && <Badge type="muted">📊 {product.condition}</Badge>}
              {/* Location badge intentionally omitted for guests */}
            </div>

            {product.description && (
              <p style={{ color: "var(--text-secondary)", lineHeight: 1.7, fontSize: 15, marginBottom: 0 }}>
                {product.description.split(/[.!?]/)[0].trim()}
                {product.description.length > 60 ? "…" : ""}
              </p>
            )}

            <GuestGate navigate={navigate} product={product} />

            {/* Seller teaser — name + verified only, zero contact info */}
            {seller && (
              <div style={{
                padding: "14px 18px", border: "1px solid var(--border)",
                borderRadius: "var(--radius-lg)", background: "var(--surface)",
                display: "flex", alignItems: "center", gap: 14,
              }}>
                <div style={{ width: 44, height: 44, borderRadius: "50%", background: "var(--accent-glow)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, color: "var(--accent)", fontSize: 18 }}>
                  {seller.displayName?.[0]?.toUpperCase() || "S"}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center", gap: 6 }}>
                    {seller.displayName}
                    {seller.isSellerVerified && <VerifiedBadge />}
                  </div>
                  {/* No location, no contact hint */}
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                    Sign in to view seller profile and message safely
                  </div>
                </div>
                <Button variant="secondary" size="sm" onClick={() => navigate("/login")}>Sign In</Button>
              </div>
            )}
          </div>

        ) : (
          /* ════════════ LOGGED-IN LAYOUT ════════════ */
          <div style={{ display: "grid", gridTemplateColumns: "1fr min(340px,100%)", gap: 28 }} className="detail-grid">

            {/* LEFT column */}
            <div>
              <ProductGallery product={product} />

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginTop: 24 }}>
                <div>
                  <h1 style={{ fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 700 }}>{product.title}</h1>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
                    <StarRating value={avgRating} readonly />
                    <span style={{ fontSize: 14, color: "var(--text-muted)" }}>({reviews.length} reviews)</span>
                    {product.featured && <Badge type="warning">⭐ Featured</Badge>}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <ShareProductButton product={product} />
                  <ReportButton onReport={() => setShowReport(true)} />
                </div>
              </div>

              <p style={{ color: "var(--text-secondary)", lineHeight: 1.8, margin: "20px 0" }}>{product.description}</p>

              {product.videoURL && (
                <a href={product.videoURL} target="_blank" rel="noopener noreferrer" style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  padding: "10px 20px", marginBottom: 20,
                  background: "linear-gradient(135deg,#FF0000,#CC0000)",
                  color: "#fff", borderRadius: "var(--radius-sm)",
                  fontWeight: 700, fontSize: 14, textDecoration: "none",
                  boxShadow: "0 4px 14px rgba(220,38,38,0.3)",
                }}>🎬 Watch Product Video</a>
              )}

              <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 24 }}>
                {product.category  && <Badge type="muted">📁 {product.category}</Badge>}
                {product.condition && <Badge type="muted">📊 {product.condition}</Badge>}
                {product.location  && <Badge type="muted">📍 {product.location}</Badge>}
                {product.pricingType && product.pricingType !== "fixed" && (
                  <Badge type="primary">🏷 {({
                    negotiable: "Negotiable", starting: "Starting From",
                    per_hour: "Per Hour", per_day: "Per Day",
                    per_unit: "Per Unit", free: "Free",
                  })[product.pricingType] || product.pricingType}</Badge>
                )}
                {product.deliveryMethod && (
                  <Badge type="muted">
                    {product.deliveryMethod === "pickup"
                      ? "🤝 Pickup Only"
                      : product.deliveryMethod === "delivery"
                        ? "🚚 Delivery"
                        : "🚚 Delivery & Pickup"}
                  </Badge>
                )}
                {product.stock !== undefined && (
                  <Badge type={product.stock > 0 ? "success" : "danger"}>
                    {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
                  </Badge>
                )}
              </div>

              {/* SellerCard — safe fields only (phone/WhatsApp stripped at load) */}
              {seller && (
                <SellerCard
                  seller={seller}
                  sellerId={product.sellerId}
                  navigate={navigate}
                />
              )}

              {/* Reviews */}
              <div>
                <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, marginBottom: 16 }}>
                  Reviews ({reviews.length})
                </h3>
                {reviews.length === 0 ? (
                  <p style={{ color: "var(--text-muted)", fontSize: 14 }}>No reviews yet. Be the first after purchasing!</p>
                ) : reviews.map(r => (
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

            {/* RIGHT — Buy Box */}
            <div>
              <div className="card" style={{ position: "sticky", top: "calc(var(--nav-height) + 16px)" }}>
                <PriceTag amount={product.price} size="lg" />
                <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>
                  {({
                    per_hour:   "per hour",
                    per_day:    "per day",
                    per_unit:   "per unit",
                    starting:   "starting from",
                    free:       "Free — contact seller",
                    negotiable: "negotiable — make an offer",
                  })[product.pricingType] || "per unit"}
                </div>

                <hr style={{ margin: "16px 0", borderColor: "var(--border)" }} />

                {product.sellerId !== currentUser?.uid && (
                  <>
                    <div className="form-group">
                      <label className="form-label">Quantity</label>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <button onClick={() => setQty(Math.max(1, qty - 1))} style={{ width: 32, height: 32, borderRadius: 8, border: "1.5px solid var(--border)", background: "var(--surface)", cursor: "pointer", fontWeight: 700, fontFamily: "var(--font-body)" }}>-</button>
                        <span style={{ fontWeight: 700, fontSize: 16 }}>{qty}</span>
                        <button onClick={() => setQty(qty + 1)} style={{ width: 32, height: 32, borderRadius: 8, border: "1.5px solid var(--border)", background: "var(--surface)", cursor: "pointer", fontWeight: 700, fontFamily: "var(--font-body)" }}>+</button>
                      </div>
                    </div>

                    <div style={{ background: "var(--surface-2)", borderRadius: "var(--radius-sm)", padding: 14, marginBottom: 16 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 6 }}>
                        <span style={{ color: "var(--text-muted)" }}>Subtotal</span>
                        <span>GHS {total.toFixed(2)}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 6 }}>
                        <span style={{ color: "var(--text-muted)" }}>Escrow fee ({settings.escrowFee || 2}%)</span>
                        <span>GHS {escrowFeeAmt.toFixed(2)}</span>
                      </div>
                      <hr style={{ margin: "8px 0", borderColor: "var(--border)" }} />
                      <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700 }}>
                        <span>Total</span>
                        <span style={{ color: "var(--accent)" }}>GHS {grandTotal.toFixed(2)}</span>
                      </div>
                    </div>

                    {isLarge && (
                      <div style={{ fontSize: 12, color: "var(--text-muted)", background: "rgba(26,86,219,0.06)", border: "1px solid rgba(26,86,219,0.15)", borderRadius: "var(--radius-sm)", padding: "8px 12px", marginBottom: 12 }}>
                        ℹ Large purchase — admin verifies payment before confirming.
                      </div>
                    )}
                  </>
                )}

                {product.sellerId === currentUser?.uid ? (
                  <Alert type="info">This is your listing</Alert>
                ) : (
                  <Button variant="primary" full size="lg" disabled={product.stock === 0} onClick={openBuy}>
                    {product.stock === 0 ? "Out of Stock" : "🛒 Buy Now"}
                  </Button>
                )}

                <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 6, fontSize: 12, color: "var(--text-muted)" }}>
                  <div>🔒 Escrow Protection — pay only when satisfied</div>
                  <div>📱 Pay via MoMo or Wallet — no card needed</div>
                  <div>🛡 Buyer Protection Guaranteed</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── PAYMENT MODAL ── */}
      <Modal
        isOpen={showBuyModal}
        onClose={() => { if (payStep !== "momo" || expired) setShowBuyModal(false); }}
        title={
          payStep === "delivery"  ? "Delivery Details" :
          payStep === "choose"    ? "Choose Payment Method" :
          payStep === "momo"      ? "Complete MoMo Payment" :
          "Payment Submitted!"
        }
      >
        {/* Step 0 — Delivery */}
        {payStep === "delivery" && (
          <div>
            <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{product.title} × {qty}</div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 20, color: "var(--accent)", marginBottom: 18 }}>
              GHS {total.toFixed(2)} + delivery
            </div>

            <div className="form-group">
              <label className="form-label">How do you want to receive this item?</label>
              <div style={{ display: "flex", gap: 10 }}>
                {[
                  { key: "delivery", icon: "🚚", label: "Home Delivery",    sub: "Seller delivers to your location",    disabled: product.deliveryMethod === "pickup" },
                  { key: "meetup",   icon: "🤝", label: "Meet-up / Pickup", sub: "Meet the seller or collect in person", disabled: product.deliveryMethod === "delivery" },
                ].filter(o => !o.disabled).map(opt => (
                  <div key={opt.key} onClick={() => setDeliveryType(opt.key)} style={{
                    flex: 1, padding: "12px 14px",
                    border: `2px solid ${deliveryType === opt.key ? "var(--accent)" : "var(--border)"}`,
                    borderRadius: "var(--radius)", cursor: "pointer",
                    background: deliveryType === opt.key ? "var(--accent-glow)" : "var(--surface)",
                    transition: "all 0.15s",
                  }}>
                    <div style={{ fontSize: 24, marginBottom: 4 }}>{opt.icon}</div>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{opt.label}</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{opt.sub}</div>
                  </div>
                ))}
              </div>
            </div>

            {deliveryType === "delivery" ? (
              <>
                <div className="form-group">
                  <label className="form-label">Delivery Address *</label>
                  <input className="form-input" value={deliveryAddress} onChange={e => setDeliveryAddress(e.target.value)} placeholder="e.g. Adum, Kumasi" />
                  <span className="form-hint">Town and area where you want it delivered</span>
                </div>
                <div className="form-group">
                  <label className="form-label">Landmark</label>
                  <input className="form-input" value={deliveryLandmark} onChange={e => setDeliveryLandmark(e.target.value)} placeholder="e.g. Near Melcom, opposite Presby church" />
                </div>
                <div className="form-group">
                  <label className="form-label">Preferred Time</label>
                  <select className="form-select" value={preferredTime} onChange={e => setPreferredTime(e.target.value)}>
                    <option value="">Any time</option>
                    <option value="Morning (8am–12pm)">Morning (8am–12pm)</option>
                    <option value="Afternoon (12pm–5pm)">Afternoon (12pm–5pm)</option>
                    <option value="Evening (5pm–8pm)">Evening (5pm–8pm)</option>
                    <option value="Weekend only">Weekend only</option>
                  </select>
                </div>
                <div style={{ padding: "12px 14px", background: "var(--surface-2)", borderRadius: "var(--radius-sm)", marginBottom: 12, fontSize: 13 }}>
                  {[
                    ["Item subtotal",             `GHS ${total.toFixed(2)}`],
                    ["Delivery fee (estimated)",   `GHS ${deliveryFee.toFixed(2)}`],
                    [`Escrow fee (${settings.escrowFee || 2}%)`, `GHS ${escrowFeeAmt.toFixed(2)}`],
                  ].map(([k, v]) => (
                    <div key={k} style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ color: "var(--text-muted)" }}>{k}</span><span>{v}</span>
                    </div>
                  ))}
                  <hr style={{ margin: "6px 0", borderColor: "var(--border)" }} />
                  <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: 15 }}>
                    <span>Estimated Total</span>
                    <span style={{ color: "var(--accent)" }}>GHS {(total + deliveryFee + escrowFeeAmt).toFixed(2)}</span>
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>Final fee confirmed by seller after accepting</div>
                </div>
              </>
            ) : (
              <>
                <div className="form-group">
                  <label className="form-label">Meetup Location</label>
                  <input className="form-input" value={deliveryAddress} onChange={e => setDeliveryAddress(e.target.value)} placeholder="e.g. Kejetia, Kumasi" />
                </div>
                <div style={{ padding: "12px 14px", background: "rgba(5,150,105,0.07)", border: "1px solid rgba(5,150,105,0.2)", borderRadius: "var(--radius-sm)", marginBottom: 12, fontSize: 13, color: "#065f46" }}>
                  🤝 Meet-up has no delivery fee. Coordinate the meeting via chat after placing the order.
                </div>
              </>
            )}

            <div className="form-group">
              <label className="form-label">Note to Seller</label>
              <textarea className="form-textarea" rows={2} value={deliveryNote} onChange={e => setDeliveryNote(e.target.value)} placeholder="Any special instructions..." />
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <Button variant="secondary" full onClick={() => setShowBuyModal(false)}>Cancel</Button>
              <Button variant="primary" full onClick={() => {
                if (deliveryType === "delivery" && !deliveryAddress.trim()) return toast.error("Please enter your delivery address");
                setPayStep("choose");
              }}>Continue to Payment →</Button>
            </div>
          </div>
        )}

        {/* Step 1 — Choose method */}
        {payStep === "choose" && (
          <div>
            <div style={{ fontWeight: 600, marginBottom: 6, fontSize: 15 }}>{product.title} × {qty}</div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22, color: "var(--accent)", marginBottom: 20 }}>
              GHS {(total + deliveryFee + escrowFeeAmt).toFixed(2)}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
              {[
                { key: "momo",   icon: "📱", label: "Pay via MoMo",   sub: "MTN MoMo · Vodafone Cash · AirtelTigo" },
                { key: "wallet", icon: "💰", label: "Pay from Wallet", sub: "Use your ASVAN wallet balance — instant" },
              ].map(opt => (
                <div key={opt.key} onClick={() => setPayMethod(opt.key)} style={{
                  border: `2px solid ${payMethod === opt.key ? "var(--accent)" : "var(--border)"}`,
                  borderRadius: "var(--radius)", padding: "16px", cursor: "pointer",
                  background: payMethod === opt.key ? "var(--accent-glow)" : "var(--surface)",
                  transition: "all 0.15s",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ fontSize: 28 }}>{opt.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>{opt.label}</div>
                      <div style={{ fontSize: 13, color: "var(--text-muted)" }}>{opt.sub}</div>
                    </div>
                    {payMethod === opt.key && (
                      <div style={{ width: 20, height: 20, borderRadius: "50%", background: "var(--accent)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700 }}>✓</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {payMethod === "momo" && (
              <FormInput label="Your MoMo Phone Number" type="tel" value={senderPhone} onChange={e => setSenderPhone(e.target.value)} placeholder="e.g. 0244000000" hint="The number you will send from" />
            )}
            <Alert type="info">🔒 Payment is held in escrow and only released when you confirm delivery.</Alert>
            <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
              <Button variant="secondary" full onClick={() => setPayStep("delivery")}>← Back</Button>
              <Button variant="primary" full loading={processing} onClick={payMethod === "wallet" ? handleWalletPay : handleMomoProceed}>
                {payMethod === "wallet" ? "Pay from Wallet" : "Continue to MoMo →"}
              </Button>
            </div>
          </div>
        )}

        {/* Step 2 — MoMo */}
        {payStep === "momo" && !expired && (
          <div>
            <Countdown seconds={1800} onExpire={handleExpire} />
            <div style={{ background: "var(--primary)", borderRadius: "var(--radius)", padding: "20px", textAlign: "center", marginBottom: 20 }}>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", marginBottom: 6, fontWeight: 600, letterSpacing: "1px" }}>YOUR UNIQUE PAYMENT CODE</div>
              <div style={{ fontFamily: "monospace", fontSize: 28, fontWeight: 900, color: "#fff", letterSpacing: "4px" }}>{momoRef}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 6 }}>Use this exact code as your payment reference/narration</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
              {[
                { n: "1", icon: "📱", text: "Dial *170# or open your MoMo app" },
                { n: "2", icon: "💸", text: `Send GHS ${grandTotal.toFixed(2)} to 0549548274 (ASVAN)` },
                { n: "3", icon: "✏️", text: `Narration/reference: ${momoRef}`, highlight: true },
                { n: "4", icon: "📋", text: "Paste the transaction ID from your SMS below" },
              ].map(s => (
                <div key={s.n} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 14px", background: s.highlight ? "rgba(26,86,219,0.06)" : "var(--surface-2)", border: `1px solid ${s.highlight ? "rgba(26,86,219,0.2)" : "var(--border)"}`, borderRadius: "var(--radius-sm)" }}>
                  <div style={{ width: 24, height: 24, borderRadius: "50%", flexShrink: 0, background: "var(--accent)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700 }}>{s.n}</div>
                  <div style={{ fontSize: 14, lineHeight: 1.5 }}>{s.icon} {s.text}</div>
                </div>
              ))}
            </div>
            <FormInput label="Transaction ID from your MoMo SMS *" value={userRef} onChange={e => setUserRef(e.target.value)} placeholder="e.g. MP241015ABCDE" hint="In the confirmation SMS sent to your phone" />
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 16, lineHeight: 1.6, padding: "10px 12px", background: "var(--surface-2)", borderRadius: "var(--radius-sm)" }}>
              ⚠ Order is <strong>not confirmed</strong> until admin verifies. You will be notified by email once done.
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <Button variant="secondary" full onClick={() => setPayStep("choose")}>← Back</Button>
              <Button variant="primary" full loading={processing} onClick={handleMomoConfirm}>I Have Sent the Payment ✓</Button>
            </div>
          </div>
        )}

        {/* Expired */}
        {payStep === "momo" && expired && (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>⏰</div>
            <h3 style={{ fontFamily: "var(--font-display)", marginBottom: 10 }}>Payment Time Expired</h3>
            <p style={{ color: "var(--text-muted)", fontSize: 14, marginBottom: 20 }}>The 30-minute window passed. Please start a new order.</p>
            <Button variant="primary" onClick={() => { setShowBuyModal(false); setExpired(false); }}>Try Again</Button>
          </div>
        )}

        {/* Submitted */}
        {payStep === "submitted" && (
          <div style={{ textAlign: "center", padding: "10px 0" }}>
            <div style={{ fontSize: 52, marginBottom: 12 }}>✅</div>
            <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, marginBottom: 10 }}>Payment Submitted!</h3>
            <p style={{ color: "var(--text-secondary)", fontSize: 14, lineHeight: 1.7, marginBottom: 20 }}>
              Your payment of <strong>GHS {grandTotal.toFixed(2)}</strong> is being verified.<br />
              You'll receive an email and notification once confirmed.
            </p>
            <div style={{ background: "var(--surface-2)", borderRadius: "var(--radius-sm)", padding: "12px 16px", marginBottom: 20, fontSize: 13 }}>
              <div style={{ color: "var(--text-muted)", marginBottom: 4 }}>Your Reference Code</div>
              <div style={{ fontFamily: "monospace", fontWeight: 800, fontSize: 18, letterSpacing: "2px" }}>{momoRef}</div>
              <div style={{ color: "var(--text-muted)", fontSize: 12, marginTop: 4 }}>Keep this for your records</div>
            </div>
            <Button variant="primary" full onClick={() => { setShowBuyModal(false); navigate("/orders"); }}>View My Orders</Button>
          </div>
        )}
      </Modal>

      <ReportModal isOpen={showReport} onClose={() => setShowReport(false)} targetId={id} targetType="product" />

      {/* Guest prompt modal */}
      <Modal isOpen={showGuestPrompt} onClose={() => setShowGuestPrompt(false)} title="Create an Account to Buy">
        <div style={{ textAlign: "center", padding: "8px 0 16px" }}>
          <div style={{ fontSize: 52, marginBottom: 16 }}>🛒</div>
          <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, marginBottom: 10 }}>You need an account to purchase</h3>
          <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: 20 }}>
            Free to join. You get escrow-protected payments, buyer protection, order tracking, and direct seller messaging.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
            {["🔒 Escrow-protected payments","🛡 Buyer protection on every order","📦 Full order tracking","💬 Direct seller chat","💰 Wallet for fast checkout"].map(f => (
              <div key={f} style={{ fontSize: 13, color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: "var(--surface-2)", borderRadius: "var(--radius-sm)", textAlign: "left" }}>
                {f}
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <Button variant="primary" full onClick={() => { setShowGuestPrompt(false); navigate("/register"); }}>Create Free Account</Button>
            <Button variant="secondary" full onClick={() => { setShowGuestPrompt(false); navigate("/login"); }}>Sign In</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
