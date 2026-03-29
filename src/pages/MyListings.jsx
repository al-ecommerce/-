import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "./../firebase/config";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  getProducts, getServices,
  updateProduct, updateService,
  deleteProduct, deleteService,
} from "../firebase/db";
import {
  Spinner, Button, Badge, PageHeader, StatusBadge,
  Modal, FormInput, FormTextarea, Alert, ConfirmDialog,
  Tabs, EmptyState, PriceTag, toast,
} from "../components/UI";
import ImageURLField from "../components/ImageURLField";

const PRODUCT_CATS = ["Electronics","Fashion","Food","Auto","Property","Health","Education","Other"];
const SERVICE_CATS = ["Design","Development","Writing","Marketing","Tutoring","Legal","Finance","Health","Other"];

export default function MyListings() {
  const { currentUser, userDoc, isSeller } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState("products");
  const [products, setProducts] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editItem, setEditItem] = useState(null);   // item being edited
  const [editType, setEditType] = useState("");      // "product" | "service"
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    if (!currentUser) return navigate("/login");
    if (!isSeller)    return navigate("/seller-dashboard");
    load();
  }, [currentUser, isSeller]);

  const load = async () => {
    setLoading(true);
    try {
      const [p, s] = await Promise.all([
        getProducts({ sellerId: currentUser.uid }),
        getServices({ sellerId: currentUser.uid }),
      ]);
      // Also get pending ones (getProducts only returns approved, so fetch all)
      const pAll = await getDocs(query(collection(db, "products"), where("sellerId","==", currentUser.uid)));
      const sAll = await getDocs(query(collection(db, "services"), where("sellerId","==", currentUser.uid)));
      setProducts(pAll.docs.map(d => ({ id: d.id, ...d.data() })));
      setServices(sAll.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.type === "product") await deleteProduct(deleteTarget.id);
      else await deleteService(deleteTarget.id);
      toast.success("Listing deleted");
      load();
    } catch (e) { toast.error("Delete failed"); }
    setDeleteTarget(null);
  };

  if (!isSeller) return null;

  const TABS = [
    { value: "products", label: `Products (${products.length})` },
    { value: "services", label: `Services (${services.length})` },
  ];

  const list = tab === "products" ? products : services;

  return (
    <div className="page-wrapper">
      <div className="container" style={{ paddingTop: 28 }}>
        <PageHeader
          title="My Listings"
          subtitle="Edit, update, or delete your products and services"
          action={
            <Button variant="primary" onClick={() => navigate("/seller-dashboard")}>
              + Add New Listing
            </Button>
          }
        />

        <Tabs tabs={TABS} active={tab} onChange={setTab} />

        {loading ? <Spinner center /> : list.length === 0 ? (
          <EmptyState
            icon={tab === "products" ? "📦" : "🛠"}
            title={`No ${tab} yet`}
            description="Create your first listing from the Seller Dashboard"
            action={<Button variant="primary" onClick={() => navigate("/seller-dashboard")}>Go to Dashboard</Button>}
          />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {list.map(item => (
              <div key={item.id} className="card" style={{ padding: 0, overflow: "hidden" }}>
                <div style={{ display: "flex", gap: 0 }}>
                  {/* Image thumbnail */}
                  <div style={{
                    width: 100, flexShrink: 0,
                    background: item.imageURL ? "transparent" : "var(--surface-3)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 28,
                  }}>
                    {item.imageURL
                      ? <img src={item.imageURL} alt={item.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => { e.target.style.display="none"; }} />
                      : (tab === "products" ? "📦" : "🛠")
                    }
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, padding: "14px 16px", minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 15, fontFamily: "var(--font-display)" }} className="truncate">
                          {item.title}
                        </div>
                        <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }} className="truncate">
                          {item.description}
                        </div>
                      </div>
                      <StatusBadge status={item.status} />
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 10, flexWrap: "wrap" }}>
                      <PriceTag amount={item.price} size="sm" />
                      {item.category && <Badge type="muted">{item.category}</Badge>}
                      {item.condition && <Badge type="muted">{item.condition}</Badge>}
                      {item.location && <span style={{ fontSize: 12, color: "var(--text-muted)" }}>📍 {item.location}</span>}
                    </div>

                    {item.status === "pending" && (
                      <div style={{ fontSize: 12, color: "var(--warning)", marginTop: 8, fontWeight: 600 }}>
                        ⏳ Awaiting admin approval before going live
                      </div>
                    )}
                    {item.status === "rejected" && (
                      <div style={{ fontSize: 12, color: "var(--danger)", marginTop: 8, fontWeight: 600 }}>
                        ✕ Rejected by admin — edit and resubmit
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div style={{
                    display: "flex", flexDirection: "column", gap: 8,
                    padding: "14px 14px 14px 0", flexShrink: 0, justifyContent: "center",
                  }}>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => { setEditItem(item); setEditType(tab === "products" ? "product" : "service"); }}
                    >
                      ✏️ Edit
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => setDeleteTarget({ id: item.id, type: tab === "products" ? "product" : "service", title: item.title })}
                    >
                      🗑 Delete
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editItem && (
        <EditListingModal
          item={editItem}
          type={editType}
          categories={editType === "product" ? PRODUCT_CATS : SERVICE_CATS}
          onClose={() => setEditItem(null)}
          onSaved={() => { setEditItem(null); load(); }}
        />
      )}

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        danger
        title="Delete Listing"
        message={`Are you sure you want to permanently delete "${deleteTarget?.title}"? This cannot be undone.`}
        confirmText="Yes, Delete"
      />
    </div>
  );
}

