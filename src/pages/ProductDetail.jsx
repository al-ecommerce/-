import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getProductById, getReviewsForTarget, createOrder, createEscrow, debitWallet, getWallet, getPlatformSettings, createNotification, logAdminAction, getUserDoc, updateProduct } from "../firebase/db";
import { sendOrderPlacedEmail } from "../services/emailService";
import { Spinner, Button, Badge, Alert, StarRating, Modal, PriceTag, StatusBadge, ReportButton, VerifiedBadge } from "../components/UI";
import { ReportModal } from "../components/ReportModal";
import { toast } from "../components/UI";

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser, userDoc } = useAuth();
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [seller, setSeller] = useState(null);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(false);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [settings, setSettings] = useState({});
  const [qty, setQty] = useState(1);

  useEffect(() => {
    const load = async () => {
      try {
        const [p, r, s] = await Promise.all([
          getProductById(id),
          getReviewsForTarget(id),
          getPlatformSettings()
        ]);
        if (!p) { navigate("/products"); return; }
        setProduct(p); setReviews(r); setSettings(s);
        await updateProduct(id, { views: (p.views || 0) + 1 });
        if (p.sellerId) {
          const sellerData = await getUserDoc(p.sellerId);
          setSeller(sellerData);
        }
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    load();
  }, [id]);

  const handleBuy = async () => {
    if (!currentUser) return navigate("/login");
    if (!currentUser.emailVerified) return toast.error("Please verify your email first");
    setBuying(true);
    try {
      const wallet = await getWallet(currentUser.uid);
      const total = product.price * qty;
      const commission = (total * (settings.commissionRate || 10)) / 100;
      const escrowFeeAmount = (total * (settings.escrowFee || 2)) / 100;
      const grandTotal = total + escrowFeeAmount;

      if (wallet.balance < grandTotal) {
        toast.error(`Insufficient wallet balance. You need GHS ${grandTotal.toFixed(2)}`);
        setBuying(false);
        return;
      }

      await debitWallet(currentUser.uid, grandTotal, `Purchase: ${product.title}`);
      const order = await createOrder({
        buyerId: currentUser.uid,
        buyerName: userDoc?.displayName,
        sellerId: product.sellerId,
        itemId: id,
        itemTitle: product.title,
        itemType: "product",
        quantity: qty,
        amount: total,
        commission,
        escrowFee: escrowFeeAmount,
        grandTotal,
        status: "paid",
        paymentMethod: "wallet"
      });

      await createEscrow({
        orderId: order.id,
        buyerId: currentUser.uid,
        sellerId: product.sellerId,
        amount: total,
        commission,
        escrowFee: escrowFeeAmount,
        status: "held"
      });

      await createNotification(product.sellerId, {
        title: "New Order",
        body: `${userDoc?.displayName} ordered ${product.title}`,
        type: "order",
        link: `/orders/${order.id}`
      });

      try {
        if (seller?.email) await sendOrderPlacedEmail(seller.email, seller.displayName, order.id, total);
      } catch (e) { }

      setShowBuyModal(false);
      toast.success("Order placed successfully!");
      navigate(`/orders/${order.id}`);
    } catch (e) {
      toast.error(e.message || "Order failed. Please try again.");
    }
    setBuying(false);
  };

  if (loading) return <Spinner center />;
  if (!product) return null;

  const avgRating = reviews.length ? reviews.reduce((a, r) => a + r.rating, 0) / reviews.length : 0;
  const total = product.price * qty;
  const escrowFeeAmt = (total * (settings.escrowFee || 2)) / 100;

  return (
    <div className="page-wrapper">
      <div className="container" style={{ paddingTop: 28 }}>
        {/* Back */}
        <button onClick={() => navigate(-1)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, color: "var(--text-muted)", fontSize: 14, marginBottom: 20 }}>
          ← Back
        </button>

        <div style={{ display: "grid", gridTemplateColumns: "1fr min(340px, 100%)", gap: 28 }} className="detail-grid">
          {/* Left */}
          <div>
            {/* Image */}
            <div style={{
              width: "100%", height: 380, background: "var(--surface-3)",
              borderRadius: "var(--radius-xl)", overflow: "hidden", marginBottom: 24,
              border: "1px solid var(--border)"
            }}>
              {product.imageURL
                ? <img src={product.imageURL} alt={product.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 60 }}>📦</div>
              }
            </div>

            {/* Info */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <h1 style={{ fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 800 }}>{product.title}</h1>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
                  <StarRating value={avgRating} readonly />
                  <span style={{ fontSize: 14, color: "var(--text-muted)" }}>({reviews.length} reviews)</span>
                  {product.featured && <Badge type="warning">⭐ Featured</Badge>}
                </div>
              </div>
              <ReportButton onReport={() => setShowReport(true)} />
            </div>

            <p style={{ color: "var(--text-secondary)", lineHeight: 1.8, margin: "20px 0" }}>{product.description}</p>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 24 }}>
              {product.category && <Badge type="muted">📁 {product.category}</Badge>}
              {product.condition && <Badge type="muted">📊 {product.condition}</Badge>}
              {product.location && <Badge type="muted">📍 {product.location}</Badge>}
              {product.stock !== undefined && <Badge type={product.stock > 0 ? "success" : "danger"}>{product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}</Badge>}
            </div>

            {/* Seller Info */}
            {seller && (
              <div className="card" style={{ marginBottom: 24 }}>
                <div style={{ fontWeight: 700, marginBottom: 12 }}>About the Seller</div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: "50%", background: "var(--accent-glow)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "var(--accent)", fontSize: 18 }}>
                    {seller.displayName?.[0] || "S"}
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontWeight: 700 }}>{seller.displayName}</span>
                      {seller.isSellerVerified && <VerifiedBadge />}
                    </div>
                    <div style={{ fontSize: 13, color: "var(--text-muted)" }}>{seller.location || "Ghana"}</div>
                  </div>
                  <div style={{ display: "flex", gap: 8, marginLeft: "auto" }}>
                    <Button variant="secondary" size="sm" onClick={() => navigate(`/store/${product.sellerId}`)}>🏪 Store</Button>
                    <Button variant="outline" size="sm" onClick={() => navigate(`/chat?with=${product.sellerId}`)}>💬 Chat</Button>
                  </div>
                </div>
              </div>
            )}

            {/* Reviews */}
            <div>
              <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, marginBottom: 16 }}>Reviews ({reviews.length})</h3>
              {reviews.length === 0 ? (
                <p style={{ color: "var(--text-muted)", fontSize: 14 }}>No reviews yet. Be the first!</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {reviews.map(r => (
                    <div key={r.id} className="card" style={{ padding: 16 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                        <span style={{ fontWeight: 600 }}>{r.reviewerName || "User"}</span>
                        <StarRating value={r.rating} readonly />
                      </div>
                      <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>{r.comment}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right - Buy Box */}
          <div>
            <div className="card" style={{ position: "sticky", top: "calc(var(--nav-height) + 16px)" }}>
              <PriceTag amount={product.price} size="lg" />
              <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>per unit</div>

              <hr style={{ margin: "16px 0", borderColor: "var(--border)" }} />

              <div className="form-group">
                <label className="form-label">Quantity</label>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <button onClick={() => setQty(Math.max(1, qty - 1))} style={{ width: 32, height: 32, borderRadius: 8, border: "1.5px solid var(--border)", background: "var(--surface)", cursor: "pointer", fontWeight: 700 }}>-</button>
                  <span style={{ fontWeight: 700, fontSize: 16 }}>{qty}</span>
                  <button onClick={() => setQty(qty + 1)} style={{ width: 32, height: 32, borderRadius: 8, border: "1.5px solid var(--border)", background: "var(--surface)", cursor: "pointer", fontWeight: 700 }}>+</button>
                </div>
              </div>

              <div style={{ background: "var(--surface-3)", borderRadius: "var(--radius-sm)", padding: 14, marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 6 }}>
                  <span>Subtotal</span><span>GHS {total.toFixed(2)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 6, color: "var(--text-muted)" }}>
                  <span>Escrow fee ({settings.escrowFee || 2}%)</span><span>GHS {escrowFeeAmt.toFixed(2)}</span>
                </div>
                <hr style={{ margin: "8px 0", borderColor: "var(--border)" }} />
                <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700 }}>
                  <span>Total</span><span>GHS {(total + escrowFeeAmt).toFixed(2)}</span>
                </div>
              </div>

              {product.sellerId === currentUser?.uid
                ? <Alert type="info">This is your listing</Alert>
                : <Button variant="primary" full size="lg" onClick={() => currentUser ? setShowBuyModal(true) : navigate("/login")}
                    disabled={product.stock === 0}>
                    {product.stock === 0 ? "Out of Stock" : "🛒 Buy Now (Escrow)"}
                  </Button>
              }

              <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
                <button onClick={() => navigate(`/chat?with=${product.sellerId}`)}
                  style={{ padding: "10px", border: "1.5px solid var(--border)", borderRadius: "var(--radius-sm)", background: "none", cursor: "pointer", fontSize: 14, fontWeight: 600 }}>
                  💬 Message Seller
                </button>
              </div>

              <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 6, fontSize: 13, color: "var(--text-muted)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>🔒 Secure Escrow Protection</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>✓ Buyer Protection Guaranteed</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>⚡ Fast Order Processing</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Buy Modal */}
      <Modal isOpen={showBuyModal} onClose={() => setShowBuyModal(false)} title="Confirm Purchase"
        footer={<>
          <Button variant="secondary" onClick={() => setShowBuyModal(false)}>Cancel</Button>
          <Button variant="primary" loading={buying} onClick={handleBuy}>Confirm & Pay</Button>
        </>}
      >
        <div>
          <Alert type="info">Payment is held in escrow until you confirm delivery.</Alert>
          <div style={{ background: "var(--surface-3)", borderRadius: "var(--radius-sm)", padding: 16, marginTop: 12 }}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>{product.title} × {qty}</div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 4 }}>
              <span>Subtotal</span><span>GHS {total.toFixed(2)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 4, color: "var(--text-muted)" }}>
              <span>Escrow fee</span><span>GHS {escrowFeeAmt.toFixed(2)}</span>
            </div>
            <hr style={{ margin: "8px 0", borderColor: "var(--border)" }} />
            <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700 }}>
              <span>Total Deducted</span><span>GHS {(total + escrowFeeAmt).toFixed(2)}</span>
            </div>
          </div>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 12 }}>
            Amount will be deducted from your wallet and held in escrow. Released to seller after you confirm receipt.
          </p>
        </div>
      </Modal>

      <ReportModal isOpen={showReport} onClose={() => setShowReport(false)} targetId={id} targetType="product" />
    </div>
  );
}
