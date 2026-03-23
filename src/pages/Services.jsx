import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getServices, getServiceById, getReviewsForTarget, createOrder, createEscrow, debitWallet, getWallet, getPlatformSettings, createNotification, getUserDoc } from "../firebase/db";
import { ListingCard } from "../components/ListingCard";
import { Spinner, Button, Badge, Alert, StarRating, Modal, PriceTag, PageHeader, SearchBar, EmptyState, VerifiedBadge, ReportButton } from "../components/UI";
import { ReportModal } from "../components/ReportModal";
import { toast } from "../components/UI";

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
  const [service, setService] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [seller, setSeller] = useState(null);
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [buying, setBuying] = useState(false);

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

  const handleBook = async () => {
    if (!currentUser) return navigate("/login");
    setBuying(true);
    try {
      const wallet = await getWallet(currentUser.uid);
      const escrowFeeAmt = (service.price * (settings.escrowFee || 2)) / 100;
      const total = service.price + escrowFeeAmt;
      if (wallet.balance < total) { toast.error("Insufficient wallet balance"); setBuying(false); return; }
      await debitWallet(currentUser.uid, total, `Service: ${service.title}`);
      const order = await createOrder({
        buyerId: currentUser.uid, buyerName: userDoc?.displayName,
        sellerId: service.sellerId, itemId: id, itemTitle: service.title,
        itemType: "service", amount: service.price,
        commission: (service.price * (settings.commissionRate || 10)) / 100,
        escrowFee: escrowFeeAmt, grandTotal: total,
        status: "paid", paymentMethod: "wallet"
      });
      await createEscrow({ orderId: order.id, buyerId: currentUser.uid, sellerId: service.sellerId, amount: service.price, escrowFee: escrowFeeAmt, status: "held" });
      await createNotification(service.sellerId, { title: "New Booking", body: `${userDoc?.displayName} booked ${service.title}`, type: "order", link: `/orders/${order.id}` });
      setShowBuyModal(false);
      toast.success("Service booked!");
      navigate(`/orders/${order.id}`);
    } catch (e) { toast.error(e.message || "Booking failed"); }
    setBuying(false);
  };

  if (loading) return <Spinner center />;
  if (!service) return null;

  const avgRating = reviews.length ? reviews.reduce((a, r) => a + r.rating, 0) / reviews.length : 0;

  return (
    <div className="page-wrapper">
      <div className="container" style={{ paddingTop: 28 }}>
        <button onClick={() => navigate(-1)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, color: "var(--text-muted)", fontSize: 14, marginBottom: 20 }}>← Back</button>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 28 }}>
          <div>
            {service.imageURL && (
              <div style={{ width: "100%", height: 340, borderRadius: "var(--radius-xl)", overflow: "hidden", marginBottom: 24, border: "1px solid var(--border)" }}>
                <img src={service.imageURL} alt={service.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <h1 style={{ fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 800 }}>{service.title}</h1>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
                  <StarRating value={avgRating} readonly />
                  <span style={{ fontSize: 14, color: "var(--text-muted)" }}>({reviews.length} reviews)</span>
                </div>
              </div>
              <ReportButton onReport={() => setShowReport(true)} />
            </div>
            <p style={{ color: "var(--text-secondary)", lineHeight: 1.8, margin: "20px 0" }}>{service.description}</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 24 }}>
              {service.category && <Badge type="muted">📁 {service.category}</Badge>}
              {service.deliveryTime && <Badge type="muted">⏱ {service.deliveryTime}</Badge>}
              {service.location && <Badge type="muted">📍 {service.location}</Badge>}
            </div>
            {seller && (
              <div className="card" style={{ marginBottom: 24 }}>
                <div style={{ fontWeight: 700, marginBottom: 12 }}>Service Provider</div>
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
                  <Button variant="outline" size="sm" style={{ marginLeft: "auto" }} onClick={() => navigate(`/chat?with=${service.sellerId}`)}>💬 Chat</Button>
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
              <div style={{ background: "var(--surface-3)", borderRadius: "var(--radius-sm)", padding: 14, marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 4 }}>
                  <span>Service fee</span><span>GHS {service.price?.toFixed(2)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, color: "var(--text-muted)" }}>
                  <span>Escrow fee ({settings.escrowFee || 2}%)</span>
                  <span>GHS {((service.price * (settings.escrowFee || 2)) / 100).toFixed(2)}</span>
                </div>
              </div>
              {service.sellerId === currentUser?.uid
                ? <Alert type="info">This is your service</Alert>
                : <Button variant="primary" full size="lg" onClick={() => currentUser ? setShowBuyModal(true) : navigate("/login")}>📅 Book Service</Button>
              }
              <button onClick={() => navigate(`/chat?with=${service.sellerId}`)}
                style={{ marginTop: 10, padding: 10, border: "1.5px solid var(--border)", borderRadius: "var(--radius-sm)", background: "none", cursor: "pointer", fontSize: 14, fontWeight: 600, width: "100%" }}>
                💬 Message Provider
              </button>
            </div>
          </div>
        </div>
      </div>
      <Modal isOpen={showBuyModal} onClose={() => setShowBuyModal(false)} title="Confirm Booking"
        footer={<><Button variant="secondary" onClick={() => setShowBuyModal(false)}>Cancel</Button><Button variant="primary" loading={buying} onClick={handleBook}>Confirm Booking</Button></>}
      >
        <Alert type="info">Payment is held in escrow until service is delivered.</Alert>
        <div style={{ marginTop: 12, fontSize: 14, color: "var(--text-secondary)" }}>
          <p>You are booking: <strong>{service.title}</strong></p>
          <p style={{ marginTop: 8 }}>Total: <strong>GHS {(service.price + (service.price * (settings.escrowFee || 2)) / 100).toFixed(2)}</strong></p>
        </div>
      </Modal>
      <ReportModal isOpen={showReport} onClose={() => setShowReport(false)} targetId={id} targetType="service" />
    </div>
  );
}