// ── Edit Modal ──────────────────────────────────────────────
function EditListingModal({ item, type, categories, onClose, onSaved }) {
  // Build images array from existing data
  const existingImages = item.images?.filter(i => i.url)?.length > 0
    ? item.images.filter(i => i.url)
    : item.imageURL
      ? [{ url: item.imageURL, label: "" }]
      : [{ url: "", label: "" }];

  const [form, setForm] = useState({
    title:        item.title        || "",
    description:  item.description  || "",
    price:        item.price        || "",
    category:     item.category     || categories[0],
    condition:    item.condition    || "New",
    stock:        item.stock        || "",
    location:     item.location     || "",
    imageURL:     item.imageURL     || "",
    images:       existingImages,
    deliveryTime: item.deliveryTime || "",
  });
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!form.title || !form.description || !form.price) return toast.error("Title, description and price are required");
    const validImages = (form.images || []).filter(i => i.url?.trim());
    setLoading(true);
    try {
      const data = {
        ...form,
        price:    parseFloat(form.price),
        stock:    form.stock ? parseInt(form.stock) : null,
        imageURL: validImages[0]?.url || form.imageURL || "",
        images:   validImages,
        ...(item.status === "rejected" ? { status: "pending" } : {}),
      };
      if (type === "product") await updateProduct(item.id, data);
      else await updateService(item.id, data);
      toast.success("Listing updated successfully!");
      onSaved();
    } catch (e) { toast.error("Update failed — " + e.message); }
    setLoading(false);
  };

  const f = k => ({ value: form[k], onChange: e => setForm(p => ({ ...p, [k]: e.target.value })) });

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={`Edit ${type === "product" ? "Product" : "Service"}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" loading={loading} onClick={handleSave}>Save Changes</Button>
        </>
      }
    >
      {item.status === "rejected" && (
        <Alert type="warning">This listing was rejected. Fix the issues and save to resubmit for approval.</Alert>
      )}

      <FormInput label="Title *" {...f("title")} />
      <FormTextarea label="Description *" {...f("description")} rows={4} />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <FormInput label="Price (GHS) *" type="number" {...f("price")} />
        <div className="form-group">
          <label className="form-label">Category</label>
          <select className="form-select" value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
            {categories.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {type === "product" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div className="form-group">
            <label className="form-label">Condition</label>
            <select className="form-select" value={form.condition} onChange={e => setForm(p => ({ ...p, condition: e.target.value }))}>
              {["New","Used - Like New","Used - Good","Used - Fair"].map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <FormInput label="Stock" type="number" placeholder="Blank = unlimited" {...f("stock")} />
        </div>
      )}

      {type === "service" && <FormInput label="Delivery Time" placeholder="e.g. 2-3 days" {...f("deliveryTime")} />}

      <FormInput label="Location" placeholder="e.g. Accra, Ghana" {...f("location")} />

      {type === "product" ? (
        <ImageGalleryField
          images={form.images}
          onChange={imgs => setForm(p => ({ ...p, images: imgs }))}
        />
      ) : (
        <ImageURLField
          label="Service Image"
          value={form.imageURL}
          onChange={url => setForm(p => ({ ...p, imageURL: url }))}
        />
      )}
    </Modal>
  );
}
