import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "./../firebase/config";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  updateProduct, updateService,
  deleteProduct, deleteService,
} from "../firebase/db";
import {
  Spinner, Button, PageHeader, StatusBadge,
  Modal, FormInput, FormTextarea, Alert, ConfirmDialog,
  Tabs, EmptyState, PriceTag, toast,
} from "../components/UI";
import ImageURLField from "../components/ImageURLField";
import CloudinaryUpload from "../components/CloudinaryUpload";

const PRODUCT_CATS = ["Electronics","Fashion","Food","Auto","Property","Health","Education","Other"];
const SERVICE_CATS = ["Design","Development","Writing","Marketing","Tutoring","Legal","Finance","Health","Other"];

const PRICING_TYPES = [
  { value: "fixed",      label: "Fixed Price" },
  { value: "negotiable", label: "Negotiable" },
  { value: "starting",   label: "Starting From" },
  { value: "per_hour",   label: "Per Hour" },
  { value: "per_day",    label: "Per Day" },
  { value: "per_unit",   label: "Per Unit" },
  { value: "free",       label: "Free" },
];

const DELIVERY_METHODS = [
  { value: "pickup",   label: "Pickup Only" },
  { value: "delivery", label: "Delivery Only" },
  { value: "both",     label: "Both Pickup & Delivery" },
];

export default function MyListings() {
  const { currentUser, isSeller } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab] = useState("products");
  const [products, setProducts] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editItem, setEditItem] = useState(null);
  const [editType, setEditType] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    if (!currentUser) return navigate("/login");
    if (!isSeller) return navigate("/seller-dashboard");
    load();
  }, [currentUser, isSeller]);

  const load = async () => {
    setLoading(true);
    try {
      const pAll = await getDocs(query(
        collection(db, "products"),
        where("sellerId", "==", currentUser.uid)
      ));
      const sAll = await getDocs(query(
        collection(db, "services"),
        where("sellerId", "==", currentUser.uid)
      ));
      setProducts(pAll.docs.map(d => ({ id: d.id, ...d.data() })));
      setServices(sAll.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.type === "product") {
        await deleteProduct(deleteTarget.id);
      } else {
        await deleteService(deleteTarget.id);
      }
      toast.success("Listing deleted");
      load();
    } catch {
      toast.error("Delete failed");
    }
    setDeleteTarget(null);
  };

  if (!isSeller) return null;

  const list = tab === "products" ? products : services;

  return (
    <div className="page-wrapper">
      <div className="container" style={{ paddingTop: 28 }}>
        <PageHeader
          title="My Listings"
          subtitle="Edit, update, or delete your products and services"
          action={
            <Button onClick={() => navigate("/seller-dashboard")}>
              + Add New Listing
            </Button>
          }
        />

        <Tabs
          tabs={[
            { value: "products", label: `Products (${products.length})` },
            { value: "services", label: `Services (${services.length})` },
          ]}
          active={tab}
          onChange={setTab}
        />

        {loading ? <Spinner center /> : list.length === 0 ? (
          <EmptyState
            title={`No ${tab} yet`}
            description="Create your first listing"
          />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {list.map(item => {
              const thumbnail = item.images?.[0]?.url || item.imageURL;
              return (
                <div key={item.id} className="card">
                  <div style={{ display: "flex" }}>

                    {/* Image */}
                    <div style={{ width: 100 }}>
                      {thumbnail ? (
                        <img
                          src={thumbnail}
                          alt={item.title}
                          style={{ width: "100%", height: 100, objectFit: "cover" }}
                        />
                      ) : "📦"}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, padding: 12 }}>
                      <strong>{item.title}</strong>
                      <div style={{ fontSize: 13, color: "var(--text-muted)", margin: "4px 0" }}>
                        {item.description}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <PriceTag amount={item.price} size="sm" />
                        {item.pricingType && item.pricingType !== "fixed" && (
                          <span style={{
                            fontSize: 11,
                            background: "var(--surface-2)",
                            padding: "2px 7px",
                            borderRadius: 99,
                            color: "var(--text-muted)",
                            textTransform: "capitalize",
                          }}>
                            {PRICING_TYPES.find(p => p.value === item.pricingType)?.label || item.pricingType}
                          </span>
                        )}
                        <StatusBadge status={item.status} />
                      </div>
                    </div>

                    {/* Actions */}
                    <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 8 }}>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          setEditItem(item);
                          setEditType(tab === "products" ? "product" : "service");
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => setDeleteTarget({
                          id: item.id,
                          type: tab === "products" ? "product" : "service",
                          title: item.title,
                        })}
                      >
                        Delete
                      </Button>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {editItem && (
        <EditListingModal
          item={editItem}
          type={editType}
          categories={editType === "product" ? PRODUCT_CATS : SERVICE_CATS}
          onClose={() => setEditItem(null)}
          onSaved={() => { setEditItem(null); load(); }}
        />
      )}

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Listing"
        message={`Delete "${deleteTarget?.title}"?`}
      />
    </div>
  );
}


