import { useState, useEffect, useRef } from "react";
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
  PriceTag, StatusBadge, ReportButton, VerifiedBadge, toast, FormInput
} from "../components/UI";
import { ReportModal } from "../components/ReportModal";
import ProductGallery from "../components/ProductGallery";
import { ShareProductButton } from "../components/ShareProduct";
import { SellerBadgeList } from "../components/SellerBadges";

// Generate a unique reference code for this payment
const generateRef = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let ref = "ASVAN-";
  for (let i = 0; i < 6; i++) ref += chars[Math.floor(Math.random() * chars.length)];
  return ref;
};

// Countdown timer component
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
      <div style={{
        fontFamily: "var(--font-display)", fontSize: 32, fontWeight: 800,
        color: urgent ? "var(--danger)" : "var(--text)", letterSpacing: "2px",
      }}>
        {m}:{s}
      </div>
      <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
        Order will auto-cancel if payment not confirmed by admin
      </div>
    </div>
  );
};

// ── SELLER DETAILS CARD ──────────────────────────────────────────────────────
// Shows all relevant seller info collected at registration so buyers can
// verify legitimacy and decide how to contact before proceeding to purchase.
const SellerDetailCard = ({ seller, sellerId, navigate, currentUser }) => {
  const [showPhone, setShowPhone] = useState(false);
  const [showWhatsApp, setShowWhatsApp] = useState(false);

  // Mask phone/WhatsApp until the buyer taps "Reveal" — reduces spam scraping
  const maskNumber = (num) => {
    if (!num) return null;
    const clean = num.replace(/\s/g, "");
    return clean.slice(0, 4) + "•••••" + clean.slice(-3);
  };

  const locationParts = [seller.address, seller.city, seller.region].filter(Boolean);
  const locationStr   = locationParts.join(", ") || seller.location || "Ghana";

  return (
    <div className="card" style={{ marginBottom: 24 }}>
      {/* ── Header ── */}
      <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>About the Seller</div>

      {/* ── Avatar + name row ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
        <div style={{
          width: 52, height: 52, borderRadius: "50%", flexShrink: 0,
          background: "var(--accent-glow)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontWeight: 800, color: "var(--accent)", fontSize: 22,
          border: "2px solid var(--accent)",
        }}>
          {seller.displayName?.[0]?.toUpperCase() || "S"}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            <span style={{ fontWeight: 700, fontSize: 15 }}>{seller.displayName}</span>
            {seller.isSellerVerified && <VerifiedBadge />}
            {seller.accountType === "seller" && (
              <span style={{
                fontSize: 10, fontWeight: 700, padding: "2px 7px",
                borderRadius: 20, background: "rgba(5,150,105,0.1)",
                color: "var(--success)", border: "1px solid rgba(5,150,105,0.25)",
              }}>SELLER</span>
            )}
          </div>
          <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>
            📍 {locationStr}
          </div>
          <div style={{ marginTop: 6 }}>
            <SellerBadgeList userDoc={seller} size="sm" />
          </div>
        </div>
      </div>

      {/* ── Info grid ── */}
      <div style={{
        display: "grid", gridTemplateColumns: "1fr 1fr",
        gap: 10, marginBottom: 16,
      }}>
        {/* Location details */}
        {seller.city && (
          <div style={infoTileStyle}>
            <div style={infoTileLabelStyle}>🏙 City / Town</div>
            <div style={infoTileValueStyle}>{seller.city}</div>
          </div>
        )}
        {seller.region && (
          <div style={infoTileStyle}>
            <div style={infoTileLabelStyle}>🗺 Region</div>
            <div style={infoTileValueStyle}>{seller.region}</div>
          </div>
        )}
        {seller.address && (
          <div style={{ ...infoTileStyle, gridColumn: "1 / -1" }}>
            <div style={infoTileLabelStyle}>📌 Area / Landmark</div>
            <div style={infoTileValueStyle}>{seller.address}</div>
          </div>
        )}
      </div>

      {/* ── Contact details — only visible to logged-in buyers ── */}
      {currentUser ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
          {/* Phone */}
          {seller.phone && (
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "10px 12px", background: "var(--surface-2)",
              borderRadius: "var(--radius-sm)", border: "1px solid var(--border)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 16 }}>📞</span>
                <div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600 }}>Phone</div>
                  <div style={{ fontSize: 14, fontWeight: 700, fontFamily: "monospace" }}>
                    {showPhone ? seller.phone : maskNumber(seller.phone)}
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button
                  onClick={() => setShowPhone(v => !v)}
                  style={revealBtnStyle}
                >
                  {showPhone ? "Hide" : "Reveal"}
                </button>
                {showPhone && (
                  <a href={`tel:${seller.phone}`} style={actionBtnStyle}>Call</a>
                )}
              </div>
            </div>
          )}

          {/* WhatsApp — sellers fill this in at registration */}
          {seller.whatsapp && (
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "10px 12px", background: "rgba(37,211,102,0.06)",
              borderRadius: "var(--radius-sm)", border: "1px solid rgba(37,211,102,0.2)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 16 }}>💬</span>
                <div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600 }}>WhatsApp</div>
                  <div style={{ fontSize: 14, fontWeight: 700, fontFamily: "monospace" }}>
                    {showWhatsApp ? seller.whatsapp : maskNumber(seller.whatsapp)}
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button
                  onClick={() => setShowWhatsApp(v => !v)}
                  style={revealBtnStyle}
                >
                  {showWhatsApp ? "Hide" : "Reveal"}
                </button>
                {showWhatsApp && (
                  <a
                    href={`https://wa.me/${seller.whatsapp.replace(/^0/, "233").replace(/\s/g, "")}`}
                    target="_blank" rel="noopener noreferrer"
                    style={{ ...actionBtnStyle, background: "#25D366", borderColor: "#25D366" }}
                  >
                    Chat
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Teaser for guests */
        <div style={{
          padding: "12px 14px", marginBottom: 16,
          background: "var(--surface-2)", borderRadius: "var(--radius-sm)",
          border: "1px solid var(--border)", fontSize: 13, color: "var(--text-muted)",
          textAlign: "center",
        }}>
          🔒 <strong>Sign in</strong> to view seller's phone &amp; WhatsApp
        </div>
      )}

      {/* ── Action buttons ── */}
      <div style={{ display: "flex", gap: 8 }}>
        <Button variant="secondary" size="sm" full onClick={() => navigate(`/store/${sellerId}`)}>
          🏪 View Store
        </Button>
        <Button variant="outline" size="sm" full onClick={() => navigate(`/chat?with=${sellerId}`)}>
          💬 Message
        </Button>
      </div>
    </div>
  );
};

