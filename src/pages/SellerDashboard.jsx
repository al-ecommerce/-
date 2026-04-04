import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  updateUserDoc, getProducts, getServices, getSellerOrders,
  createProduct, updateProduct, deleteProduct,
  createService, updateService, deleteService,
  getWallet, getSellerVerification, applyForSellerVerification,
  getUserSubscription, createNotification, getPlatformSettings, debitWallet
} from "../firebase/db";
import { sendAnnouncementEmail } from "../services/emailService";
import {
  Spinner, Button, Alert, Badge, PageHeader, StatusBadge,
  PriceTag, Modal, FormInput, FormTextarea,
  StatCard, Tabs, EmptyState, ConfirmDialog, toast
} from "../components/UI";
import CloudinaryUpload from "../components/CloudinaryUpload";
import ImageURLField from "../components/ImageURLField";

const PRODUCT_CATS = ["Electronics", "Fashion", "Food", "Auto", "Property", "Health", "Education", "Other"];
const SERVICE_CATS = ["Design", "Development", "Writing", "Marketing", "Tutoring", "Legal", "Finance", "Health", "Other"];

export default function SellerDashboard() {
  const { currentUser, userDoc, isSeller, isVerifiedSeller } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const initialTab = params.get("tab") || "overview";

  const [tab, setTab] = useState(initialTab);
  const [products, setProducts] = useState([]);
  const [services, setServices] = useState([]);
  const [orders, setOrders] = useState([]);
  const [wallet, setWallet] = useState(null);
  const [verification, setVerification] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [becomingLoading, setBecomingLoading] = useState(false);

  // Forms
  const [showProductForm, setShowProductForm] = useState(false);
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    if (!currentUser) return navigate("/login");
    const load = async () => {
      try {
        const s = await getPlatformSettings();
        setSettings(s);
        if (isSeller) {
          const [p, sv, o, w, ver, sub] = await Promise.all([
            getProducts({ sellerId: currentUser.uid }),
            getServices({ sellerId: currentUser.uid }),
            getSellerOrders(currentUser.uid),
            getWallet(currentUser.uid),
            getSellerVerification(currentUser.uid),
            getUserSubscription(currentUser.uid)
          ]);
          setProducts(p); setServices(sv); setOrders(o); setWallet(w);
          setVerification(ver); setSubscription(sub);
        }
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    load();
  }, [currentUser, isSeller]);

  const handleBecomeSeller = async () => {
    if (!currentUser.emailVerified) return toast.error("Please verify your email first");
    setBecomingLoading(true);
    try {
      await updateUserDoc(currentUser.uid, { isSeller: true, sellerSince: new Date().toISOString() });
      await createNotification(currentUser.uid, {
        title: "Welcome, Seller!",
        body: "Your seller account is active. Create your first listing to get started.",
        type: "system"
      });
      toast.success("Seller account activated!");
      window.location.reload();
    } catch (e) { toast.error("Failed. Try again."); }
    setBecomingLoading(false);
  };

  const handleApplyVerification = async () => {
    if (!settings.sellerVerificationFee) return;
    try {
      const wallet = await getWallet(currentUser.uid);
      if (wallet.balance < settings.sellerVerificationFee) {
        return toast.error(`Insufficient balance. Verification fee: GHS ${settings.sellerVerificationFee}`);
      }
      await debitWallet(currentUser.uid, settings.sellerVerificationFee, "Seller verification fee");
      await applyForSellerVerification(currentUser.uid, {
        businessName: userDoc.displayName,
        email: userDoc.email,
        phone: userDoc.phone,
        feePaid: settings.sellerVerificationFee
      });
      setVerification({ status: "pending" });
      toast.success("Verification request submitted!");
    } catch (e) { toast.error(e.message || "Failed to apply"); }
  };

  if (loading) return <Spinner center />;

  // Not a seller
  if (!isSeller) {
    return (
      <div className="page-wrapper">
        <div className="container" style={{ paddingTop: 40, maxWidth: 600 }}>
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>🏪</div>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 800, marginBottom: 12 }}>
              Become a Seller on ASVAN
            </h1>
            <p style={{ color: "var(--text-secondary)", fontSize: 16, lineHeight: 1.7 }}>
              Join thousands of sellers and reach buyers across Ghana. List products, offer services, and grow your business.
            </p>
          </div>
          {!currentUser.emailVerified && (
            <Alert type="warning">You must verify your email before becoming a seller.</Alert>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 32 }}>
            {[
              { icon: "📦", title: "List Products", desc: "Sell physical or digital products" },
              { icon: "🛠", title: "Offer Services", desc: "Offer your skills and expertise" },
              { icon: "🔒", title: "Escrow Protected", desc: "All payments secured in escrow" },
              { icon: "💰", title: "Instant Wallet", desc: "Get paid directly to your wallet" },
            ].map(f => (
              <div key={f.title} className="card" style={{ padding: 18 }}>
                <div style={{ fontSize: 28, marginBottom: 6 }}>{f.icon}</div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{f.title}</div>
                <div style={{ fontSize: 13, color: "var(--text-muted)" }}>{f.desc}</div>
              </div>
            ))}
          </div>
          <Button variant="primary" full size="lg" loading={becomingLoading} onClick={handleBecomeSeller}>
            Activate Seller Account (Free)
          </Button>
        </div>
      </div>
    );
  }

  const totalRevenue = orders.filter(o => o.status === "completed").reduce((a, o) => a + (o.amount - (o.commission || 0)), 0);
  const pendingOrders = orders.filter(o => o.status === "paid").length;
  const completedOrders = orders.filter(o => o.status === "completed").length;

  const TABS = [
    { value: "overview", label: "Overview" },
    { value: "products", label: `Products (${products.length})` },
    { value: "services", label: `Services (${services.length})` },
    { value: "orders", label: `Orders (${orders.length})` },
    { value: "verification", label: "Verification" },
  ];

  return (
    <div className="page-wrapper">
      <div className="container" style={{ paddingTop: 28 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <h1 style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 800 }}>Seller Dashboard</h1>
              {isVerifiedSeller && <Badge type="primary">✓ Verified</Badge>}
            </div>
            <p style={{ color: "var(--text-muted)", fontSize: 14, marginTop: 4 }}>Welcome back, {userDoc?.displayName?.split(" ")[0]}</p>
          </div>
        </div>

        <Tabs tabs={TABS} active={tab} onChange={setTab} />

        {/* OVERVIEW */}
        {tab === "overview" && (
          <div>
            <div className="grid grid-4" style={{ gap: 16, marginBottom: 28 }}>
              <StatCard icon="💰" label="Total Revenue" value={`GHS ${totalRevenue.toFixed(0)}`} color="#10B981" />
              <StatCard icon="📦" label="Products Listed" value={products.length} color="#4F7CFF" />
              <StatCard icon="📋" label="Pending Orders" value={pendingOrders} color="#F59E0B" />
              <StatCard icon="✓" label="Completed Orders" value={completedOrders} color="#10B981" />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              <div className="card">
                <div style={{ fontWeight: 700, marginBottom: 12 }}>💰 Wallet Balance</div>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 800, color: "var(--accent)" }}>
                  GHS {wallet?.balance?.toFixed(2) || "0.00"}
                </div>
                <Button variant="outline" size="sm" style={{ marginTop: 12 }} onClick={() => navigate("/wallet")}>
                  Manage Wallet
                </Button>
              </div>
              <div className="card">
                <div style={{ fontWeight: 700, marginBottom: 12 }}>⚡ Quick Actions</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <Button variant="primary" size="sm" full onClick={() => setTab("products")}>+ Add Product</Button>
                  <Button variant="secondary" size="sm" full onClick={() => setTab("services")}>+ Add Service</Button>
                  <Button variant="secondary" size="sm" full onClick={() => navigate("/requests")}>Browse Requests</Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PRODUCTS */}
        {tab === "products" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
              <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700 }}>My Products</h3>
              <Button variant="primary" size="sm" onClick={() => { setEditItem(null); setShowProductForm(true); }}>+ Add Product</Button>
            </div>
            {products.length === 0 ? (
              <EmptyState icon="📦" title="No products yet" description="Create your first product listing" action={<Button variant="primary" onClick={() => setShowProductForm(true)}>Add Product</Button>} />
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead><tr><th>Title</th><th>Price</th><th>Category</th><th>Status</th><th>Actions</th></tr></thead>
                  <tbody>
                    {products.map(p => (
                      <tr key={p.id}>
                        <td style={{ fontWeight: 600, maxWidth: 200 }}><div className="truncate">{p.title}</div></td>
                        <td><PriceTag amount={p.price} size="sm" /></td>
                        <td><Badge type="muted">{p.category}</Badge></td>
                        <td><StatusBadge status={p.status} /></td>
                        <td>
                          <div style={{ display: "flex", gap: 6 }}>
                            <Button size="sm" variant="secondary" onClick={() => { setEditItem(p); setShowProductForm(true); }}>Edit</Button>
                            <Button size="sm" variant="danger" onClick={() => setDeleteConfirm({ id: p.id, type: "product", title: p.title })}>Del</Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* SERVICES */}
        {tab === "services" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
              <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700 }}>My Services</h3>
              <Button variant="primary" size="sm" onClick={() => { setEditItem(null); setShowServiceForm(true); }}>+ Add Service</Button>
            </div>
            {services.length === 0 ? (
              <EmptyState icon="🛠" title="No services yet" description="Create your first service listing" action={<Button variant="primary" onClick={() => setShowServiceForm(true)}>Add Service</Button>} />
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead><tr><th>Title</th><th>Price</th><th>Category</th><th>Status</th><th>Actions</th></tr></thead>
                  <tbody>
                    {services.map(s => (
                      <tr key={s.id}>
                        <td style={{ fontWeight: 600 }}><div className="truncate">{s.title}</div></td>
                        <td><PriceTag amount={s.price} size="sm" /></td>
                        <td><Badge type="muted">{s.category}</Badge></td>
                        <td><StatusBadge status={s.status} /></td>
                        <td>
                          <div style={{ display: "flex", gap: 6 }}>
                            <Button size="sm" variant="secondary" onClick={() => { setEditItem(s); setShowServiceForm(true); }}>Edit</Button>
                            <Button size="sm" variant="danger" onClick={() => setDeleteConfirm({ id: s.id, type: "service", title: s.title })}>Del</Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ORDERS */}
        {tab === "orders" && (
          <div>
            <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, marginBottom: 16 }}>My Sales</h3>
            {orders.length === 0 ? (
              <EmptyState icon="📋" title="No orders yet" description="Orders from buyers will appear here" />
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead><tr><th>Order</th><th>Item</th><th>Amount</th><th>Status</th><th>Date</th><th></th></tr></thead>
                  <tbody>
                    {orders.map(o => (
                      <tr key={o.id}>
                        <td style={{ fontFamily: "monospace", fontSize: 12 }}>#{o.id.slice(0, 8)}</td>
                        <td><div className="truncate" style={{ maxWidth: 150 }}>{o.itemTitle}</div></td>
                        <td><PriceTag amount={o.amount - (o.commission || 0)} size="sm" /></td>
                        <td><StatusBadge status={o.status} /></td>
                        <td style={{ fontSize: 13, color: "var(--text-muted)" }}>
                          {o.createdAt?.seconds ? new Date(o.createdAt.seconds * 1000).toLocaleDateString() : "—"}
                        </td>
                        <td><Button size="sm" variant="secondary" onClick={() => navigate(`/orders/${o.id}`)}>View</Button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* VERIFICATION */}
        {tab === "verification" && (
          <div style={{ maxWidth: 600 }}>
            <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, marginBottom: 16 }}>Seller Verification</h3>
            {isVerifiedSeller ? (
              <Alert type="success">🎉 You are a verified seller! Your listings show the verification badge.</Alert>
            ) : verification?.status === "pending" ? (
              <Alert type="warning">⏳ Your verification is under review. We'll notify you once approved.</Alert>
            ) : (
              <div>
                <div className="card" style={{ marginBottom: 20 }}>
                  <h4 style={{ fontWeight: 700, marginBottom: 12 }}>Benefits of Verification</h4>
                  {["✓ Verified badge on all your listings", "✓ Higher trust from buyers", "✓ Priority in search results", "✓ Access to premium features", "✓ Reduced admin scrutiny"].map(b => (
                    <div key={b} style={{ fontSize: 14, padding: "6px 0", borderBottom: "1px solid var(--surface-3)" }}>{b}</div>
                  ))}
                </div>
                <div className="card">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <div>
                      <div style={{ fontWeight: 700 }}>One-time Verification Fee</div>
                      <div style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 800, color: "var(--accent)" }}>
                        GHS {settings.sellerVerificationFee || 50}
                      </div>
                    </div>
                    <Badge type="success">One-time</Badge>
                  </div>
                  <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 16 }}>
                    Deducted from your wallet. Wallet balance: <strong>GHS {wallet?.balance?.toFixed(2) || 0}</strong>
                  </p>
                  <Button variant="primary" onClick={handleApplyVerification}>Apply for Verification</Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Product Form Modal */}
      <ListingFormModal
        isOpen={showProductForm}
        onClose={() => { setShowProductForm(false); setEditItem(null); }}
        type="product"
        categories={PRODUCT_CATS}
        editItem={editItem}
        uid={currentUser.uid}
        userDoc={userDoc}
        onSaved={async () => {
          setShowProductForm(false);
          setEditItem(null);
          const p = await getProducts({ sellerId: currentUser.uid });
          setProducts(p);
        }}
      />

      <ListingFormModal
        isOpen={showServiceForm}
        onClose={() => { setShowServiceForm(false); setEditItem(null); }}
        type="service"
        categories={SERVICE_CATS}
        editItem={editItem}
        uid={currentUser.uid}
        userDoc={userDoc}
        onSaved={async () => {
          setShowServiceForm(false);
          setEditItem(null);
          const s = await getServices({ sellerId: currentUser.uid });
          setServices(s);
        }}
      />

      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        danger
        title="Delete Listing"
        message={`Delete "${deleteConfirm?.title}"? This cannot be undone.`}
        confirmText="Delete"
        onConfirm={async () => {
          try {
            if (deleteConfirm.type === "product") { await deleteProduct(deleteConfirm.id); setProducts(prev => prev.filter(p => p.id !== deleteConfirm.id)); }
            else { await deleteService(deleteConfirm.id); setServices(prev => prev.filter(s => s.id !== deleteConfirm.id)); }
            toast.success("Deleted!");
          } catch (e) { toast.error("Delete failed"); }
          setDeleteConfirm(null);
        }}
      />
    </div>
  );
}

const ListingFormModal = ({ isOpen, onClose, type, categories, editItem, uid, userDoc, onSaved }) => {
  const ADMIN_EMAIL = "alecommerce123@gmail.com";

  const defaultForm = {
    title: "", description: "", price: "", category: categories[0],
    condition: "New", stock: "", location: "",
    images:   [],
    imageURL: "",
    videoURL: "",
    deliveryTime: "",
    deliveryFee:  "",
  };

  const [form,      setForm]      = useState(defaultForm);
  const [saving,    setSaving]    = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    if (editItem) {
      const existingImages =
        editItem.images?.filter(i => i.url).length > 0
          ? editItem.images.filter(i => i.url)
          : editItem.imageURL
            ? [{ url: editItem.imageURL, label: "" }]
            : [];
      setForm({
        ...defaultForm, ...editItem,
        price:       String(editItem.price  || ""),
        stock:       String(editItem.stock  || ""),
        images:      existingImages,
        videoURL:    editItem.videoURL    || "",
        deliveryFee: String(editItem.deliveryFee || ""),
      });
    } else {
      setForm(defaultForm);
    }
  }, [editItem, isOpen]);

  const validate = () => {
    if (!form.title.trim())       return "Product title is required";
    if (!form.description.trim()) return "Description is required";
    const price = parseFloat(form.price);
    if (!form.price || isNaN(price) || price <= 0) return "A valid price is required";
    if (type === "product" && form.images.filter(i => i.url).length === 0)
      return "At least one product photo is required. Please upload a photo before submitting.";
    return null;
  };

  const handleSubmit = async () => {
    if (uploading) { toast.error("Please wait for the photo upload to finish before submitting."); return; }
    const err = validate();
    if (err) { toast.error(err); return; }

    setSaving(true);
    try {
      const validImages = form.images.filter(i => i.url);
      const data = {
        title:            form.title.trim(),
        description:      form.description.trim(),
        price:            parseFloat(form.price),
        category:         form.category,
        condition:        form.condition,
        stock:            parseInt(form.stock) || null,
        location:         form.location.trim(),
        videoURL:         form.videoURL.trim(),
        deliveryTime:     form.deliveryTime.trim(),
        deliveryFee:      parseFloat(form.deliveryFee) || 0,
        images:           validImages,
        imageURL:         validImages[0]?.url || "",
        sellerId:         uid,
        sellerName:       userDoc?.displayName || "",
        isSellerVerified: userDoc?.isSellerVerified || false,
        status:           editItem ? (editItem.status || "pending") : "pending",
      };

      if (editItem) {
        if (type === "product") await updateProduct(editItem.id, data);
        else                    await updateService(editItem.id, data);
        toast.success("Listing updated and resubmitted for review.");
      } else {
        if (type === "product") {
          await createProduct(data);
          try {
            await sendAnnouncementEmail(
              ADMIN_EMAIL, "ASVAN Admin",
              `New Product Awaiting Approval — "${data.title}"`,
              `Seller: ${userDoc?.displayName}\nProduct: ${data.title}\nCategory: ${data.category}\nPrice: GHS ${data.price.toFixed(2)}\nPhotos: ${validImages.length}\n\nLog in to /admin to approve or reject.`
            );
          } catch (emailErr) { console.warn("Admin email failed:", emailErr.message); }
          toast.success("Product submitted! Goes live once admin approves.");
        } else {
          await createService(data);
          toast.success("Service submitted for admin approval.");
        }
      }
      onSaved();
    } catch (e) { toast.error("Failed to save: " + e.message); }
    setSaving(false);
  };

  const f = k => ({ value: form[k], onChange: e => setForm(p => ({ ...p, [k]: e.target.value })) });
  const busy = saving || uploading;

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => { if (!busy) onClose(); }}
      title={`${editItem ? "Edit" : "Create"} ${type === "product" ? "Product" : "Service"}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button variant="primary" loading={saving} disabled={busy} onClick={handleSubmit}>
            {uploading ? "Waiting for upload…" : saving ? "Saving…" : editItem ? "Save Changes" : "Submit for Approval"}
          </Button>
        </>
      }
    >
      {!editItem && <Alert type="info">Your listing is reviewed by admin before going live. Photos are stored securely in the cloud.</Alert>}
      {uploading && <Alert type="warning" style={{ marginTop: 8 }}>Photo uploading — please wait before submitting.</Alert>}

      <FormInput label="Title *" placeholder={type === "product" ? "e.g. Samsung Galaxy A54" : "e.g. Logo Design"} {...f("title")} disabled={busy} />
      <FormTextarea label="Description *" placeholder="Describe the item clearly..." rows={4} {...f("description")} disabled={busy} />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <FormInput label="Price (GHS) *" type="number" placeholder="0.00" {...f("price")} disabled={busy} />
        <div className="form-group">
          <label className="form-label">Category</label>
          <select className="form-select" value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} disabled={busy}>
            {categories.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {type === "product" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div className="form-group">
            <label className="form-label">Condition</label>
            <select className="form-select" value={form.condition} onChange={e => setForm(p => ({ ...p, condition: e.target.value }))} disabled={busy}>
              {["New", "Used - Like New", "Used - Good", "Used - Fair"].map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <FormInput label="Stock" type="number" placeholder="Blank = unlimited" {...f("stock")} disabled={busy} />
        </div>
      )}

      {type === "service" && (
        <FormInput label="Delivery Time" placeholder="e.g. 3-5 days" {...f("deliveryTime")} disabled={busy} />
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <FormInput label="Location" placeholder="e.g. Accra" {...f("location")} disabled={busy} />
        <FormInput label="Delivery Fee (GHS)" type="number" placeholder="0 = free" {...f("deliveryFee")} disabled={busy} />
      </div>

      <div style={{ marginTop: 8 }}>
        {type === "product" ? (
          <CloudinaryUpload
            images={form.images}
            onChange={imgs => setForm(p => ({ ...p, images: imgs }))}
            maxImages={5}
            disabled={saving}
            folder="products"
            onUploadStart={() => setUploading(true)}
            onUploadEnd={() => setUploading(false)}
          />
        ) : (
          <ImageURLField
            label="Service Image"
            value={form.imageURL}
            onChange={url => setForm(p => ({ ...p, imageURL: url }))}
            disabled={busy}
          />
        )}
      </div>

      <div className="form-group" style={{ marginTop: 12 }}>
        <label className="form-label">Product Video <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>(optional)</span></label>
        <input className="form-input" type="url" value={form.videoURL} onChange={e => setForm(p => ({ ...p, videoURL: e.target.value }))} placeholder="https://youtube.com/watch?v=..." disabled={busy} />
        <span className="form-hint">Buyers see a Watch Video button on your product page</span>
      </div>
    </Modal>
  );
};

