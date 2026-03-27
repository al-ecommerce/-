import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  createAd, getAllAds,
  createFeaturedListing, getAllFeaturedListings,
  getPlatformSettings, debitWallet, getWallet,
  getProducts, getServices, createNotification
} from "../firebase/db";
import {
  Spinner, Button, Alert, Badge, PageHeader,
  StatusBadge, FormInput, Modal, PriceTag, toast, EmptyState
} from "../components/UI";

// ─── FEATURED LISTINGS PAGE ───────────────────────────────
export function FeaturedPage() {
  const { currentUser, userDoc, isSeller } = useAuth();
  const navigate  = useNavigate();
  const [myFeatured, setMyFeatured] = useState([]);
  const [products,   setProducts]   = useState([]);
  const [services,   setServices]   = useState([]);
  const [settings,   setSettings]   = useState({});
  const [loading,    setLoading]    = useState(true);
  const [showForm,   setShowForm]   = useState(false);

  useEffect(() => {
    if (!currentUser) return navigate("/login");
    loadData();
  }, [currentUser]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [all, p, s, st] = await Promise.all([
        getAllFeaturedListings(),
        getProducts({ sellerId: currentUser.uid }),
        getServices({ sellerId: currentUser.uid }),
        getPlatformSettings(),
      ]);
      setMyFeatured(all.filter(f => f.sellerId === currentUser.uid));
      setProducts(p); setServices(s); setSettings(st);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const fee = settings.featuredListingFee || 20;

  const getDaysLeft = (f) => {
    if (!f.expiresAt) return null;
    const exp = f.expiresAt?.seconds ? new Date(f.expiresAt.seconds * 1000) : new Date(f.expiresAt);
    const days = Math.ceil((exp - Date.now()) / 86400000);
    return days;
  };

  if (!isSeller) return (
    <div className="page-wrapper">
      <div className="container" style={{ paddingTop: 60, textAlign: "center", maxWidth: 480 }}>
        <div style={{ fontSize: 52, marginBottom: 16 }}>⭐</div>
        <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, marginBottom: 12 }}>Featured Listings</h2>
        <p style={{ color: "var(--text-muted)", marginBottom: 24 }}>Only sellers can feature their listings.</p>
        <Button variant="primary" onClick={() => navigate("/seller-dashboard")}>Become a Seller</Button>
      </div>
    </div>
  );

  return (
    <div className="page-wrapper">
      <div className="container" style={{ paddingTop: 28 }}>
        <PageHeader
          title="Featured Listings"
          subtitle={`Boost visibility for GHS ${fee} per listing`}
          action={<Button variant="primary" onClick={() => setShowForm(true)}>⭐ Feature a Listing</Button>}
        />

        {/* Benefits */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginBottom: 28 }}>
          {[
            { icon: "🔝", title: "Homepage Placement",  desc: "Your listing appears in the Featured section on the homepage — seen by every visitor." },
            { icon: "⭐", title: "Gold Featured Badge",  desc: "A prominent badge marks your listing, making it stand out from regular listings." },
            { icon: "📈", title: "More Buyer Eyes",      desc: "Featured listings receive up to 5× more views than standard listings." },
          ].map(f => (
            <div key={f.title} className="card" style={{ padding: 20 }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>{f.icon}</div>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, marginBottom: 6 }}>{f.title}</div>
              <div style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6 }}>{f.desc}</div>
            </div>
          ))}
        </div>

        {/* Pricing card */}
        <div style={{
          background: "linear-gradient(135deg, var(--accent) 0%, #6B48FF 100%)",
          borderRadius: "var(--radius-xl)", padding: "24px 28px",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          flexWrap: "wrap", gap: 16, marginBottom: 28, color: "#fff",
        }}>
          <div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 20, marginBottom: 6 }}>
              Feature Any Listing
            </div>
            <div style={{ opacity: 0.85, fontSize: 14 }}>
              7 days of premium homepage placement. Pay from your wallet.
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 32 }}>
              GHS {fee}
            </div>
            <div style={{ fontSize: 12, opacity: 0.7 }}>per listing / 7 days</div>
          </div>
        </div>

        {/* My featured listings */}
        <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, marginBottom: 16 }}>
          My Featured Listings ({myFeatured.length})
        </h3>

        {loading ? <Spinner center /> : myFeatured.length === 0 ? (
          <EmptyState
            icon="⭐"
            title="No featured listings yet"
            description="Feature your best listing to get maximum exposure"
            action={<Button variant="primary" onClick={() => setShowForm(true)}>Feature a Listing</Button>}
          />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {myFeatured.map(f => {
              const daysLeft = getDaysLeft(f);
              const expired  = daysLeft !== null && daysLeft <= 0;
              return (
                <div key={f.id} style={{
                  background: "var(--surface)", border: "1px solid var(--border)",
                  borderRadius: "var(--radius-lg)", padding: "16px 20px",
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  flexWrap: "wrap", gap: 12,
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span style={{ fontWeight: 700, fontSize: 15 }}>{f.itemTitle}</span>
                      <Badge type="muted">{f.itemType}</Badge>
                    </div>
                    <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
                      Fee paid: GHS {Number(f.feePaid || 0).toFixed(2)}
                      {daysLeft !== null && !expired && (
                        <span style={{ marginLeft: 12, color: daysLeft <= 2 ? "var(--danger)" : "var(--success)", fontWeight: 600 }}>
                          · {daysLeft} day{daysLeft !== 1 ? "s" : ""} left
                        </span>
                      )}
                      {expired && <span style={{ marginLeft: 12, color: "var(--danger)", fontWeight: 600 }}>· Expired</span>}
                    </div>
                  </div>
                  <StatusBadge status={f.status} />
                </div>
              );
            })}
          </div>
        )}
      </div>

      <FeatureListingModal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        products={products}
        services={services}
        fee={fee}
        uid={currentUser?.uid}
        userDoc={userDoc}
        onCreated={() => { setShowForm(false); loadData(); }}
      />
    </div>
  );
}

