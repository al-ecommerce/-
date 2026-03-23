import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  createAd, getAllAds, createFeaturedListing, getAllFeaturedListings,
  getPlatformSettings, debitWallet, getWallet, getProducts, getServices
} from "../firebase/db";
import {
  Spinner, Button, Alert, Badge, PageHeader, StatusBadge,
  FormInput, FormTextarea, FormSelect, Modal, PriceTag, toast, EmptyState
} from "../components/UI";

// ─── ADS PAGE ─────────────────────────────────────────────
export function AdsPage() {
  const { currentUser, userDoc } = useAuth();
  const navigate = useNavigate();
  const [myAds, setMyAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (!currentUser) return navigate("/login");
    loadAds();
  }, [currentUser]);

  const loadAds = async () => {
    try {
      const all = await getAllAds();
      setMyAds(all.filter(a => a.advertiserId === currentUser.uid));
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  return (
    <div className="page-wrapper">
      <div className="container" style={{ paddingTop: 28 }}>
        <PageHeader
          title="My Advertisements"
          subtitle="Promote your business to thousands of ASVAN users"
          action={<Button variant="primary" onClick={() => setShowForm(true)}>+ Create Ad</Button>}
        />

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginBottom: 28 }}>
          {[
            { icon: "👁", title: "High Visibility", desc: "Ads appear on homepage and category pages" },
            { icon: "🎯", title: "Targeted Reach", desc: "Reach buyers actively looking to purchase" },
            { icon: "📊", title: "Track Performance", desc: "See impressions and click statistics" },
          ].map(f => (
            <div key={f.title} className="card" style={{ textAlign: "center", padding: 20 }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>{f.icon}</div>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>{f.title}</div>
              <div style={{ fontSize: 13, color: "var(--text-muted)" }}>{f.desc}</div>
            </div>
          ))}
        </div>

        {loading ? <Spinner center /> : myAds.length === 0 ? (
          <EmptyState
            icon="📢"
            title="No advertisements yet"
            description="Create your first ad to boost your visibility"
            action={<Button variant="primary" onClick={() => setShowForm(true)}>Create First Ad</Button>}
          />
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Ad Title</th>
                  <th>Clicks</th>
                  <th>Impressions</th>
                  <th>Status</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {myAds.map(ad => (
                  <tr key={ad.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{ad.title}</div>
                      <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{ad.description?.slice(0, 50)}...</div>
                    </td>
                    <td style={{ fontWeight: 700 }}>{ad.clicks || 0}</td>
                    <td>{ad.impressions || 0}</td>
                    <td><StatusBadge status={ad.status} /></td>
                    <td style={{ fontSize: 13, color: "var(--text-muted)" }}>
                      {ad.createdAt?.seconds ? new Date(ad.createdAt.seconds * 1000).toLocaleDateString() : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <CreateAdModal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        uid={currentUser?.uid}
        userDoc={userDoc}
        onCreated={() => { setShowForm(false); loadAds(); }}
      />
    </div>
  );
}

const CreateAdModal = ({ isOpen, onClose, uid, userDoc, onCreated }) => {
  const [form, setForm] = useState({
    title: "", description: "", ctaText: "Learn More",
    ctaLink: "", budget: "", duration: "7"
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!form.title || !form.description || !form.budget) {
      return toast.error("Please fill all required fields");
    }
    setLoading(true);
    try {
      const wallet = await getWallet(uid);
      const cost = parseFloat(form.budget);
      if (wallet.balance < cost) {
        toast.error(`Insufficient balance. You need GHS ${cost.toFixed(2)}`);
        setLoading(false);
        return;
      }
      await debitWallet(uid, cost, `Ad campaign: ${form.title}`);
      await createAd({
        ...form,
        budget: cost,
        duration: parseInt(form.duration),
        advertiserId: uid,
        advertiserName: userDoc?.displayName,
        status: "pending"
      });
      toast.success("Ad submitted! Awaiting admin approval.");
      onCreated();
    } catch (e) {
      toast.error(e.message || "Failed to create ad");
    }
    setLoading(false);
  };

  const f = k => ({ value: form[k], onChange: e => setForm(p => ({ ...p, [k]: e.target.value })) });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Advertisement"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" loading={loading} onClick={handleSubmit}>Submit Ad</Button>
        </>
      }
    >
      <Alert type="info">Ads are reviewed by our team before going live. Payment is deducted upfront.</Alert>
      <FormInput label="Ad Title *" placeholder="Short, catchy headline" {...f("title")} />
      <div className="form-group">
        <label className="form-label">Description *</label>
        <textarea className="form-textarea" rows={3} placeholder="Ad body text (max 150 chars)" maxLength={150} {...f("description")} />
        <span className="form-hint">{form.description.length}/150 characters</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <FormInput label="CTA Button Text" placeholder="Learn More" {...f("ctaText")} />
        <FormInput label="CTA Link (URL)" placeholder="https://..." {...f("ctaLink")} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div className="form-group">
          <label className="form-label">Duration</label>
          <select className="form-select" value={form.duration} onChange={e => setForm(p => ({ ...p, duration: e.target.value }))}>
            <option value="7">7 days</option>
            <option value="14">14 days</option>
            <option value="30">30 days</option>
          </select>
        </div>
        <FormInput label="Budget (GHS) *" type="number" placeholder="Minimum GHS 50" {...f("budget")} />
      </div>
    </Modal>
  );
};

// ─── FEATURED LISTINGS PAGE ───────────────────────────────
export function FeaturedPage() {
  const { currentUser, userDoc, isSeller } = useAuth();
  const navigate = useNavigate();
  const [myFeatured, setMyFeatured] = useState([]);
  const [products, setProducts] = useState([]);
  const [services, setServices] = useState([]);
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (!currentUser) return navigate("/login");
    loadData();
  }, [currentUser]);

  const loadData = async () => {
    try {
      const [all, p, s, st] = await Promise.all([
        getAllFeaturedListings(),
        getProducts({ sellerId: currentUser.uid }),
        getServices({ sellerId: currentUser.uid }),
        getPlatformSettings()
      ]);
      setMyFeatured(all.filter(f => f.sellerId === currentUser.uid));
      setProducts(p); setServices(s); setSettings(st);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  if (!isSeller) {
    return (
      <div className="page-wrapper">
        <div className="container" style={{ paddingTop: 60, textAlign: "center", maxWidth: 500 }}>
          <div style={{ fontSize: 52, marginBottom: 16 }}>⭐</div>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, marginBottom: 12 }}>Featured Listings</h2>
          <p style={{ color: "var(--text-muted)", marginBottom: 24 }}>Only sellers can feature their listings. Become a seller to get started.</p>
          <Button variant="primary" onClick={() => navigate("/seller-dashboard")}>Become a Seller</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <div className="container" style={{ paddingTop: 28 }}>
        <PageHeader
          title="Featured Listings"
          subtitle={`Boost your listings for GHS ${settings.featuredListingFee || 20}/feature`}
          action={<Button variant="primary" onClick={() => setShowForm(true)}>⭐ Feature a Listing</Button>}
        />

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginBottom: 28 }}>
          {[
            { icon: "🔝", title: "Top Placement", desc: "Appear at the top of search results and home page" },
            { icon: "⭐", title: "Featured Badge", desc: "Gold featured badge attracts more buyers" },
            { icon: "📈", title: "More Sales", desc: "Featured listings get 5x more views" },
          ].map(f => (
            <div key={f.title} className="card" style={{ textAlign: "center", padding: 20 }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>{f.icon}</div>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>{f.title}</div>
              <div style={{ fontSize: 13, color: "var(--text-muted)" }}>{f.desc}</div>
            </div>
          ))}
        </div>

        {loading ? <Spinner center /> : myFeatured.length === 0 ? (
          <EmptyState
            icon="⭐"
            title="No featured listings yet"
            description="Feature your listings to get more visibility"
            action={<Button variant="primary" onClick={() => setShowForm(true)}>Feature a Listing</Button>}
          />
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr><th>Item</th><th>Type</th><th>Status</th><th>Date</th></tr>
              </thead>
              <tbody>
                {myFeatured.map(f => (
                  <tr key={f.id}>
                    <td style={{ fontWeight: 600 }}>{f.itemTitle}</td>
                    <td><Badge type="muted">{f.itemType}</Badge></td>
                    <td><StatusBadge status={f.status} /></td>
                    <td style={{ fontSize: 13, color: "var(--text-muted)" }}>
                      {f.createdAt?.seconds ? new Date(f.createdAt.seconds * 1000).toLocaleDateString() : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <FeatureListingModal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        products={products}
        services={services}
        settings={settings}
        uid={currentUser?.uid}
        userDoc={userDoc}
        onCreated={() => { setShowForm(false); loadData(); }}
      />
    </div>
  );
}

const FeatureListingModal = ({ isOpen, onClose, products, services, settings, uid, userDoc, onCreated }) => {
  const [itemType, setItemType] = useState("product");
  const [selectedItem, setSelectedItem] = useState("");
  const [loading, setLoading] = useState(false);
  const items = itemType === "product" ? products : services;
  const fee = settings.featuredListingFee || 20;

  const handleSubmit = async () => {
    if (!selectedItem) return toast.error("Please select a listing to feature");
    setLoading(true);
    try {
      const wallet = await getWallet(uid);
      if (wallet.balance < fee) {
        toast.error(`Insufficient balance. Feature fee: GHS ${fee}`);
        setLoading(false);
        return;
      }
      const item = items.find(i => i.id === selectedItem);
      await debitWallet(uid, fee, `Featured listing: ${item?.title}`);
      await createFeaturedListing({
        itemId: selectedItem,
        itemTitle: item?.title,
        itemType,
        sellerId: uid,
        sellerName: userDoc?.displayName,
        feePaid: fee
      });
      toast.success("Featured listing request submitted!");
      onCreated();
    } catch (e) {
      toast.error(e.message || "Failed to submit");
    }
    setLoading(false);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Feature a Listing"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" loading={loading} onClick={handleSubmit}>
            Pay GHS {fee} & Feature
          </Button>
        </>
      }
    >
      <Alert type="info">
        Featured listings appear on the homepage and top of search results. Fee: <strong>GHS {fee}</strong>
      </Alert>
      <div className="form-group" style={{ marginTop: 16 }}>
        <label className="form-label">Listing Type</label>
        <div style={{ display: "flex", gap: 10 }}>
          {["product", "service"].map(t => (
            <button
              key={t}
              onClick={() => { setItemType(t); setSelectedItem(""); }}
              style={{
                flex: 1, padding: "10px", border: "2px solid " + (itemType === t ? "var(--accent)" : "var(--border)"),
                borderRadius: "var(--radius-sm)", background: itemType === t ? "var(--accent-glow)" : "var(--surface)",
                cursor: "pointer", fontWeight: 600, fontSize: 14, fontFamily: "var(--font-body)",
                color: itemType === t ? "var(--accent)" : "var(--text)"
              }}
            >
              {t === "product" ? "📦 Product" : "🛠 Service"}
            </button>
          ))}
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">Select Listing</label>
        {items.length === 0 ? (
          <div className="alert alert-warning">No approved {itemType}s found. Create and get a {itemType} approved first.</div>
        ) : (
          <select className="form-select" value={selectedItem} onChange={e => setSelectedItem(e.target.value)}>
            <option value="">-- Select a {itemType} --</option>
            {items.map(i => (
              <option key={i.id} value={i.id}>{i.title} (GHS {i.price})</option>
            ))}
          </select>
        )}
      </div>
    </Modal>
  );
};
