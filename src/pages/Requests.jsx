import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  getRequests, getRequestById, createRequest, updateRequest,
  listenToOffersForRequest, createOffer, updateOffer,
  createNotification, getUserDoc
} from "../firebase/db";
import { sendRequestPostedEmail, sendOfferReceivedEmail } from "../services/emailService";
import { RequestCard } from "../components/ListingCard";
import { Spinner, Button, Badge, Alert, Modal, PageHeader, EmptyState, PriceTag, FormInput, FormTextarea, StatusBadge, toast } from "../components/UI";

const CATEGORIES = ["Products", "Services", "Repair", "Transport", "Food", "Design", "Other"];

export function RequestsPage() {
  const { currentUser, userDoc } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  const loadRequests = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getRequests();
      setRequests(data);
    } catch (e) {
      console.error(e);
      setError("Could not load requests. Please refresh.");
    }
    setLoading(false);
  };

  useEffect(() => { loadRequests(); }, []);

  return (
    <div className="page-wrapper">
      <div className="container" style={{ paddingTop: 28 }}>
        <PageHeader
          title="Open Requests"
          subtitle={`${requests.length} active request${requests.length !== 1 ? "s" : ""}`}
          action={currentUser && <Button variant="primary" onClick={() => setShowCreate(true)}>+ Post Request</Button>}
        />
        {error && <Alert type="danger">{error} <button onClick={loadRequests} style={{ marginLeft: 8, background: "none", border: "none", color: "var(--danger)", fontWeight: 700, cursor: "pointer", textDecoration: "underline" }}>Retry</button></Alert>}
        {loading ? <Spinner center />
          : requests.length > 0
            ? <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {requests.map(r => <RequestCard key={r.id} item={r} />)}
              </div>
            : <EmptyState icon="📋" title="No open requests yet" description="Be the first to post what you need" action={currentUser && <Button variant="primary" onClick={() => setShowCreate(true)}>Post a Request</Button>} />
        }
      </div>
      <CreateRequestModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={() => { setShowCreate(false); loadRequests(); }}
      />
    </div>
  );
}

const CreateRequestModal = ({ isOpen, onClose, onCreated }) => {
  const { currentUser, userDoc } = useAuth();
  const [form, setForm] = useState({ title: "", description: "", budget: "", category: "Products", deadline: "", location: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!form.title || !form.description) return toast.error("Please fill all required fields");
    setLoading(true);
    try {
      await createRequest({
        ...form, budget: parseFloat(form.budget) || 0,
        buyerId: currentUser.uid, buyerName: userDoc?.displayName, offerCount: 0
      });
      // In-app notification
      await createNotification(currentUser.uid, {
        title: "Request Posted!",
        body: `Your request "${form.title}" is now live. Sellers will start sending offers soon.`,
        type: "system",
      });
      // Email confirmation
      await sendRequestPostedEmail(currentUser.email, userDoc?.displayName, form.title);
      toast.success("Request posted! Sellers can now send you offers.");
      setForm({ title: "", description: "", budget: "", category: "Products", deadline: "", location: "" });
      onCreated();
    } catch (e) {
      console.error(e);
      toast.error("Failed to post request — " + e.message);
    }
    setLoading(false);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Post a Request"
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button variant="primary" loading={loading} onClick={handleSubmit}>Post Request</Button></>}
    >
      <FormInput label="What do you need? *" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Need a logo design" />
      <FormTextarea label="Description *" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Provide detailed requirements..." />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <FormInput label="Budget (GHS)" type="number" value={form.budget} onChange={e => setForm(p => ({ ...p, budget: e.target.value }))} placeholder="0.00" />
        <div className="form-group">
          <label className="form-label">Category</label>
          <select className="form-select" value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <FormInput label="Deadline" type="date" value={form.deadline} onChange={e => setForm(p => ({ ...p, deadline: e.target.value }))} />
        <FormInput label="Location" value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} placeholder="e.g. Accra" />
      </div>
    </Modal>
  );
};

