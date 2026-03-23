import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  getUserOrders, getSellerOrders, getOrderById, updateOrder,
  updateEscrow, getEscrowByOrder, creditWallet, getPlatformSettings,
  createNotification, getUserDoc, createReview, listenToOrder
} from "../firebase/db";
import { sendOrderCompletedEmail } from "../services/emailService";
import { OrderCard } from "../components/ListingCard";
import { Spinner, Button, Badge, Alert, Modal, PageHeader, EmptyState, StatusBadge, PriceTag, StarRating, FormTextarea, toast, Tabs } from "../components/UI";

export function OrdersPage() {
  const { currentUser, isSeller } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("buying");

  useEffect(() => {
    if (!currentUser) return;
    const load = async () => {
      setLoading(true);
      try {
        let data = [];
        if (tab === "buying") data = await getUserOrders(currentUser.uid);
        else data = await getSellerOrders(currentUser.uid);
        setOrders(data);
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    load();
  }, [currentUser, tab]);

  const tabs = [
    { value: "buying", label: "My Purchases" },
    ...(isSeller ? [{ value: "selling", label: "My Sales" }] : [])
  ];

  return (
    <div className="page-wrapper">
      <div className="container" style={{ paddingTop: 28 }}>
        <PageHeader title="Orders" subtitle="Track and manage your orders" />
        {isSeller && <Tabs tabs={tabs} active={tab} onChange={setTab} />}
        {loading ? <Spinner center />
          : orders.length > 0
            ? <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {orders.map(o => <OrderCard key={o.id} order={o} />)}
              </div>
            : <EmptyState icon="📦" title="No orders yet" description={tab === "buying" ? "Browse products and services to make your first order" : "Your sales will appear here"} />
        }
      </div>
    </div>
  );
}

export function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser, userDoc } = useAuth();
  const [order, setOrder] = useState(null);
  const [escrow, setEscrow] = useState(null);
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [review, setReview] = useState({ rating: 5, comment: "" });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [buyer, setBuyer] = useState(null);
  const [seller, setSeller] = useState(null);

  useEffect(() => {
    if (!currentUser) return;
    const unsub = listenToOrder(id, async (o) => {
      if (!o) { navigate("/orders"); return; }
      setOrder(o);
      const [e, s, bu, se] = await Promise.all([
        getEscrowByOrder(id),
        getPlatformSettings(),
        getUserDoc(o.buyerId),
        getUserDoc(o.sellerId)
      ]);
      setEscrow(e); setSettings(s); setBuyer(bu); setSeller(se);
      setLoading(false);
    });
    return unsub;
  }, [id, currentUser]);

  const handleConfirmDelivery = async () => {
    setConfirming(true);
    try {
      const commission = (order.amount * (settings.commissionRate || 10)) / 100;
      const sellerAmount = order.amount - commission;
      await updateOrder(id, { status: "completed", completedAt: new Date() });
      if (escrow) await updateEscrow(escrow.id, { status: "released", releasedAt: new Date() });
      await creditWallet(order.sellerId, sellerAmount, `Payment for order #${id.slice(0, 8)}`);
      await createNotification(order.sellerId, {
        title: "Payment Released!",
        body: `GHS ${sellerAmount.toFixed(2)} has been added to your wallet`,
        type: "payment"
      });
      try {
        if (seller?.email) await sendOrderCompletedEmail(seller.email, seller.displayName, id);
      } catch (e) { }
      toast.success("Delivery confirmed! Payment released to seller.");
      setShowReview(true);
    } catch (e) { toast.error(e.message || "Error confirming delivery"); }
    setConfirming(false);
  };

  const handleCancel = async () => {
    if (!window.confirm("Are you sure you want to cancel this order?")) return;
    setCancelling(true);
    try {
      await updateOrder(id, { status: "cancelled" });
      if (escrow) await updateEscrow(escrow.id, { status: "refunded" });
      await creditWallet(currentUser.uid, order.grandTotal || order.amount, `Refund for cancelled order #${id.slice(0, 8)}`);
      toast.success("Order cancelled and refunded");
    } catch (e) { toast.error("Cancellation failed"); }
    setCancelling(false);
  };

  const handleReview = async () => {
    setSubmittingReview(true);
    try {
      await createReview({
        targetId: order.itemId, targetType: order.itemType,
        reviewerId: currentUser.uid, reviewerName: userDoc?.displayName,
        sellerId: order.sellerId, orderId: id,
        rating: review.rating, comment: review.comment
      });
      toast.success("Review submitted!");
      setShowReview(false);
    } catch (e) { toast.error("Failed to submit review"); }
    setSubmittingReview(false);
  };

  if (loading) return <Spinner center />;
  if (!order) return null;

  const isBuyer = currentUser?.uid === order.buyerId;
  const isSeller = currentUser?.uid === order.sellerId;

  return (
    <div className="page-wrapper">
      <div className="container" style={{ paddingTop: 28, maxWidth: 720 }}>
        <button onClick={() => navigate(-1)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, color: "var(--text-muted)", fontSize: 14, marginBottom: 20 }}>← Back</button>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
          <div>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 800 }}>Order #{id.slice(0, 8)}</h1>
            <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>
              {order.createdAt?.seconds ? new Date(order.createdAt.seconds * 1000).toLocaleDateString("en-GH", { dateStyle: "long" }) : "—"}
            </div>
          </div>
          <StatusBadge status={order.status} />
        </div>

        {/* Order Card */}
        <div className="card" style={{ marginBottom: 20 }}>
          <h3 style={{ fontWeight: 700, marginBottom: 16 }}>Order Details</h3>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, fontSize: 15 }}>
            <span style={{ color: "var(--text-secondary)" }}>Item</span>
            <span style={{ fontWeight: 600 }}>{order.itemTitle}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, fontSize: 15 }}>
            <span style={{ color: "var(--text-secondary)" }}>Type</span>
            <Badge type="muted">{order.itemType}</Badge>
          </div>
          {order.quantity > 1 && (
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, fontSize: 15 }}>
              <span style={{ color: "var(--text-secondary)" }}>Quantity</span>
              <span style={{ fontWeight: 600 }}>× {order.quantity}</span>
            </div>
          )}
          <hr style={{ margin: "12px 0", borderColor: "var(--border)" }} />
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 14, color: "var(--text-muted)" }}>
            <span>Subtotal</span><span>GHS {order.amount?.toFixed(2)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 14, color: "var(--text-muted)" }}>
            <span>Platform Commission ({settings.commissionRate || 10}%)</span>
            <span>GHS {order.commission?.toFixed(2)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 14, color: "var(--text-muted)" }}>
            <span>Escrow Fee</span><span>GHS {order.escrowFee?.toFixed(2)}</span>
          </div>
          <hr style={{ margin: "8px 0", borderColor: "var(--border)" }} />
          <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: 16 }}>
            <span>Total Paid</span><PriceTag amount={order.grandTotal || order.amount} size="sm" />
          </div>
        </div>

        {/* Escrow */}
        {escrow && (
          <div className="card" style={{ marginBottom: 20 }}>
            <h3 style={{ fontWeight: 700, marginBottom: 12 }}>🔒 Escrow Status</h3>
            <StatusBadge status={escrow.status} />
            <p style={{ fontSize: 14, color: "var(--text-secondary)", marginTop: 10 }}>
              {escrow.status === "held" ? "Funds are held in escrow and will be released when you confirm delivery." : escrow.status === "released" ? "Funds have been released to the seller." : "Funds have been refunded to the buyer."}
            </p>
          </div>
        )}

        {/* Parties */}
        <div className="card" style={{ marginBottom: 20 }}>
          <h3 style={{ fontWeight: 700, marginBottom: 16 }}>Order Parties</h3>
          <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
            {buyer && (
              <div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 6 }}>BUYER</div>
                <div style={{ fontWeight: 600 }}>{buyer.displayName}</div>
                <div style={{ fontSize: 13, color: "var(--text-muted)" }}>{buyer.email}</div>
              </div>
            )}
            {seller && (
              <div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 6 }}>SELLER</div>
                <div style={{ fontWeight: 600 }}>{seller.displayName}</div>
                <div style={{ fontSize: 13, color: "var(--text-muted)" }}>{seller.email}</div>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {isBuyer && order.status === "paid" && (
            <>
              <Button variant="success" loading={confirming} onClick={handleConfirmDelivery}>✓ Confirm Delivery</Button>
              <Button variant="danger" loading={cancelling} onClick={handleCancel}>✕ Cancel Order</Button>
            </>
          )}
          {isBuyer && order.status === "completed" && !order.reviewed && (
            <Button variant="outline" onClick={() => setShowReview(true)}>⭐ Leave Review</Button>
          )}
          <Button variant="secondary" onClick={() => navigate(`/chat?with=${isBuyer ? order.sellerId : order.buyerId}`)}>
            💬 Message {isBuyer ? "Seller" : "Buyer"}
          </Button>
        </div>

        {/* Buyer Protection Notice */}
        <div className="alert alert-info" style={{ marginTop: 20 }}>
          <span>🛡️</span>
          <div>
            <strong>Buyer Protection Active</strong>
            <p style={{ fontSize: 13, marginTop: 2 }}>Only confirm delivery after you've received and verified your order. Once confirmed, payment is released to the seller.</p>
          </div>
        </div>
      </div>

      {/* Review Modal */}
      <Modal isOpen={showReview} onClose={() => setShowReview(false)} title="Leave a Review"
        footer={<><Button variant="secondary" onClick={() => setShowReview(false)}>Skip</Button><Button variant="primary" loading={submittingReview} onClick={handleReview}>Submit Review</Button></>}
      >
        <p style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 16 }}>How was your experience with {order.itemTitle}?</p>
        <div className="form-group">
          <label className="form-label">Rating</label>
          <StarRating value={review.rating} onChange={r => setReview(p => ({ ...p, rating: r }))} />
        </div>
        <FormTextarea label="Comment" value={review.comment} onChange={e => setReview(p => ({ ...p, comment: e.target.value }))} placeholder="Share your experience..." />
      </Modal>
    </div>
  );
}
