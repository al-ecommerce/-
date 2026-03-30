import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  getUserOrders, getSellerOrders, getOrderById, updateOrder,
  updateEscrow, getEscrowByOrder, creditWallet, getPlatformSettings,
  createNotification, getUserDoc, createReview, listenToOrder,
  setDeliveryDeadline, processAutoReleases
} from "../firebase/db";
import { sendOrderCompletedEmail, sendAnnouncementEmail } from "../services/emailService";
import { Spinner, Button, Badge, Alert, Modal, PageHeader, EmptyState, StatusBadge, PriceTag, StarRating, FormTextarea, toast, Tabs } from "../components/UI";

// ─── STATUS CONFIG ────────────────────────────────────────
const STATUS = {
  awaiting_payment: { label: "Awaiting Payment",  color: "#D97706", icon: "⏳", bg: "rgba(217,119,6,0.08)"  },
  paid:             { label: "Paid — Processing",  color: "#2563EB", icon: "💳", bg: "rgba(37,99,235,0.08)"  },
  accepted:         { label: "Accepted",           color: "#059669", icon: "✅", bg: "rgba(5,150,105,0.08)"  },
  shipped:          { label: "Shipped / In Progress", color: "#7C3AED", icon: "🚚", bg: "rgba(124,58,237,0.08)" },
  completed:        { label: "Completed",          color: "#059669", icon: "🎉", bg: "rgba(5,150,105,0.08)"  },
  cancelled:        { label: "Cancelled",          color: "#DC2626", icon: "✕",  bg: "rgba(220,38,38,0.08)"  },
  disputed:         { label: "Disputed",           color: "#DC2626", icon: "⚠",  bg: "rgba(220,38,38,0.08)"  },
  refunded:         { label: "Refunded",           color: "#6B7280", icon: "↩",  bg: "rgba(107,114,128,0.08)" },
};

const StatusPill = ({ status }) => {
  const s = STATUS[status] || { label: status, color: "var(--text-muted)", icon: "•", bg: "var(--surface-3)" };
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700,
      background: s.bg, color: s.color,
    }}>
      {s.icon} {s.label}
    </span>
  );
};