export function RequestDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser, userDoc, isSeller } = useAuth();
  const [request, setRequest] = useState(null);
  const [offers, setOffers] = useState([]);
  const [buyer, setBuyer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showOffer, setShowOffer] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const r = await getRequestById(id);
        if (!r) { navigate("/requests"); return; }
        setRequest(r);
        if (r.buyerId) setBuyer(await getUserDoc(r.buyerId));
        const unsub = listenToOffersForRequest(id, setOffers);
        setLoading(false);
        return unsub;
      } catch (e) { setLoading(false); }
    };
    load();
  }, [id]);

  const handleAcceptOffer = async (offer) => {
    try {
      await updateOffer(offer.id, { status: "accepted" });
      await updateRequest(id, { status: "closed", acceptedOfferId: offer.id });
      await createNotification(offer.sellerId, {
        title: "Offer Accepted!",
        body: `Your offer for "${request.title}" was accepted`,
        type: "offer"
      });
      toast.success("Offer accepted!");
      setRequest(prev => ({ ...prev, status: "closed" }));
    } catch (e) { toast.error("Failed to accept offer"); }
  };

  if (loading) return <Spinner center />;
  if (!request) return null;

  const isOwner = currentUser?.uid === request.buyerId;

  return (
    <div className="page-wrapper">
      <div className="container" style={{ paddingTop: 28 }}>
        <button onClick={() => navigate(-1)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, color: "var(--text-muted)", fontSize: 14, marginBottom: 20 }}>← Back</button>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 28 }}>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
              <h1 style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 800 }}>{request.title}</h1>
              <StatusBadge status={request.status} />
            </div>
            <p style={{ color: "var(--text-secondary)", lineHeight: 1.8, marginBottom: 20 }}>{request.description}</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 24 }}>
              {request.budget > 0 && <Badge type="primary">💰 Budget: GHS {request.budget}</Badge>}
              {request.category && <Badge type="muted">📁 {request.category}</Badge>}
              {request.location && <Badge type="muted">📍 {request.location}</Badge>}
              {request.deadline && <Badge type="warning">📅 Due {new Date(request.deadline).toLocaleDateString()}</Badge>}
            </div>

            {/* Offers */}
            <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, marginBottom: 16 }}>
              Offers ({offers.length})
            </h3>
            {offers.length === 0
              ? <EmptyState icon="💬" title="No offers yet" description={isSeller ? "Be the first to send an offer!" : "Waiting for sellers to respond"} />
              : offers.map(offer => (
                <div key={offer.id} className="card" style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div style={{ fontWeight: 700 }}>{offer.sellerName}</div>
                      <div style={{ fontSize: 13, color: "var(--text-muted)" }}>Delivery: {offer.deliveryTime || "TBD"}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <PriceTag amount={offer.price} size="sm" />
                      <StatusBadge status={offer.status} />
                    </div>
                  </div>
                  <p style={{ fontSize: 14, color: "var(--text-secondary)", margin: "10px 0" }}>{offer.message}</p>
                  {isOwner && offer.status === "pending" && request.status === "open" && (
                    <div style={{ display: "flex", gap: 8 }}>
                      <Button variant="success" size="sm" onClick={() => handleAcceptOffer(offer)}>✓ Accept Offer</Button>
                      <Button variant="outline" size="sm" onClick={() => navigate(`/chat?with=${offer.sellerId}`)}>💬 Chat</Button>
                    </div>
                  )}
                  {offer.status === "accepted" && <Badge type="success">✓ Accepted</Badge>}
                </div>
              ))
            }
          </div>

          <div>
            <div className="card">
              {buyer && (
                <div style={{ marginBottom: 16, paddingBottom: 16, borderBottom: "1px solid var(--border)" }}>
                  <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 6 }}>Posted by</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--accent-glow)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "var(--accent)" }}>
                      {buyer.displayName?.[0]}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600 }}>{buyer.displayName}</div>
                      <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{buyer.location || "Ghana"}</div>
                    </div>
                  </div>
                </div>
              )}
              {isSeller && !isOwner && request.status === "open" && (
                <Button variant="primary" full onClick={() => setShowOffer(true)}>Send an Offer</Button>
              )}
              {isOwner && (
                <Alert type="info">You posted this request. Accept an offer below.</Alert>
              )}
              {!currentUser && (
                <Button variant="outline" full onClick={() => navigate("/login")}>Login to Send Offer</Button>
              )}
            </div>
          </div>
        </div>
      </div>
      <SendOfferModal
        isOpen={showOffer}
        onClose={() => setShowOffer(false)}
        request={request}
        onSent={() => setShowOffer(false)}
      />
    </div>
  );
}

const SendOfferModal = ({ isOpen, onClose, request, onSent }) => {
  const { currentUser, userDoc } = useAuth();
  const [form, setForm] = useState({ price: "", deliveryTime: "", message: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!form.price || !form.message) return toast.error("Fill all required fields");
    setLoading(true);
    try {
      await createOffer({
        requestId: request.id, price: parseFloat(form.price),
        deliveryTime: form.deliveryTime, message: form.message,
        sellerId: currentUser.uid, sellerName: userDoc?.displayName
      });
      // In-app notification to buyer
      await createNotification(request.buyerId, {
        title: `New Offer from ${userDoc?.displayName}`,
        body: `GHS ${form.price} offer for "${request.title}" — Delivery: ${form.deliveryTime || "TBD"}`,
        type: "offer", link: `/requests/${request.id}`
      });
      // Email the buyer
      const buyer = await getUserDoc(request.buyerId);
      if (buyer?.email) {
        await sendOfferReceivedEmail(buyer.email, buyer.displayName, request.title, userDoc?.displayName, form.price);
      }
      toast.success("Offer sent successfully!");
      setForm({ price: "", deliveryTime: "", message: "" });
      onSent();
    } catch (e) {
      console.error(e);
      toast.error("Failed to send offer — " + e.message);
    }
    setLoading(false);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Send an Offer"
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button variant="primary" loading={loading} onClick={handleSubmit}>Send Offer</Button></>}
    >
      <FormInput label="Your Price (GHS) *" type="number" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} placeholder="0.00" />
      <FormInput label="Delivery Time" value={form.deliveryTime} onChange={e => setForm(p => ({ ...p, deliveryTime: e.target.value }))} placeholder="e.g. 3 days" />
      <FormTextarea label="Your Proposal *" value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))} placeholder="Describe how you'll fulfill this request..." />
    </Modal>
  );
};