// Shared micro-styles for the info tiles
const infoTileStyle = {
  padding: "10px 12px",
  background: "var(--surface-2)",
  borderRadius: "var(--radius-sm)",
  border: "1px solid var(--border)",
};
const infoTileLabelStyle = { fontSize: 11, color: "var(--text-muted)", fontWeight: 600, marginBottom: 2 };
const infoTileValueStyle = { fontSize: 13, fontWeight: 700, color: "var(--text)" };

const revealBtnStyle = {
  fontSize: 11, fontWeight: 700, padding: "4px 10px",
  borderRadius: 6, cursor: "pointer",
  background: "var(--surface)", border: "1px solid var(--border)",
  color: "var(--accent)", fontFamily: "var(--font-body)",
};
const actionBtnStyle = {
  fontSize: 11, fontWeight: 700, padding: "4px 10px",
  borderRadius: 6, cursor: "pointer", textDecoration: "none",
  background: "var(--accent)", border: "1px solid var(--accent)",
  color: "#fff", fontFamily: "var(--font-body)",
};
// ── END SELLER DETAILS CARD ──────────────────────────────────────────────────


export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser, userDoc } = useAuth();
  const [product,      setProduct]      = useState(null);
  const [reviews,      setReviews]      = useState([]);
  const [seller,       setSeller]       = useState(null);
  const [settings,     setSettings]     = useState({});
  const [loading,      setLoading]      = useState(true);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [showReport,   setShowReport]   = useState(false);
  const [showGuestPrompt, setShowGuestPrompt] = useState(false);
  const [qty,          setQty]          = useState(1);

  // Payment flow state
  const [payStep,      setPayStep]      = useState("delivery");
  const [payMethod,    setPayMethod]    = useState("momo");
  const [processing,   setProcessing]   = useState(false);
  const [momoRef,      setMomoRef]      = useState("");
  const [userRef,      setUserRef]      = useState("");
  const [senderPhone,  setSenderPhone]  = useState("");
  const [expired,      setExpired]      = useState(false);

  // Delivery details
  const [deliveryType,     setDeliveryType]     = useState("delivery");
  const [deliveryAddress,  setDeliveryAddress]  = useState(userDoc?.location || "");
  const [deliveryLandmark, setDeliveryLandmark] = useState(userDoc?.deliveryLandmark || "");
  const [preferredTime,    setPreferredTime]     = useState("");
  const [deliveryNote,     setDeliveryNote]      = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const [p, r, s] = await Promise.all([
          getProductById(id),
          getReviewsForTarget(id),
          getPlatformSettings(),
        ]);
        if (!p) { navigate("/products"); return; }
        setProduct(p); setReviews(r); setSettings(s);
        await updateProduct(id, { views: (p.views || 0) + 1 });
        if (p.sellerId) setSeller(await getUserDoc(p.sellerId));
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    load();
  }, [id]);

  const total        = (product?.price || 0) * qty;
  const escrowFeeAmt = (total * (settings.escrowFee || 2)) / 100;
  const grandTotal   = total + escrowFeeAmt;
  const isLarge      = grandTotal >= 500;

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

  const deliveryFee = (() => {
    if (deliveryType === "meetup") return 0;
    if (product?.deliveryFee > 0) return product.deliveryFee;
    const sellerTown = (seller?.town || seller?.city || seller?.location || "").split(",")[0].toLowerCase().trim();
    const buyerTown  = (deliveryAddress || userDoc?.town || "").split(",")[0].toLowerCase().trim();
    if (!sellerTown || !buyerTown) return 10;
    return sellerTown === buyerTown ? 5 : 20;
  })();

  const deliveryData = {
    deliveryType,
    deliveryAddress: deliveryAddress.trim(),
    deliveryLandmark: deliveryLandmark.trim(),
    preferredTime,
    deliveryNote: deliveryNote.trim(),
    deliveryFee,
    buyerPhone: userDoc?.phone || "",
    buyerTown:  userDoc?.town  || "",
  };

  const handleWalletPay = async () => {
    setProcessing(true);
    const finalTotal = total + deliveryFee + escrowFeeAmt;
    try {
      const wallet = await getWallet(currentUser.uid);
      if (wallet.balance < finalTotal) {
        toast.error(`Insufficient balance. You need GHS ${finalTotal.toFixed(2)}. Top up via MoMo first.`);
        setProcessing(false);
        return;
      }
      await debitWallet(currentUser.uid, finalTotal, `Purchase: ${product.title}`);
      const order = await createOrder({
        buyerId: currentUser.uid, buyerName: userDoc?.displayName,
        buyerPhone: userDoc?.phone || "",
        sellerId: product.sellerId, itemId: id, itemTitle: product.title,
        itemType: "product", quantity: qty, amount: total,
        commission: (total * (settings.commissionRate || 10)) / 100,
        escrowFee: escrowFeeAmt, grandTotal: finalTotal,
        status: "paid", paymentMethod: "wallet",
        ...deliveryData,
      });
      await createEscrow({
        orderId: order.id, buyerId: currentUser.uid, sellerId: product.sellerId,
        amount: total, commission: (total * (settings.commissionRate || 10)) / 100,
        escrowFee: escrowFeeAmt, status: "held", itemTitle: product.title,
      });
      await createNotification(product.sellerId, {
        title: "🛒 New Order Received!",
        body: `${userDoc?.displayName} ordered "${product.title}" — ${deliveryType === "meetup" ? "Meet-up" : `Delivery to: ${deliveryAddress}`}`,
        type: "order", link: `/orders/${order.id}`,
      });
      try { await sendOrderPlacedEmail(currentUser.email, userDoc?.displayName, order.id, total, product.title); } catch (e) {}
      setShowBuyModal(false);
      toast.success("Order placed! Payment held in escrow.");
      navigate(`/orders/${order.id}`);
    } catch (e) { toast.error(e.message || "Payment failed"); }
    setProcessing(false);
  };

  const handleMomoProceed = () => {
    if (!senderPhone.trim()) return toast.error("Please enter the phone number you will send from");
    setPayStep("momo");
  };

  const handleMomoConfirm = async () => {
    if (!userRef.trim()) return toast.error("Please enter the reference/transaction ID from your MoMo message");
    if (userRef.trim().length < 4) return toast.error("Reference too short — check your MoMo SMS");
    if (product.sellerId === currentUser.uid) return toast.error("You cannot purchase your own listing.");
    setProcessing(true);
    try {
      const order = await createOrder({
        buyerId: currentUser.uid, buyerName: userDoc?.displayName,
        sellerId: product.sellerId, itemId: id, itemTitle: product.title,
        itemType: "product", quantity: qty, amount: total,
        commission: (total * (settings.commissionRate || 10)) / 100,
        escrowFee: escrowFeeAmt, grandTotal,
        status: "awaiting_payment",
        paymentMethod: "momo_direct",
        momoReference: momoRef,
        userReference: userRef.trim(),
        senderPhone: senderPhone.trim(),
        paymentDeadline: new Date(Date.now() + 30 * 60 * 1000),
      });
      await submitMomoPayment({
        uid:           currentUser.uid,
        userName:      userDoc?.displayName,
        userEmail:     currentUser.email,
        amount:        grandTotal,
        reference:     momoRef,
        userReference: userRef.trim(),
        senderPhone:   senderPhone.trim(),
        adminMomo:     "0549548274",
        orderId:       order.id,
        sellerId:      product.sellerId,
        itemTitle:     product.title,
        type:          "checkout",
      });
      await createNotification("admin", {
        title: `⚡ Payment to Verify — GHS ${grandTotal.toFixed(2)}`,
        body: `${userDoc?.displayName} sent GHS ${grandTotal.toFixed(2)} for "${product.title}". Ref: ${momoRef}. Verify at /admin/momo`,
        type: "payment",
        link: "/admin/momo",
      });
      try { await sendMomoSubmittedEmail(currentUser.email, userDoc?.displayName, grandTotal, momoRef); } catch (e) {}
      try { await sendOrderPlacedEmail(currentUser.email, userDoc?.displayName, order.id, total, product.title); } catch (e) {}
      setPayStep("submitted");
    } catch (e) { toast.error(e.message || "Submission failed"); }
    setProcessing(false);
  };

  const handleExpire = async () => {
    setExpired(true);
    toast.error("Payment time expired. The order has been cancelled.");
  };

  if (loading) return <Spinner center />;
  if (!product) return null;

  const avgRating = reviews.length ? reviews.reduce((a, r) => a + r.rating, 0) / reviews.length : 0;

  return (
    <div className="page-wrapper">
      <div className="container" style={{ paddingTop: 28 }}>
        <button onClick={() => navigate(-1)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, color: "var(--text-muted)", fontSize: 14, marginBottom: 20 }}>
          ← Back
        </button>

        <div style={{ display: "grid", gridTemplateColumns: "1fr min(340px,100%)", gap: 28 }} className="detail-grid">
          {/* ── LEFT ── */}
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
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <ShareProductButton product={product} />
                <ReportButton onReport={() => setShowReport(true)} />
              </div>
            </div>

            <p style={{ color: "var(--text-secondary)", lineHeight: 1.8, margin: "20px 0" }}>{product.description}</p>

            {product.videoURL && (
              <a href={product.videoURL} target="_blank" rel="noopener noreferrer" style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "10px 20px", marginBottom: 20,
                background: "linear-gradient(135deg, #FF0000, #CC0000)",
                color: "#fff", borderRadius: "var(--radius-sm)",
                fontWeight: 700, fontSize: 14, textDecoration: "none",
                boxShadow: "0 4px 14px rgba(220,38,38,0.3)",
              }}>
                🎬 Watch Product Video
              </a>
            )}

            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 24 }}>
              {product.category  && <Badge type="muted">📁 {product.category}</Badge>}
              {product.condition && <Badge type="muted">📊 {product.condition}</Badge>}
              {product.location  && <Badge type="muted">📍 {product.location}</Badge>}
              {product.pricingType && product.pricingType !== "fixed" && (
                <Badge type="primary">🏷 {{
                  negotiable: "Negotiable", starting: "Starting From",
                  per_hour: "Per Hour", per_day: "Per Day",
                  per_unit: "Per Unit", free: "Free",
                }[product.pricingType] || product.pricingType}</Badge>
              )}
              {product.deliveryMethod && (
                <Badge type="muted">
                  {product.deliveryMethod === "pickup" ? "🤝 Pickup Only" :
                   product.deliveryMethod === "delivery" ? "🚚 Delivery" : "🚚 Delivery & Pickup"}
                </Badge>
              )}
              {product.stock !== undefined && (
                <Badge type={product.stock > 0 ? "success" : "danger"}>
                  {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
                </Badge>
              )}
            </div>

            {/* ── ENHANCED SELLER DETAILS CARD ── */}
            {seller && (
              <SellerDetailCard
                seller={seller}
                sellerId={product.sellerId}
                navigate={navigate}
                currentUser={currentUser}
              />
            )}

            {/* Reviews */}
            <div>
              <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, marginBottom: 16 }}>Reviews ({reviews.length})</h3>
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

          {/* ── RIGHT — Buy Box ── */}
          <div>
            <div className="card" style={{ position: "sticky", top: "calc(var(--nav-height) + 16px)" }}>
              <PriceTag amount={product.price} size="lg" />
              <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>
                {product.pricingType === "per_hour" ? "per hour" :
                 product.pricingType === "per_day"  ? "per day"  :
                 product.pricingType === "per_unit" ? "per unit" :
                 product.pricingType === "starting" ? "starting from" :
                 product.pricingType === "free"     ? "Free — contact seller" :
                 product.pricingType === "negotiable" ? "negotiable — make an offer" :
                 "per unit"}
              </div>
              {product.deliveryMethod && (
                <div style={{ marginTop: 8, display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, padding: "4px 10px", borderRadius: 20, background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-muted)" }}>
                  {product.deliveryMethod === "pickup"   ? "🤝 Pickup Only" :
                   product.deliveryMethod === "delivery" ? "🚚 Delivery Available" :
                   "🚚 Delivery & Pickup Available"}
                </div>
              )}

              <hr style={{ margin: "16px 0", borderColor: "var(--border)" }} />

              {currentUser && product.sellerId !== currentUser.uid && (
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
                      ℹ Large purchase — admin will verify payment before order is confirmed.
                    </div>
                  )}
                </>
              )}

              {product.sellerId === currentUser?.uid ? (
                <Alert type="info">This is your listing</Alert>
              ) : !currentUser ? (
                <div style={{ background: "linear-gradient(135deg, #0A0F1E, #1a2560)", borderRadius: "var(--radius-lg)", padding: "20px", textAlign: "center" }}>
                  <div style={{ fontSize: 36, marginBottom: 10 }}>🔐</div>
                  <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, color: "#fff", fontSize: 16, marginBottom: 8 }}>
                    Sign in to Purchase
                  </div>
                  <p style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", marginBottom: 16, lineHeight: 1.6 }}>
                    Create a free account to buy products, contact sellers, and enjoy full escrow protection.
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <button onClick={() => navigate("/register")} style={{ padding: "11px", background: "var(--accent)", color: "#fff", border: "none", borderRadius: "var(--radius-sm)", fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                      Create Free Account
                    </button>
                    <button onClick={() => navigate("/login")} style={{ padding: "11px", background: "transparent", color: "rgba(255,255,255,0.85)", border: "1px solid rgba(255,255,255,0.25)", borderRadius: "var(--radius-sm)", fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
                      Sign In
                    </button>
                  </div>
                </div>
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
      </div>

      {/* ── PAYMENT MODAL ── */}
      <Modal
        isOpen={showBuyModal}
        onClose={() => { if (payStep !== "momo" || expired) setShowBuyModal(false); }}
        title={
          payStep === "delivery" ? "Delivery Details"      :
          payStep === "choose"   ? "Choose Payment Method" :
          payStep === "momo"     ? "Complete MoMo Payment" :
          "Payment Submitted!"
        }
      >
        {/* ── STEP 0: Delivery details ── */}
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
                  { key: "delivery", icon: "🚚", label: "Home Delivery", sub: "Seller delivers to your location", disabled: product.deliveryMethod === "pickup" },
                  { key: "meetup",   icon: "🤝", label: "Meet-up / Pickup", sub: "Meet the seller or pick up in person", disabled: product.deliveryMethod === "delivery" },
                ].filter(opt => !opt.disabled).map(opt => (
                  <div key={opt.key} onClick={() => setDeliveryType(opt.key)} style={{
                    flex: 1, padding: "12px 14px", border: `2px solid ${deliveryType === opt.key ? "var(--accent)" : "var(--border)"}`,
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
                  <input className="form-input" value={deliveryAddress} onChange={e => setDeliveryAddress(e.target.value)} placeholder="e.g. Adum, Kumasi" required />
                  <span className="form-hint">Town and area where you want it delivered</span>
                </div>
                <div className="form-group">
                  <label className="form-label">Landmark / Description</label>
                  <input className="form-input" value={deliveryLandmark} onChange={e => setDeliveryLandmark(e.target.value)} placeholder="e.g. Near Melcom, opposite Presby church" />
                  <span className="form-hint">Helps the seller find your location easily</span>
                </div>
                <div className="form-group">
                  <label className="form-label">Preferred Delivery Time</label>
                  <select className="form-select" value={preferredTime} onChange={e => setPreferredTime(e.target.value)}>
                    <option value="">Any time</option>
                    <option value="Morning (8am–12pm)">Morning (8am–12pm)</option>
                    <option value="Afternoon (12pm–5pm)">Afternoon (12pm–5pm)</option>
                    <option value="Evening (5pm–8pm)">Evening (5pm–8pm)</option>
                    <option value="Weekend only">Weekend only</option>
                  </select>
                </div>
                <div style={{ padding: "12px 14px", background: "var(--surface-2)", borderRadius: "var(--radius-sm)", marginBottom: 12, fontSize: 13 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ color: "var(--text-muted)" }}>Item subtotal</span><span>GHS {total.toFixed(2)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ color: "var(--text-muted)" }}>Delivery fee (estimated)</span><span>GHS {deliveryFee.toFixed(2)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ color: "var(--text-muted)" }}>Escrow fee ({settings.escrowFee || 2}%)</span><span>GHS {escrowFeeAmt.toFixed(2)}</span>
                  </div>
                  <hr style={{ margin: "6px 0", borderColor: "var(--border)" }} />
                  <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: 15 }}>
                    <span>Estimated Total</span>
                    <span style={{ color: "var(--accent)" }}>GHS {(total + deliveryFee + escrowFeeAmt).toFixed(2)}</span>
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
                    Final delivery fee confirmed by seller after order accepted
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="form-group">
                  <label className="form-label">Meetup Location</label>
                  <input className="form-input" value={deliveryAddress} onChange={e => setDeliveryAddress(e.target.value)} placeholder="e.g. Kejetia, Kumasi or suggest a location" />
                </div>
                <div style={{ padding: "12px 14px", background: "rgba(5,150,105,0.07)", border: "1px solid rgba(5,150,105,0.2)", borderRadius: "var(--radius-sm)", marginBottom: 12, fontSize: 13, color: "#065f46" }}>
                  🤝 Meet-up has no delivery fee. You and the seller will coordinate the meeting location and time via chat after the order is placed.
                </div>
              </>
            )}

            <div className="form-group">
              <label className="form-label">Additional Note to Seller</label>
              <textarea className="form-textarea" rows={2} value={deliveryNote} onChange={e => setDeliveryNote(e.target.value)} placeholder="Any special instructions for the seller..." />
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <Button variant="secondary" full onClick={() => setShowBuyModal(false)}>Cancel</Button>
              <Button variant="primary" full onClick={() => {
                if (deliveryType === "delivery" && !deliveryAddress.trim()) return toast.error("Please enter your delivery address");
                setPayStep("choose");
              }}>
                Continue to Payment →
              </Button>
            </div>
          </div>
        )}

        {/* ── STEP 1: Choose method ── */}
        {payStep === "choose" && (
          <div>
            <div style={{ fontWeight: 600, marginBottom: 6, fontSize: 15 }}>{product.title} × {qty}</div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22, color: "var(--accent)", marginBottom: 20 }}>
              GHS {(total + deliveryFee + escrowFeeAmt).toFixed(2)}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
              {[
                { key: "momo", icon: "📱", label: "Pay via MoMo", sub: "MTN MoMo · Vodafone Cash · AirtelTigo — pay at checkout, no pre-loading" },
                { key: "wallet", icon: "💰", label: "Pay from Wallet", sub: "Use your ASVAN wallet balance — instant, no verification needed" },
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
                    {payMethod === opt.key && <div style={{ width: 20, height: 20, borderRadius: "50%", background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 12, fontWeight: 700 }}>✓</div>}
                  </div>
                </div>
              ))}
            </div>

            {payMethod === "momo" && (
              <FormInput
                label="Your MoMo Phone Number"
                type="tel"
                value={senderPhone}
                onChange={e => setSenderPhone(e.target.value)}
                placeholder="e.g. 0244000000"
                hint="The number you will send the payment from"
              />
            )}

            <Alert type="info">🔒 Payment is held in escrow and only released when you confirm delivery.</Alert>

            <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
              <Button variant="secondary" full onClick={() => setShowBuyModal(false)}>Cancel</Button>
              <Button variant="primary" full loading={processing} onClick={payMethod === "wallet" ? handleWalletPay : handleMomoProceed}>
                {payMethod === "wallet" ? "Pay from Wallet" : "Continue to MoMo →"}
              </Button>
            </div>
          </div>
        )}

        {/* ── STEP 2: MoMo instructions ── */}
        {payStep === "momo" && !expired && (
          <div>
            <Countdown seconds={1800} onExpire={handleExpire} />
            <div style={{ background: "var(--primary)", borderRadius: "var(--radius)", padding: "20px", textAlign: "center", marginBottom: 20 }}>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginBottom: 6, fontWeight: 600, letterSpacing: "1px" }}>YOUR UNIQUE PAYMENT CODE</div>
              <div style={{ fontFamily: "monospace", fontSize: 28, fontWeight: 900, color: "#fff", letterSpacing: "4px" }}>{momoRef}</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 6 }}>Use this exact code as your payment reference/narration</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
              {[
                { n: "1", text: `Dial *170# on your phone or open your MoMo app`, icon: "📱" },
                { n: "2", text: `Send GHS ${grandTotal.toFixed(2)} to 0549548274 (ASVAN)`, icon: "💸" },
                { n: "3", text: `In the narration/reference field, type: ${momoRef}`, icon: "✏️", highlight: true },
                { n: "4", text: `Copy the transaction ID from your confirmation SMS and paste below`, icon: "📋" },
              ].map(s => (
                <div key={s.n} style={{
                  display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 14px",
                  background: s.highlight ? "rgba(26,86,219,0.06)" : "var(--surface-2)",
                  border: `1px solid ${s.highlight ? "rgba(26,86,219,0.2)" : "var(--border)"}`,
                  borderRadius: "var(--radius-sm)",
                }}>
                  <div style={{ width: 24, height: 24, borderRadius: "50%", flexShrink: 0, background: "var(--accent)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700 }}>{s.n}</div>
                  <div style={{ fontSize: 14, lineHeight: 1.5 }}><span style={{ marginRight: 6 }}>{s.icon}</span>{s.text}</div>
                </div>
              ))}
            </div>
            <FormInput
              label="Transaction ID / Reference from your MoMo SMS *"
              value={userRef}
              onChange={e => setUserRef(e.target.value)}
              placeholder="e.g. MP241015ABCDE or 1234567890"
              hint="Found in the confirmation message sent to your phone after payment"
            />
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 16, lineHeight: 1.6, padding: "10px 12px", background: "var(--surface-2)", borderRadius: "var(--radius-sm)" }}>
              ⚠ <strong>Important:</strong> Your order is <strong>not confirmed</strong> until an admin verifies your payment. This usually happens within minutes. You will receive an email and notification once verified.
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <Button variant="secondary" full onClick={() => setPayStep("choose")}>← Back</Button>
              <Button variant="primary" full loading={processing} onClick={handleMomoConfirm}>
                I Have Sent the Payment ✓
              </Button>
            </div>
          </div>
        )}

        {/* ── STEP 2: Expired ── */}
        {payStep === "momo" && expired && (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>⏰</div>
            <h3 style={{ fontFamily: "var(--font-display)", marginBottom: 10 }}>Payment Time Expired</h3>
            <p style={{ color: "var(--text-muted)", fontSize: 14, marginBottom: 20 }}>The 30-minute window has passed. Please start a new order.</p>
            <Button variant="primary" onClick={() => { setShowBuyModal(false); setExpired(false); }}>Try Again</Button>
          </div>
        )}

        {/* ── STEP 3: Submitted ── */}
        {payStep === "submitted" && (
          <div style={{ textAlign: "center", padding: "10px 0" }}>
            <div style={{ fontSize: 52, marginBottom: 12 }}>✅</div>
            <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, marginBottom: 10 }}>Payment Submitted!</h3>
            <p style={{ color: "var(--text-secondary)", fontSize: 14, lineHeight: 1.7, marginBottom: 20 }}>
              Your payment of <strong>GHS {grandTotal.toFixed(2)}</strong> is being verified.<br />
              An admin will confirm within minutes.<br />
              You will receive an email and notification once your order is confirmed.
            </p>
            <div style={{ background: "var(--surface-2)", borderRadius: "var(--radius-sm)", padding: "12px 16px", marginBottom: 20, fontSize: 13 }}>
              <div style={{ color: "var(--text-muted)", marginBottom: 4 }}>Your Reference Code</div>
              <div style={{ fontFamily: "monospace", fontWeight: 800, fontSize: 18, letterSpacing: "2px" }}>{momoRef}</div>
              <div style={{ color: "var(--text-muted)", fontSize: 12, marginTop: 4 }}>Keep this code for your records</div>
            </div>
            <Button variant="primary" full onClick={() => { setShowBuyModal(false); navigate("/orders"); }}>
              View My Orders
            </Button>
          </div>
        )}
      </Modal>

      <ReportModal isOpen={showReport} onClose={() => setShowReport(false)} targetId={id} targetType="product" />

      {/* ── GUEST PROMPT MODAL ── */}
      <Modal isOpen={showGuestPrompt} onClose={() => setShowGuestPrompt(false)} title="Create an Account to Buy">
        <div style={{ textAlign: "center", padding: "8px 0 16px" }}>
          <div style={{ fontSize: 52, marginBottom: 16 }}>🛒</div>
          <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, marginBottom: 10 }}>You need an account to purchase</h3>
          <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: 24 }}>
            Creating an account is <strong>free</strong> and takes less than a minute. You'll get access to escrow-protected purchases, buyer protection, order tracking, and the ability to message sellers directly.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
            {[
              "🔒 Escrow-protected payments — your money is safe",
              "🛡 Buyer protection on every purchase",
              "📦 Full order tracking and history",
              "💬 Direct messaging with sellers",
              "💰 Wallet for fast repeat purchases",
            ].map(f => (
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