// ─── STEP PROGRESS BAR ────────────────────────────────────
const ORDER_STEPS = [
  { key: ["awaiting_payment"],        label: "Payment Sent",    icon: "📱" },
  { key: ["paid"],                    label: "Payment Verified",icon: "💳" },
  { key: ["accepted"],                label: "Order Accepted",  icon: "✅" },
  { key: ["shipped"],                 label: "Delivered",       icon: "🚚" },
  { key: ["completed"],               label: "Completed",       icon: "🎉" },
];
const OrderProgress = ({ status }) => {
  const stepIdx = ORDER_STEPS.findIndex(s => s.key.includes(status));
  const done    = status === "completed";
  const cancelled = status === "cancelled" || status === "refunded" || status === "disputed";
  if (cancelled) return (
    <div style={{ textAlign: "center", padding: "14px 0", color: "var(--danger)", fontWeight: 600, fontSize: 14 }}>
      {STATUS[status]?.icon} {STATUS[status]?.label}
    </div>
  );
  return (
    <div style={{ display: "flex", gap: 0, margin: "20px 0", position: "relative" }}>
      <div style={{
        position: "absolute", top: 18, left: "10%", right: "10%", height: 2,
        background: "var(--border)", zIndex: 0,
      }} />
      <div style={{
        position: "absolute", top: 18, left: "10%", height: 2, zIndex: 1,
        width: `${(stepIdx / (ORDER_STEPS.length - 1)) * 80}%`,
        background: "var(--accent)", transition: "width 0.5s",
      }} />
      {ORDER_STEPS.map((step, i) => {
        const isDone   = i < stepIdx || done;
        const isActive = i === stepIdx && !done;
        return (
          <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", position: "relative", zIndex: 2 }}>
            <div style={{
              width: 36, height: 36, borderRadius: "50%", marginBottom: 8,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: isDone ? 14 : 16,
              background: isDone ? "var(--accent)" : isActive ? "var(--accent-glow)" : "var(--surface-3)",
              border: `2px solid ${isDone || isActive ? "var(--accent)" : "var(--border)"}`,
              color: isDone ? "#fff" : "inherit",
              transition: "all 0.3s",
            }}>
              {isDone ? "✓" : step.icon}
            </div>
            <div style={{ fontSize: 11, fontWeight: isActive || isDone ? 700 : 400, textAlign: "center", color: isDone || isActive ? "var(--text)" : "var(--text-muted)" }}>
              {step.label}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ─── ORDERS LIST PAGE ─────────────────────────────────────
export function OrdersPage() {
  const { currentUser, isSeller } = useAuth();
  const navigate = useNavigate();
  const [orders,  setOrders]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab,     setTab]     = useState("buying");

  useEffect(() => {
    if (!currentUser) return;
    setLoading(true);
    const load = async () => {
      try {
        const data = tab === "buying"
          ? await getUserOrders(currentUser.uid)
          : await getSellerOrders(currentUser.uid);
        setOrders(data);
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    load();
  }, [currentUser, tab]);

  const tabs = [
    { value: "buying",  label: `My Purchases` },
    ...(isSeller ? [{ value: "selling", label: "My Sales" }] : []),
  ];

  const needsAction = orders.filter(o =>
    (tab === "selling" && (o.status === "paid" || o.status === "shipped")) ||
    (tab === "buying"  && o.status === "awaiting_payment")
  ).length;

  return (
    <div className="page-wrapper">
      <div className="container" style={{ paddingTop: 28 }}>
        <PageHeader
          title="Orders"
          subtitle={needsAction > 0 ? `${needsAction} order${needsAction > 1 ? "s" : ""} need your attention` : "Manage your purchases and sales"}
        />

        {isSeller && <Tabs tabs={tabs} active={tab} onChange={setTab} />}

        {/* Needs-action banner */}
        {needsAction > 0 && (
          <div className="alert alert-warning" style={{ marginBottom: 20 }}>
            <span>⚡</span>
            <span>
              {tab === "selling"
                ? `You have ${needsAction} order${needsAction > 1 ? "s" : ""} waiting for you to accept or confirm delivery.`
                : `You have ${needsAction} order${needsAction > 1 ? "s" : ""} pending payment verification.`
              }
            </span>
          </div>
        )}

        {loading ? <Spinner center /> : orders.length === 0 ? (
          <EmptyState
            icon="📦"
            title={tab === "buying" ? "No purchases yet" : "No sales yet"}
            description={tab === "buying" ? "Browse products and services to place your first order" : "When buyers purchase your products, they'll appear here"}
            action={tab === "buying" ? <Button variant="primary" onClick={() => navigate("/products")}>Browse Products</Button> : null}
          />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {orders.map(o => (
              <OrderListCard
                key={o.id}
                order={o}
                role={tab === "buying" ? "buyer" : "seller"}
                onClick={() => navigate(`/orders/${o.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── ORDER CARD (in list) ─────────────────────────────────
const OrderListCard = ({ order, role, onClick }) => {
  const s         = STATUS[order.status] || {};
  const needsAction =
    (role === "seller" && (order.status === "paid" || order.status === "shipped")) ||
    (role === "buyer"  && order.status === "awaiting_payment");

  return (
    <div
      onClick={onClick}
      style={{
        background: "var(--surface)", border: `1.5px solid ${needsAction ? "var(--warning)" : "var(--border)"}`,
        borderRadius: "var(--radius-lg)", padding: 0, cursor: "pointer",
        overflow: "hidden", transition: "box-shadow 0.2s",
      }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = "var(--shadow)"; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; }}
    >
      {/* Attention strip */}
      {needsAction && (
        <div style={{
          padding: "6px 16px", background: "rgba(217,119,6,0.12)",
          borderBottom: "1px solid rgba(217,119,6,0.2)",
          fontSize: 12, fontWeight: 700, color: "#D97706",
          display: "flex", alignItems: "center", gap: 6,
        }}>
          ⚡ {role === "seller" ? "Action needed — click to view and proceed" : "Waiting for payment verification"}
        </div>
      )}

      <div style={{ padding: "16px 18px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }} className="truncate">
              {order.itemTitle || "Order"}
            </div>
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
              #{order.id?.slice(0, 8)?.toUpperCase()}
              {" · "}
              {order.createdAt?.seconds
                ? new Date(order.createdAt.seconds * 1000).toLocaleDateString("en-GH", { dateStyle: "medium" })
                : "—"
              }
            </div>
          </div>
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <StatusPill status={order.status} />
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 17, color: "var(--accent)", marginTop: 6 }}>
              GHS {(order.grandTotal || order.amount || 0).toFixed(2)}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
          <Badge type="muted">{order.itemType || "product"}</Badge>
          {order.quantity > 1 && <Badge type="muted">× {order.quantity}</Badge>}
          <Badge type={role === "buyer" ? "primary" : "success"}>
            {role === "buyer" ? "👤 You bought" : "🏪 You sold"}
          </Badge>
          {order.paymentMethod === "momo_direct" && <Badge type="muted">📱 MoMo</Badge>}
          {order.paymentMethod === "wallet" && <Badge type="muted">💰 Wallet</Badge>}
        </div>
      </div>
    </div>
  );
};

// ─── ORDER DETAIL PAGE ────────────────────────────────────
export function OrderDetail() {
  const { id }      = useParams();
  const navigate    = useNavigate();
  const { currentUser, userDoc } = useAuth();
  const [order,     setOrder]     = useState(null);
  const [escrow,    setEscrow]    = useState(null);
  const [settings,  setSettings]  = useState({});
  const [loading,   setLoading]   = useState(true);
  const [acting,    setActing]     = useState("");   // which action is loading
  const [showReview,setShowReview] = useState(false);
  const [review,    setReview]     = useState({ rating: 5, comment: "" });
  const [buyer,     setBuyer]      = useState(null);
  const [seller,    setSeller]     = useState(null);

  useEffect(() => {
    if (!currentUser) { navigate("/login"); return; }
    if (!id) { navigate("/orders"); return; }

    let unsubscribed = false;

    const loadSupporting = async (o) => {
      if (unsubscribed) return;
      try {
        const [e, s, bu, se] = await Promise.all([
          getEscrowByOrder(id),
          getPlatformSettings(),
          getUserDoc(o.buyerId),
          getUserDoc(o.sellerId),
        ]);
        if (!unsubscribed) {
          setEscrow(e); setSettings(s); setBuyer(bu); setSeller(se);
          setLoading(false);
        }
      } catch (e) {
        console.error("Error loading order supporting data:", e.message);
        if (!unsubscribed) setLoading(false);
      }
    };

    // Try real-time listener first
    const unsub = listenToOrder(id, async o => {
      if (unsubscribed) return;
      if (!o) {
        // Listener returned null — either doc doesn't exist or permission denied
        // Try a one-time fetch as fallback
        try {
          const fetched = await getOrderById(id);
          if (!fetched) { navigate("/orders"); return; }
          setOrder(fetched);
          await loadSupporting(fetched);
        } catch (e) {
          console.error("Fallback fetch failed:", e.message);
          navigate("/orders");
        }
        return;
      }
      setOrder(o);
      await loadSupporting(o);
    });

    return () => { unsubscribed = true; unsub(); };
  }, [id, currentUser]);

  if (loading) return <Spinner center />;
  if (!order)  return null;

  const isBuyer  = currentUser?.uid === order.buyerId;
  const isSellerUser = currentUser?.uid === order.sellerId;

  // ── Seller actions ──────────────────────────────────────
  const handleAccept = async () => {
    setActing("accept");
    try {
      await updateOrder(id, { status: "accepted", acceptedAt: new Date() });
      await createNotification(order.buyerId, {
        title: "✅ Order Accepted!",
        body:  `${seller?.displayName || "The seller"} accepted your order for "${order.itemTitle}". They will deliver soon.`,
        type:  "order", link: `/orders/${id}`,
      });
      toast.success("Order accepted! The buyer has been notified.");
    } catch (e) { toast.error(e.message); }
    setActing("");
  };

  const handleMarkDelivered = async () => {
    setActing("deliver");
    try {
      // Set 7-day auto-release deadline
      await setDeliveryDeadline(id, 7);
      // Notify buyer with clear instructions
      await createNotification(order.buyerId, {
        title: "📦 Your order has been delivered!",
        body:  `"${order.itemTitle}" has been marked as delivered by the seller. Please open the order and click "Confirm Delivery" to release payment. If you have not received it, do NOT confirm and raise a dispute instead.`,
        type:  "order", link: `/orders/${id}`,
      });
      // Email buyer
      try {
        await sendAnnouncementEmail(
          buyer?.email, buyer?.displayName,
          `Action Required: Confirm Delivery — "${order.itemTitle}"`,
          `Your order for "${order.itemTitle}" has been marked as delivered by the seller.\n\n` +
          `Please log in to ASVAN and go to your Orders to confirm receipt.\n\n` +
          `✅ If you received the item: Click "Confirm Delivery" to release payment to the seller.\n` +
          `⚠ If you did NOT receive it: Do NOT confirm. Click "Raise Dispute" instead.\n\n` +
          `If you do not respond within 7 days, payment will be automatically released to the seller.\n\n` +
          `Order: #${id.slice(0, 8).toUpperCase()}`
        );
      } catch (e) {}
      toast.success("Marked as delivered. Buyer notified by email and app notification.");
    } catch (e) { toast.error(e.message); }
    setActing("");
  };

  // Seller requests admin to release funds (if buyer is unresponsive)
  const handleRequestRelease = async () => {
    setActing("request_release");
    try {
      await updateOrder(id, { releaseRequested: true, releaseRequestedAt: new Date() });
      await createNotification(order.buyerId, {
        title: "⚠ Reminder: Please confirm your delivery",
        body:  `The seller has requested payment release for "${order.itemTitle}". Please confirm or dispute your order within 48 hours.`,
        type:  "alert", link: `/orders/${id}`,
      });
      // Notify admin
      await createNotification("admin", {
        title: "Seller Requested Payment Release",
        body:  `Seller requested release for order #${id.slice(0,8).toUpperCase()} — "${order.itemTitle}". Buyer may be unresponsive.`,
        type:  "alert", link: `/admin/orders`,
      });
      toast.success("Request sent. Buyer notified. Admin will review if buyer remains unresponsive after 48 hours.");
    } catch (e) { toast.error(e.message); }
    setActing("");
  };

  // ── Buyer actions ───────────────────────────────────────
  const handleConfirmDelivery = async () => {
    setActing("confirm");
    try {
      const commission   = escrow?.commission || (order.amount * (settings.commissionRate || 10)) / 100;
      const sellerAmount = order.amount - commission;

      await updateOrder(id, { status: "completed", completedAt: new Date(), reviewed: false });
      if (escrow) await updateEscrow(escrow.id, { status: "released", releasedAt: new Date() });
      await creditWallet(order.sellerId, sellerAmount, `Payment for Order #${id.slice(0, 8)}`);

      await createNotification(order.sellerId, {
        title: "💰 Payment Released!",
        body:  `GHS ${sellerAmount.toFixed(2)} has been added to your wallet for "${order.itemTitle}".`,
        type:  "payment", link: "/wallet",
      });

      if (seller?.email) {
        try { await sendOrderCompletedEmail(seller.email, seller.displayName, id, sellerAmount); } catch (e) {}
      }

      toast.success("Delivery confirmed! Payment released to seller.");
      setShowReview(true);
    } catch (e) { toast.error(e.message || "Error confirming delivery"); }
    setActing("");
  };

  const handleCancel = async () => {
    if (!window.confirm("Cancel this order? Your payment will be refunded to your wallet.")) return;
    setActing("cancel");
    try {
      await updateOrder(id, { status: "cancelled", cancelledAt: new Date() });
      if (escrow) await updateEscrow(escrow.id, { status: "refunded" });
      if (order.paymentMethod === "wallet") {
        await creditWallet(currentUser.uid, order.grandTotal || order.amount, `Refund for cancelled Order #${id.slice(0, 8)}`);
      }
      await createNotification(order.sellerId, {
        title: "Order Cancelled",
        body:  `The buyer cancelled their order for "${order.itemTitle}".`,
        type:  "alert",
      });
      toast.success("Order cancelled and refunded.");
    } catch (e) { toast.error("Cancellation failed"); }
    setActing("");
  };

  const handleReview = async () => {
    setActing("review");
    try {
      await createReview({
        targetId:     order.itemId,
        targetType:   order.itemType,
        reviewerId:   currentUser.uid,
        reviewerName: userDoc?.displayName,
        sellerId:     order.sellerId,
        orderId:      id,
        rating:       review.rating,
        comment:      review.comment,
      });
      await updateOrder(id, { reviewed: true });
      toast.success("Review submitted! Thank you.");
      setShowReview(false);
    } catch (e) { toast.error("Failed to submit review"); }
    setActing("");
  };

  const s   = STATUS[order.status] || {};
  const orderRef = id.slice(0, 8).toUpperCase();

  return (
    <div className="page-wrapper">
      <div className="container" style={{ paddingTop: 28, maxWidth: 740 }}>
        <button
          onClick={() => navigate("/orders")}
          style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, color: "var(--text-muted)", fontSize: 14, marginBottom: 20 }}
        >← Back to Orders</button>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
          <div>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 700, letterSpacing: "-0.2px" }}>
              Order #{orderRef}
            </h1>
            <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>
              {order.createdAt?.seconds
                ? new Date(order.createdAt.seconds * 1000).toLocaleDateString("en-GH", { dateStyle: "long" })
                : ""}
            </div>
          </div>
          <StatusPill status={order.status} />
        </div>

        {/* Progress tracker */}
        <div className="card" style={{ marginBottom: 20 }}>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>Order Progress</div>
          <OrderProgress status={order.status} />
        </div>

        {/* ── SELLER ACTION CARDS ──────────────────────── */}
        {isSellerUser && (
          <div style={{ marginBottom: 20 }}>
            {/* Paid — seller must accept */}
            {order.status === "paid" && (
              <div style={{
                border: "2px solid var(--accent)", borderRadius: "var(--radius-lg)",
                overflow: "hidden",
              }}>
                <div style={{
                  padding: "14px 18px", background: "var(--accent)",
                  color: "#fff", fontWeight: 700, fontSize: 15,
                  display: "flex", alignItems: "center", gap: 8,
                }}>
                  ⚡ New Order — Payment Verified
                </div>
                <div style={{ padding: "18px 18px 20px" }}>
                  <p style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 18, lineHeight: 1.7 }}>
                    A buyer has paid <strong>GHS {(order.grandTotal || order.amount)?.toFixed(2)}</strong> for <strong>"{order.itemTitle}"</strong>.
                    Payment is held securely in escrow. Accept this order to begin fulfilling it.
                  </p>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <Button variant="primary" loading={acting === "accept"} onClick={handleAccept}>
                      ✅ Accept Order
                    </Button>
                    <Button variant="secondary" onClick={() => navigate(`/chat?with=${order.buyerId}`)}>
                      💬 Message Buyer First
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Accepted — seller must deliver */}
            {order.status === "accepted" && (
              <div style={{
                border: "2px solid var(--success)", borderRadius: "var(--radius-lg)",
                overflow: "hidden",
              }}>
                <div style={{
                  padding: "14px 18px", background: "rgba(5,150,105,0.08)",
                  borderBottom: "1px solid rgba(5,150,105,0.2)",
                  fontWeight: 700, fontSize: 15, color: "var(--success)",
                  display: "flex", alignItems: "center", gap: 8,
                }}>
                  ✅ Order Accepted — Fulfil Now
                </div>
                <div style={{ padding: "18px 18px 20px" }}>
                  <p style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 18, lineHeight: 1.7 }}>
                    You accepted this order. Deliver the item or service to the buyer, then click
                    <strong> "Mark as Delivered"</strong>. The buyer will confirm receipt and release your payment.
                  </p>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <Button variant="success" loading={acting === "deliver"} onClick={handleMarkDelivered}>
                      🚚 Mark as Delivered
                    </Button>
                    <Button variant="secondary" onClick={() => navigate(`/chat?with=${order.buyerId}`)}>
                      💬 Chat with Buyer
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Shipped — waiting for buyer */}
            {order.status === "shipped" && (
              <div style={{ border: "1.5px solid rgba(124,58,237,0.3)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
                <div style={{ padding: "14px 18px", background: "rgba(124,58,237,0.08)", borderBottom: "1px solid rgba(124,58,237,0.15)", fontWeight: 700, fontSize: 14, color: "#7C3AED" }}>
                  🚚 Delivered — Awaiting Buyer Confirmation
                </div>
                <div style={{ padding: "16px 18px" }}>
                  {/* Auto-release deadline */}
                  {order.releaseDeadline && (() => {
                    const dl = order.releaseDeadline?.seconds
                      ? new Date(order.releaseDeadline.seconds * 1000)
                      : new Date(order.releaseDeadline);
                    const daysLeft = Math.max(0, Math.ceil((dl - Date.now()) / 86400000));
                    return (
                      <div style={{ padding: "10px 14px", background: daysLeft <= 1 ? "rgba(220,38,38,0.07)" : "rgba(26,86,219,0.07)", border: `1px solid ${daysLeft <= 1 ? "rgba(220,38,38,0.2)" : "rgba(26,86,219,0.15)"}`, borderRadius: "var(--radius-sm)", marginBottom: 14, fontSize: 13 }}>
                        {daysLeft > 0 ? (
                          <span style={{ color: daysLeft <= 1 ? "var(--danger)" : "var(--accent)" }}>
                            ⏱ Auto-release in <strong>{daysLeft} day{daysLeft !== 1 ? "s" : ""}</strong> if buyer does not respond
                          </span>
                        ) : (
                          <span style={{ color: "var(--success)", fontWeight: 700 }}>
                            ✓ Auto-release deadline reached — admin will process payment shortly
                          </span>
                        )}
                      </div>
                    );
                  })()}
                  <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 14, lineHeight: 1.6 }}>
                    The buyer has been notified by email and app notification to confirm receipt. Payment of <strong>GHS {(order.amount - (order.commission || 0)).toFixed(2)}</strong> will be released when they confirm — or automatically after 7 days.
                  </p>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <Button variant="secondary" size="sm" onClick={() => navigate(`/chat?with=${order.buyerId}`)}>
                      💬 Message Buyer
                    </Button>
                    {!order.releaseRequested && (
                      <Button
                        variant="outline"
                        size="sm"
                        loading={acting === "request_release"}
                        onClick={handleRequestRelease}
                      >
                        ⚡ Request Payment Release
                      </Button>
                    )}
                    {order.releaseRequested && (
                      <span style={{ fontSize: 12, color: "var(--text-muted)", padding: "6px 0", fontStyle: "italic" }}>
                        ✓ Release request sent — admin will review
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Completed */}
            {order.status === "completed" && (
              <div style={{
                border: "1.5px solid rgba(5,150,105,0.3)", borderRadius: "var(--radius-lg)",
                padding: "16px 18px", background: "rgba(5,150,105,0.06)",
              }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: "var(--success)", marginBottom: 4 }}>
                  🎉 Order completed — payment released to your wallet
                </div>
                <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
                  You received GHS {(order.amount - (order.commission || 0)).toFixed(2)}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── BUYER ACTION CARDS ───────────────────────── */}
        {isBuyer && (
          <div style={{ marginBottom: 20 }}>
            {order.status === "awaiting_payment" && (
              <div style={{
                border: "2px solid var(--warning)", borderRadius: "var(--radius-lg)",
                padding: "16px 18px", background: "rgba(217,119,6,0.06)",
              }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: "var(--warning)", marginBottom: 8 }}>
                  ⏳ Payment verification in progress
                </div>
                <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0, lineHeight: 1.6 }}>
                  Your MoMo payment is being verified by our admin. This usually takes just a few minutes. You will receive an email and notification once confirmed.
                </p>
                <div style={{ marginTop: 12, fontFamily: "monospace", fontWeight: 700, fontSize: 15, letterSpacing: "1px", color: "var(--text)" }}>
                  Ref: {order.momoReference || "—"}
                </div>
              </div>
            )}

            {(order.status === "paid" || order.status === "accepted") && (
              <div style={{
                border: "1.5px solid var(--border)", borderRadius: "var(--radius-lg)",
                padding: "16px 18px", background: "var(--surface-2)",
              }}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6 }}>
                  {order.status === "paid" ? "💳 Payment confirmed — seller is reviewing" : "✅ Seller accepted — delivery in progress"}
                </div>
                <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0, lineHeight: 1.6 }}>
                  Your payment is safely held in escrow. You will be notified when the seller marks it delivered.
                </p>
              </div>
            )}

            {order.status === "shipped" && (
              <div style={{ border: "2px solid var(--success)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
                <div style={{ padding: "14px 18px", background: "var(--success)", color: "#fff", fontWeight: 700, fontSize: 15, display: "flex", alignItems: "center", gap: 8 }}>
                  📦 Action Required — Confirm Your Delivery
                </div>
                <div style={{ padding: "18px 18px 20px" }}>
                  <p style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 14, lineHeight: 1.7 }}>
                    The seller has marked this order as <strong>delivered</strong>. Please check your item carefully, then take one of the two actions below.
                  </p>

                  {/* Auto-release countdown */}
                  {order.releaseDeadline && (() => {
                    const dl = order.releaseDeadline?.seconds
                      ? new Date(order.releaseDeadline.seconds * 1000)
                      : new Date(order.releaseDeadline);
                    const daysLeft = Math.max(0, Math.ceil((dl - Date.now()) / 86400000));
                    return (
                      <div style={{ padding: "10px 14px", background: "rgba(217,119,6,0.08)", border: "1px solid rgba(217,119,6,0.25)", borderRadius: "var(--radius-sm)", marginBottom: 16, fontSize: 13, color: "#92400e" }}>
                        ⏱ If you take no action, payment will be <strong>automatically released</strong> to the seller in <strong>{daysLeft} day{daysLeft !== 1 ? "s" : ""}</strong>.
                      </div>
                    );
                  })()}

                  {/* Two clear options */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                    <div style={{ border: "1.5px solid rgba(5,150,105,0.3)", borderRadius: "var(--radius-sm)", padding: "14px", background: "rgba(5,150,105,0.04)" }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: "var(--success)", marginBottom: 8 }}>
                        ✅ Received the item?
                      </div>
                      <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 12, lineHeight: 1.5 }}>
                        Click confirm to release payment to the seller. This cannot be undone.
                      </p>
                      <Button variant="success" full size="sm" loading={acting === "confirm"} onClick={handleConfirmDelivery}>
                        Confirm Delivery
                      </Button>
                    </div>
                    <div style={{ border: "1.5px solid rgba(220,38,38,0.3)", borderRadius: "var(--radius-sm)", padding: "14px", background: "rgba(220,38,38,0.04)" }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: "var(--danger)", marginBottom: 8 }}>
                        ❌ Problem with order?
                      </div>
                      <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 12, lineHeight: 1.5 }}>
                        Not received, wrong item, or damaged? Raise a dispute to freeze payment.
                      </p>
                      <Button variant="danger" full size="sm" onClick={() => navigate(`/escrow`)}>
                        Raise Dispute
                      </Button>
                    </div>
                  </div>

                  <Button variant="secondary" size="sm" full onClick={() => navigate(`/chat?with=${order.sellerId}`)}>
                    💬 Chat with Seller First
                  </Button>
                </div>
              </div>
            )}

            {(order.status === "paid" || order.status === "accepted") && (
              <div style={{ marginTop: 12 }}>
                <Button variant="danger" size="sm" loading={acting === "cancel"} onClick={handleCancel}>
                  Cancel Order
                </Button>
              </div>
            )}

            {order.status === "completed" && !order.reviewed && (
              <div style={{
                border: "1.5px solid var(--border)", borderRadius: "var(--radius-lg)",
                padding: "16px 18px", marginBottom: 12,
                display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap",
              }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>🎉 Order Complete!</div>
                  <div style={{ fontSize: 13, color: "var(--text-muted)" }}>Share your experience to help other buyers.</div>
                </div>
                <Button variant="outline" onClick={() => setShowReview(true)}>⭐ Leave Review</Button>
              </div>
            )}
          </div>
        )}

        {/* ── ORDER DETAILS ────────────────────────────── */}
        <div className="card" style={{ marginBottom: 20 }}>
          <h3 style={{ fontWeight: 700, marginBottom: 16, fontFamily: "var(--font-display)" }}>Order Details</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              ["Item",     order.itemTitle],
              ["Type",     order.itemType],
              ["Quantity", order.quantity > 1 ? `× ${order.quantity}` : "1"],
              ["Payment",  order.paymentMethod === "wallet" ? "Wallet" : "MoMo"],
              ["Subtotal", `GHS ${order.amount?.toFixed(2)}`],
              ["Escrow Fee", `GHS ${(order.escrowFee || 0).toFixed(2)}`],
              ...(isSellerUser ? [["Commission", `GHS ${(order.commission || 0).toFixed(2)}`]] : []),
            ].map(([k, v]) => v ? (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: 14, paddingBottom: 8, borderBottom: "1px solid var(--border)" }}>
                <span style={{ color: "var(--text-muted)" }}>{k}</span>
                <span style={{ fontWeight: 600 }}>{v}</span>
              </div>
            ) : null)}
            <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 800, fontSize: 16 }}>
              <span>{isBuyer ? "Total Paid" : "You Receive"}</span>
              <span style={{ color: "var(--accent)" }}>
                GHS {isBuyer
                  ? (order.grandTotal || order.amount)?.toFixed(2)
                  : (order.amount - (order.commission || 0))?.toFixed(2)
                }
              </span>
            </div>
          </div>
        </div>

        {/* ── CONTACT CARDS ────────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>

          {/* Buyer card — seller sees buyer's contacts */}
          {buyer && (
            <div className="card" style={{ padding: 18 }}>
              <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 700, letterSpacing: "0.5px", marginBottom: 10 }}>
                👤 BUYER
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: "50%", flexShrink: 0,
                  background: "var(--accent-glow)", color: "var(--accent)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontWeight: 800, fontSize: 16,
                }}>
                  {buyer.displayName?.[0] || "B"}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{buyer.displayName}</div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{buyer.location || "Ghana"}</div>
                </div>
              </div>

              {/* Contact details — shown to seller after order is accepted */}
              {isSellerUser && !["awaiting_payment", "cancelled"].includes(order.status) ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {buyer.email && (
                    <a href={`mailto:${buyer.email}`} style={{
                      display: "flex", alignItems: "center", gap: 8,
                      padding: "8px 12px", background: "var(--surface-2)",
                      borderRadius: "var(--radius-sm)", border: "1px solid var(--border)",
                      textDecoration: "none", color: "var(--text)",
                      fontSize: 13, fontWeight: 500,
                    }}>
                      <span>✉️</span>
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {buyer.email}
                      </span>
                    </a>
                  )}
                  {buyer.phone && (
                    <a href={`tel:${buyer.phone}`} style={{
                      display: "flex", alignItems: "center", gap: 8,
                      padding: "8px 12px", background: "var(--surface-2)",
                      borderRadius: "var(--radius-sm)", border: "1px solid var(--border)",
                      textDecoration: "none", color: "var(--text)",
                      fontSize: 13, fontWeight: 500,
                    }}>
                      <span>📞</span>
                      <span>{buyer.phone}</span>
                    </a>
                  )}
                  {!buyer.phone && (
                    <div style={{ fontSize: 12, color: "var(--text-muted)", fontStyle: "italic" }}>
                      No phone number on profile
                    </div>
                  )}
                  <button
                    onClick={() => navigate(`/chat?with=${order.buyerId}`)}
                    style={{
                      display: "flex", alignItems: "center", gap: 6,
                      padding: "8px 12px", background: "var(--accent-glow)",
                      borderRadius: "var(--radius-sm)", border: "1px solid rgba(26,86,219,0.2)",
                      cursor: "pointer", fontSize: 13, fontWeight: 600,
                      color: "var(--accent)", fontFamily: "var(--font-body)",
                    }}
                  >
                    💬 Chat with Buyer
                  </button>
                </div>
              ) : isSellerUser ? (
                <div style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.5 }}>
                  Contact details will be visible after you accept the order.
                </div>
              ) : (
                /* Buyer sees own info label */
                <div style={{ fontSize: 12, color: "var(--success)", fontWeight: 600 }}>
                  ✓ This is you
                </div>
              )}
            </div>
          )}

          {/* Seller card — buyer sees seller's contacts */}
          {seller && (
            <div className="card" style={{ padding: 18 }}>
              <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 700, letterSpacing: "0.5px", marginBottom: 10 }}>
                🏪 SELLER
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: "50%", flexShrink: 0,
                  background: "rgba(5,150,105,0.12)", color: "var(--success)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontWeight: 800, fontSize: 16,
                }}>
                  {seller.displayName?.[0] || "S"}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{seller.displayName}</div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{seller.location || "Ghana"}</div>
                </div>
              </div>

              {isBuyer ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {seller.email && (
                    <a href={`mailto:${seller.email}`} style={{
                      display: "flex", alignItems: "center", gap: 8,
                      padding: "8px 12px", background: "var(--surface-2)",
                      borderRadius: "var(--radius-sm)", border: "1px solid var(--border)",
                      textDecoration: "none", color: "var(--text)",
                      fontSize: 13, fontWeight: 500,
                    }}>
                      <span>✉️</span>
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {seller.email}
                      </span>
                    </a>
                  )}
                  {seller.phone && (
                    <a href={`tel:${seller.phone}`} style={{
                      display: "flex", alignItems: "center", gap: 8,
                      padding: "8px 12px", background: "var(--surface-2)",
                      borderRadius: "var(--radius-sm)", border: "1px solid var(--border)",
                      textDecoration: "none", color: "var(--text)",
                      fontSize: 13, fontWeight: 500,
                    }}>
                      <span>📞</span>
                      <span>{seller.phone}</span>
                    </a>
                  )}
                  <button
                    onClick={() => navigate(`/chat?with=${order.sellerId}`)}
                    style={{
                      display: "flex", alignItems: "center", gap: 6,
                      padding: "8px 12px", background: "var(--accent-glow)",
                      borderRadius: "var(--radius-sm)", border: "1px solid rgba(26,86,219,0.2)",
                      cursor: "pointer", fontSize: 13, fontWeight: 600,
                      color: "var(--accent)", fontFamily: "var(--font-body)",
                    }}
                  >
                    💬 Chat with Seller
                  </button>
                  <button
                    onClick={() => navigate(`/store/${order.sellerId}`)}
                    style={{
                      display: "flex", alignItems: "center", gap: 6,
                      padding: "8px 12px", background: "var(--surface-2)",
                      borderRadius: "var(--radius-sm)", border: "1px solid var(--border)",
                      cursor: "pointer", fontSize: 13, fontWeight: 500,
                      color: "var(--text-secondary)", fontFamily: "var(--font-body)",
                    }}
                  >
                    🏪 View Store
                  </button>
                </div>
              ) : (
                <div style={{ fontSize: 12, color: "var(--success)", fontWeight: 600 }}>
                  ✓ This is you
                </div>
              )}
            </div>
          )}
        </div>

        {/* Buyer protection */}
        {isBuyer && order.status !== "completed" && order.status !== "cancelled" && (
          <div className="alert alert-info">
            <span>🛡️</span>
            <div>
              <strong>Buyer Protection Active</strong>
              <p style={{ fontSize: 13, marginTop: 4 }}>
                Your payment is held in escrow. Only confirm delivery after you have received and verified the item. You can raise a dispute within 7 days if there's a problem.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Review Modal */}
      <Modal
        isOpen={showReview}
        onClose={() => setShowReview(false)}
        title="Leave a Review"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowReview(false)}>Skip</Button>
            <Button variant="primary" loading={acting === "review"} onClick={handleReview}>Submit Review</Button>
          </>
        }
      >
        <p style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 16 }}>
          How was your experience with <strong>{order.itemTitle}</strong>?
        </p>
        <div className="form-group">
          <label className="form-label">Rating</label>
          <StarRating value={review.rating} onChange={r => setReview(p => ({ ...p, rating: r }))} />
        </div>
        <FormTextarea
          label="Your Review"
          value={review.comment}
          onChange={e => setReview(p => ({ ...p, comment: e.target.value }))}
          placeholder="Was it as described? Was delivery prompt? Would you recommend this seller?"
          rows={4}
        />
      </Modal>
    </div>
  );
}