const FeatureListingModal = ({ isOpen, onClose, products, services, fee, uid, userDoc, onCreated }) => {
  const [itemType,     setItemType]     = useState("product");
  const [selectedItem, setSelectedItem] = useState("");
  const [loading,      setLoading]      = useState(false);
  const items = itemType === "product" ? products : services;

  const handleSubmit = async () => {
    if (!selectedItem) return toast.error("Please select a listing to feature");
    setLoading(true);
    try {
      const wallet = await getWallet(uid);
      if (wallet.balance < fee) {
        toast.error(`Insufficient balance. Feature fee: GHS ${fee}. Top up your wallet first.`);
        setLoading(false);
        return;
      }
      const item = items.find(i => i.id === selectedItem);
      await debitWallet(uid, fee, `Featured listing: ${item?.title}`);

      // Set expiry to 7 days from now
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      await createFeaturedListing({
        itemId:      selectedItem,
        itemTitle:   item?.title,
        itemType,
        sellerId:    uid,
        sellerName:  userDoc?.displayName,
        feePaid:     fee,
        expiresAt,
        imageURL:    item?.imageURL || "",
        price:       item?.price || 0,
      });

      await createNotification(uid, {
        title: "⭐ Listing Featured!",
        body:  `"${item?.title}" is now featured on the homepage for 7 days.`,
        type:  "system",
      });

      toast.success("Listing featured for 7 days!");
      onCreated();
    } catch (e) {
      toast.error(e.message || "Failed to feature listing");
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
        GHS {fee} will be deducted from your wallet. Your listing will appear on the homepage for <strong>7 days</strong>.
      </Alert>
      <div className="form-group" style={{ marginTop: 16 }}>
        <label className="form-label">Listing Type</label>
        <div style={{ display: "flex", gap: 10 }}>
          {["product", "service"].map(t => (
            <button key={t} onClick={() => { setItemType(t); setSelectedItem(""); }}
              style={{
                flex: 1, padding: "10px", border: `2px solid ${itemType === t ? "var(--accent)" : "var(--border)"}`,
                borderRadius: "var(--radius-sm)", background: itemType === t ? "var(--accent-glow)" : "var(--surface)",
                cursor: "pointer", fontWeight: 600, fontSize: 14,
                color: itemType === t ? "var(--accent)" : "var(--text)",
                fontFamily: "var(--font-body)",
              }}
            >
              {t === "product" ? "📦 Product" : "🛠 Service"}
            </button>
          ))}
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">Select Listing</label>
        {items.filter(i => i.status === "approved").length === 0 ? (
          <div className="alert alert-warning">No approved {itemType}s found. You need an approved listing to feature.</div>
        ) : (
          <select className="form-select" value={selectedItem} onChange={e => setSelectedItem(e.target.value)}>
            <option value="">-- Select a {itemType} --</option>
            {items.filter(i => i.status === "approved").map(i => (
              <option key={i.id} value={i.id}>{i.title} — GHS {i.price}</option>
            ))}
          </select>
        )}
      </div>
    </Modal>
  );
};

// ─── ADS PAGE ─────────────────────────────────────────────
export function AdsPage() {
  const { currentUser, userDoc } = useAuth();
  const navigate = useNavigate();
  const [myAds,    setMyAds]    = useState([]);
  const [settings, setSettings] = useState({});
  const [loading,  setLoading]  = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (!currentUser) return navigate("/login");
    loadAds();
  }, [currentUser]);

  const loadAds = async () => {
    setLoading(true);
    try {
      const [all, s] = await Promise.all([getAllAds(), getPlatformSettings()]);
      setMyAds(all.filter(a => a.advertiserId === currentUser.uid));
      setSettings(s);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  return (
    <div className="page-wrapper">
      <div className="container" style={{ paddingTop: 28 }}>
        <PageHeader
          title="My Advertisements"
          subtitle="Promote your business across AlEcom"
          action={<Button variant="primary" onClick={() => setShowForm(true)}>+ Create Ad</Button>}
        />

        {/* What you get */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginBottom: 28 }}>
          {[
            { icon: "🏠", title: "Homepage Banner",    desc: "Your ad shows as a prominent banner on the homepage seen by all visitors." },
            { icon: "🎯", title: "Targeted Audience",   desc: "Reach buyers actively browsing products and services on AlEcom." },
            { icon: "📊", title: "Live Performance",    desc: "Track impressions and clicks on your ad in real-time." },
          ].map(f => (
            <div key={f.title} className="card" style={{ padding: 20 }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>{f.icon}</div>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, marginBottom: 6 }}>{f.title}</div>
              <div style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6 }}>{f.desc}</div>
            </div>
          ))}
        </div>

        {/* Ad pricing tiers */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginBottom: 28 }}>
          {[
            { days: 3,  price: 30,  label: "Starter",    desc: "Try it out",            color: "#6B7280" },
            { days: 7,  price: 60,  label: "Standard",   desc: "Most popular",           color: "var(--accent)",  recommended: true },
            { days: 14, price: 100, label: "Premium",    desc: "Maximum exposure",       color: "#7C3AED" },
          ].map(tier => (
            <div key={tier.days} style={{
              border: `2px solid ${tier.recommended ? "var(--accent)" : "var(--border)"}`,
              borderRadius: "var(--radius-lg)", padding: "20px 16px", textAlign: "center",
              position: "relative", background: "var(--surface)",
            }}>
              {tier.recommended && (
                <div style={{
                  position: "absolute", top: -10, left: "50%", transform: "translateX(-50%)",
                  background: "var(--accent)", color: "#fff", padding: "2px 12px",
                  borderRadius: 20, fontSize: 11, fontWeight: 700,
                }}>POPULAR</div>
              )}
              <div style={{ fontWeight: 700, fontSize: 14, color: tier.color, marginBottom: 4 }}>{tier.label}</div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 800, color: "var(--text)" }}>
                GHS {tier.price}
              </div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 8 }}>{tier.days} days</div>
              <div style={{ fontSize: 13, color: "var(--text-muted)" }}>{tier.desc}</div>
            </div>
          ))}
        </div>

        {/* My Ads */}
        <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, marginBottom: 16 }}>
          My Ads ({myAds.length})
        </h3>

        {loading ? <Spinner center /> : myAds.length === 0 ? (
          <EmptyState
            icon="📢"
            title="No ads yet"
            description="Create your first ad to reach more buyers"
            action={<Button variant="primary" onClick={() => setShowForm(true)}>Create Ad</Button>}
          />
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Ad Title</th><th>Duration</th><th>Budget</th>
                  <th>Clicks</th><th>Impressions</th><th>Status</th><th>Created</th>
                </tr>
              </thead>
              <tbody>
                {myAds.map(ad => (
                  <tr key={ad.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{ad.title}</div>
                      <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{ad.description?.slice(0, 50)}</div>
                    </td>
                    <td>{ad.duration} days</td>
                    <td style={{ fontWeight: 700, color: "var(--accent)" }}>GHS {Number(ad.budget).toFixed(2)}</td>
                    <td style={{ fontWeight: 700 }}>{ad.clicks || 0}</td>
                    <td>{ad.impressions || 0}</td>
                    <td><StatusBadge status={ad.status} /></td>
                    <td style={{ fontSize: 12, color: "var(--text-muted)" }}>
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

const AD_TIERS = [
  { days: 3,  price: 30,  label: "Starter — 3 days (GHS 30)" },
  { days: 7,  price: 60,  label: "Standard — 7 days (GHS 60)" },
  { days: 14, price: 100, label: "Premium — 14 days (GHS 100)" },
];

const CreateAdModal = ({ isOpen, onClose, uid, userDoc, onCreated }) => {
  const [form,    setForm]    = useState({ title: "", description: "", ctaText: "Shop Now", ctaLink: "", tier: 0 });
  const [loading, setLoading] = useState(false);
  const tier = AD_TIERS[form.tier] || AD_TIERS[0];

  const handleSubmit = async () => {
    if (!form.title || !form.description) return toast.error("Title and description are required");
    setLoading(true);
    try {
      const wallet = await getWallet(uid);
      if (wallet.balance < tier.price) {
        toast.error(`Insufficient balance. You need GHS ${tier.price}. Top up your wallet first.`);
        setLoading(false);
        return;
      }
      await debitWallet(uid, tier.price, `Ad campaign: ${form.title}`);

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + tier.days);

      await createAd({
        title:          form.title,
        description:    form.description,
        ctaText:        form.ctaText || "Shop Now",
        ctaLink:        form.ctaLink,
        budget:         tier.price,
        duration:       tier.days,
        advertiserId:   uid,
        advertiserName: userDoc?.displayName,
        expiresAt,
        status:         "pending",
      });

      await createNotification(uid, {
        title: "📢 Ad Submitted!",
        body:  `Your ad "${form.title}" is under review. It will go live once approved by admin.`,
        type:  "system",
      });

      toast.success("Ad submitted for review! Goes live once admin approves.");
      setForm({ title: "", description: "", ctaText: "Shop Now", ctaLink: "", tier: 0 });
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
          <Button variant="primary" loading={loading} onClick={handleSubmit}>
            Pay GHS {tier.price} & Submit
          </Button>
        </>
      }
    >
      <Alert type="info">Ads are reviewed before going live. Payment is deducted when you submit.</Alert>

      {/* Tier picker */}
      <div className="form-group">
        <label className="form-label">Campaign Duration</label>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {AD_TIERS.map((t, i) => (
            <label key={i} style={{
              display: "flex", alignItems: "center", gap: 12, padding: "12px 14px",
              border: `2px solid ${form.tier === i ? "var(--accent)" : "var(--border)"}`,
              borderRadius: "var(--radius-sm)", cursor: "pointer",
              background: form.tier === i ? "var(--accent-glow)" : "var(--surface)",
            }}>
              <input type="radio" name="tier" checked={form.tier === i}
                onChange={() => setForm(p => ({ ...p, tier: i }))}
                style={{ accentColor: "var(--accent)" }}
              />
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{t.days} days</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>GHS {t.price}</div>
              </div>
              {i === 1 && <span style={{ marginLeft: "auto", fontSize: 11, fontWeight: 700, color: "var(--accent)" }}>POPULAR</span>}
            </label>
          ))}
        </div>
      </div>

      <FormInput label="Ad Headline *" placeholder="Short, attention-grabbing title" {...f("title")} />
      <div className="form-group">
        <label className="form-label">Ad Description *</label>
        <textarea className="form-textarea" rows={3}
          placeholder="Describe your offer (max 150 characters)"
          maxLength={150}
          value={form.description}
          onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
        />
        <span className="form-hint">{form.description.length}/150</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <FormInput label="Button Text" placeholder="Shop Now" {...f("ctaText")} />
        <FormInput label="Link URL" placeholder="https://..." {...f("ctaLink")} />
      </div>
    </Modal>
  );
};
