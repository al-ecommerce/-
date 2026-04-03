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
import CloudinaryUpload from "../components/CloudinaryUpload";

const PRODUCT_CATS = ["Electronics","Fashion","Food","Auto","Property","Health","Education","Other"];
const SERVICE_CATS = ["Design","Development","Writing","Marketing","Tutoring","Legal","Finance","Health","Other"];

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
                      <div>{item.description}</div>

                      <PriceTag amount={item.price} size="sm" />

                      <StatusBadge status={item.status} />
                    </div>

                    {/* Actions */}
                    <div style={{ padding: 12 }}>
                      <Button onClick={() => {
                        setEditItem(item);
                        setEditType(tab === "products" ? "product" : "service");
                      }}>
                        Edit
                      </Button>

                      <Button
                        variant="danger"
                        onClick={() => setDeleteTarget({
                          id: item.id,
                          type: tab === "products" ? "product" : "service",
                          title: item.title
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

  const existingImages = item.images?.length
    ? item.images
    : item.imageURL
      ? [{ url: item.imageURL }]
      : [];

  const [form, setForm] = useState({
    title: item.title || "",
    description: item.description || "",
    price: String(item.price || ""),
    category: item.category || categories[0],
    condition: item.condition || "New",
    stock: String(item.stock || ""),
    location: item.location || "",
    images: existingImages,
  });

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const busy = saving || uploading;

  const f = k => ({
    value: form[k],
    onChange: e => setForm(p => ({ ...p, [k]: e.target.value }))
  });

  const handleSave = async () => {
    if (uploading) return toast.error("Wait for upload");

    const validImages = form.images.filter(i => i.url);

    const data = {
      ...form,
      price: parseFloat(form.price),
      stock: form.stock ? parseInt(form.stock) : null,
      imageURL: validImages[0]?.url || "",
      images: validImages,
      updatedAt: new Date(),
      ...(item.status === "rejected" ? { status: "pending" } : {})
    };

    setSaving(true);

    try {
      if (type === "product") {
        await updateProduct(item.id, data);
      } else {
        await updateService(item.id, data);
      }

      toast.success("Updated");
      onSaved();

    } catch (e) {
      toast.error("Failed");
    }

    setSaving(false);
  };

  return (
    <Modal
      isOpen
      onClose={() => !busy && onClose()}
      title="Edit Listing"
    >

      <FormInput label="Title" {...f("title")} />
      <FormTextarea label="Description" {...f("description")} />

      <FormInput label="Price" type="number" {...f("price")} />

      <CloudinaryUpload
        images={form.images}
        onChange={imgs => setForm(p => ({ ...p, images: imgs }))}
        onUploadStart={() => setUploading(true)}
        onUploadEnd={() => setUploading(false)}
      />

      <Button onClick={handleSave} disabled={busy}>
        Save
      </Button>

    </Modal>
  );
}