// ================= EDIT MODAL =================

function EditListingModal({ item, type, categories, onClose, onSaved }) {

  const existingImages =
    item.images?.filter(i => i.url).length > 0
      ? item.images.filter(i => i.url)
      : item.imageURL
        ? [{ url: item.imageURL, label: "" }]
        : [];

  const [form, setForm] = useState({
    title:          item.title          || "",
    description:    item.description    || "",
    price:          String(item.price   || ""),
    pricingType:    item.pricingType    || "fixed",
    category:       item.category       || categories[0],
    condition:      item.condition      || "New",
    stock:          String(item.stock   || ""),
    location:       item.location       || "",
    deliveryMethod: item.deliveryMethod || "both",
    deliveryFee:    String(item.deliveryFee || ""),
    deliveryTime:   item.deliveryTime   || "",
    videoURL:       item.videoURL       || "",
    imageURL:       item.imageURL       || "",
    images:         existingImages,
  });

  const [saving,    setSaving]    = useState(false);
  const [uploading, setUploading] = useState(false);

  const busy = saving || uploading;

  const f = k => ({
    value: form[k],
    onChange: e => setForm(p => ({ ...p, [k]: e.target.value })),
  });

  // Dynamic price label
  const priceLabel = {
    fixed:      "Price (GHS) *",
    negotiable: "Starting / Guide Price (GHS) *",
    starting:   "Starting From (GHS) *",
    per_hour:   "Rate per Hour (GHS) *",
    per_day:    "Rate per Day (GHS) *",
    per_unit:   "Price per Unit (GHS) *",
    free:       "",
  }[form.pricingType] || "Price (GHS) *";

  // Dynamic price placeholder
  const pricePlaceholder = {
    fixed:      "0.00",
    negotiable: "Enter guide price",
    starting:   "Minimum price",
    per_hour:   "0.00",
    per_day:    "0.00",
    per_unit:   "0.00",
    free:       "",
  }[form.pricingType] || "0.00";

  const showDeliveryFee =
    form.deliveryMethod === "delivery" || form.deliveryMethod === "both";

  const validate = () => {
    if (!form.title.trim())       return "Title is required";
    if (!form.description.trim()) return "Description is required";
    if (form.pricingType !== "free") {
      const price = parseFloat(form.price);
      if (!form.price || isNaN(price) || price <= 0) return "A valid price is required";
    }
    if (type === "product" && form.images.filter(i => i.url).length === 0)
      return "At least one product photo is required";
    return null;
  };

  const handleSave = async () => {
    if (uploading) return toast.error("Please wait for the upload to finish");
    const err = validate();
    if (err) return toast.error(err);

    const validImages = form.images.filter(i => i.url);

    const data = {
      title:          form.title.trim(),
      description:    form.description.trim(),
      price:          form.pricingType === "free" ? 0 : parseFloat(form.price),
      pricingType:    form.pricingType,
      category:       form.category,
      condition:      form.condition,
      stock:          form.stock ? parseInt(form.stock) : null,
      location:       form.location.trim(),
      deliveryMethod: form.deliveryMethod,
      deliveryTime:   form.deliveryTime.trim(),
      deliveryFee:    form.deliveryMethod === "pickup"
                        ? 0
                        : parseFloat(form.deliveryFee) || 0,
      videoURL:       form.videoURL.trim(),
      images:         validImages,
      imageURL:       validImages[0]?.url || "",
      updatedAt:      new Date(),
      // Re-submit for review if previously rejected
      ...(item.status === "rejected" ? { status: "pending" } : {}),
    };

    setSaving(true);
    try {
      if (type === "product") {
        await updateProduct(item.id, data);
      } else {
        await updateService(item.id, data);
      }
      toast.success("Listing updated and resubmitted for review.");
      onSaved();
    } catch (e) {
      toast.error("Failed to save: " + e.message);
    }
    setSaving(false);
  };

  return (
    <Modal
      isOpen
      onClose={() => !busy && onClose()}
      title={`Edit ${type === "product" ? "Product" : "Service"}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button variant="primary" loading={saving} disabled={busy} onClick={handleSave}>
            {uploading ? "Waiting for upload…" : saving ? "Saving…" : "Save Changes"}
          </Button>
        </>
      }
    >
      {item.status === "rejected" && (
        <Alert type="warning" style={{ marginBottom: 12 }}>
          This listing was rejected. Edit and save to resubmit for review.
        </Alert>
      )}
      {uploading && (
        <Alert type="warning" style={{ marginBottom: 8 }}>
          Photo uploading — please wait before saving.
        </Alert>
      )}

      {/* Title & Description */}
      <FormInput label="Title *" placeholder={type === "product" ? "e.g. Samsung Galaxy A54" : "e.g. Logo Design"} {...f("title")} disabled={busy} />
      <FormTextarea label="Description *" placeholder="Describe the item clearly..." rows={4} {...f("description")} disabled={busy} />

      {/* Pricing Type + Price */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div className="form-group">
          <label className="form-label">Pricing Type</label>
          <select
            className="form-select"
            value={form.pricingType}
            onChange={e => setForm(p => ({ ...p, pricingType: e.target.value }))}
            disabled={busy}
          >
            {PRICING_TYPES.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {form.pricingType !== "free" ? (
          <FormInput
            label={priceLabel}
            type="number"
            placeholder={pricePlaceholder}
            {...f("price")}
            disabled={busy}
          />
        ) : (
          <div style={{ display: "flex", alignItems: "flex-end", paddingBottom: 4 }}>
            <span style={{ fontSize: 13, color: "var(--text-muted)" }}>No price needed for free listings.</span>
          </div>
        )}
      </div>

      {/* Category */}
      <div className="form-group">
        <label className="form-label">Category</label>
        <select
          className="form-select"
          value={form.category}
          onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
          disabled={busy}
        >
          {categories.map(c => <option key={c}>{c}</option>)}
        </select>
      </div>

      {/* Condition + Stock (products only) */}
      {type === "product" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div className="form-group">
            <label className="form-label">Condition</label>
            <select
              className="form-select"
              value={form.condition}
              onChange={e => setForm(p => ({ ...p, condition: e.target.value }))}
              disabled={busy}
            >
              {["New", "Used - Like New", "Used - Good", "Used - Fair"].map(c => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
          <FormInput label="Stock" type="number" placeholder="Blank = unlimited" {...f("stock")} disabled={busy} />
        </div>
      )}

      {/* Delivery Time (services only) */}
      {type === "service" && (
        <FormInput label="Delivery Time" placeholder="e.g. 3-5 days" {...f("deliveryTime")} disabled={busy} />
      )}

      {/* Location + Delivery Method */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <FormInput label="Location" placeholder="e.g. Accra" {...f("location")} disabled={busy} />
        <div className="form-group">
          <label className="form-label">Delivery Method</label>
          <select
            className="form-select"
            value={form.deliveryMethod}
            onChange={e => setForm(p => ({ ...p, deliveryMethod: e.target.value }))}
            disabled={busy}
          >
            {DELIVERY_METHODS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Delivery Fee */}
      {showDeliveryFee && (
        <FormInput
          label="Delivery Fee (GHS)"
          type="number"
          placeholder="0 = free delivery"
          {...f("deliveryFee")}
          disabled={busy}
        />
      )}

      {/* Images */}
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

      {/* Video URL */}
      <div className="form-group" style={{ marginTop: 12 }}>
        <label className="form-label">
          Product Video{" "}
          <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>(optional)</span>
        </label>
        <input
          className="form-input"
          type="url"
          value={form.videoURL}
          onChange={e => setForm(p => ({ ...p, videoURL: e.target.value }))}
          placeholder="https://youtube.com/watch?v=..."
          disabled={busy}
        />
        <span className="form-hint">Buyers see a Watch Video button on your product page</span>
      </div>
    </Modal>
  );
}
