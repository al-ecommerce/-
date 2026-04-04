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
import {
  Spinner, Button, Alert, Badge, Tabs,
  PriceTag, Modal, FormInput, FormTextarea,
  EmptyState, ConfirmDialog, toast
} from "../components/UI";
import CloudinaryUpload from "../components/CloudinaryUpload";

const PRODUCT_CATS = ["Electronics", "Fashion", "Food", "Auto", "Property", "Health", "Education", "Other"];
const SERVICE_CATS = ["Design", "Development", "Writing", "Marketing", "Tutoring", "Legal", "Finance", "Health", "Other"];

export default function SellerDashboard() {
  const { currentUser, userDoc, isSeller } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const params = new URLSearchParams(location.search);
  const [tab, setTab] = useState(params.get("tab") || "overview");

  const [products, setProducts] = useState([]);
  const [services, setServices] = useState([]);
  const [orders, setOrders] = useState([]);
  const [wallet, setWallet] = useState(null);
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);

  const [showProductForm, setShowProductForm] = useState(false);
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    if (!currentUser) return navigate("/login");

    const load = async () => {
      const s = await getPlatformSettings();
      setSettings(s);

      if (isSeller) {
        const [p, sv, o, w] = await Promise.all([
          getProducts({ sellerId: currentUser.uid }),
          getServices({ sellerId: currentUser.uid }),
          getSellerOrders(currentUser.uid),
          getWallet(currentUser.uid),
        ]);

        setProducts(p);
        setServices(sv);
        setOrders(o);
        setWallet(w);
      }

      setLoading(false);
    };

    load();
  }, [currentUser, isSeller]);

  if (loading) return <Spinner center />;

  if (!isSeller) {
    return (
      <div className="container" style={{ paddingTop: 40 }}>
        <h2>Become a Seller</h2>
        <Button onClick={async () => {
          await updateUserDoc(currentUser.uid, { isSeller: true });
          window.location.reload();
        }}>
          Activate Seller
        </Button>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingTop: 20 }}>
      <Tabs
        tabs={[
          { value: "products", label: "Products" },
          { value: "services", label: "Services" },
          { value: "orders", label: "Orders" },
        ]}
        active={tab}
        onChange={setTab}
      />

      {/* PRODUCTS */}
      {tab === "products" && (
        <>
          <Button onClick={() => { setEditItem(null); setShowProductForm(true); }}>
            + Add Product
          </Button>

          {products.length === 0 ? (
            <EmptyState title="No products" />
          ) : (
            products.map(p => (
              <div key={p.id} className="card" style={{ marginTop: 10 }}>
                <b>{p.title}</b>
                <div>
                  {p.pricingOptions?.[0]?.price
                    ? <PriceTag amount={p.pricingOptions[0].price} />
                    : <PriceTag amount={p.price} />}
                </div>
                <Button onClick={() => { setEditItem(p); setShowProductForm(true); }}>Edit</Button>
                <Button variant="danger" onClick={() => setDeleteConfirm({ id: p.id, type: "product" })}>
                  Delete
                </Button>
              </div>
            ))
          )}
        </>
      )}

      {/* SERVICES */}
      {tab === "services" && (
        <>
          <Button onClick={() => { setEditItem(null); setShowServiceForm(true); }}>
            + Add Service
          </Button>

          {services.map(s => (
            <div key={s.id} className="card">
              <b>{s.title}</b>
              <Button onClick={() => { setEditItem(s); setShowServiceForm(true); }}>Edit</Button>
            </div>
          ))}
        </>
      )}

      {/* ORDERS */}
      {tab === "orders" && (
        orders.map(o => (
          <div key={o.id} className="card">
            {o.itemTitle} - GHS {o.amount}
          </div>
        ))
      )}

      {/* MODALS */}
      <ListingFormModal
        isOpen={showProductForm}
        onClose={() => setShowProductForm(false)}
        type="product"
        categories={PRODUCT_CATS}
        editItem={editItem}
        uid={currentUser.uid}
        userDoc={userDoc}
        onSaved={async () => {
          const p = await getProducts({ sellerId: currentUser.uid });
          setProducts(p);
          setShowProductForm(false);
        }}
      />

      <ListingFormModal
        isOpen={showServiceForm}
        onClose={() => setShowServiceForm(false)}
        type="service"
        categories={SERVICE_CATS}
        editItem={editItem}
        uid={currentUser.uid}
        userDoc={userDoc}
        onSaved={async () => {
          const s = await getServices({ sellerId: currentUser.uid });
          setServices(s);
          setShowServiceForm(false);
        }}
      />

      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={async () => {
          if (deleteConfirm.type === "product") {
            await deleteProduct(deleteConfirm.id);
            setProducts(prev => prev.filter(p => p.id !== deleteConfirm.id));
          } else {
            await deleteService(deleteConfirm.id);
          }
          setDeleteConfirm(null);
        }}
      />
    </div>
  );
}

/* ========================= */
/* FORM MODAL (UPGRADED) */
/* ========================= */

const ListingFormModal = ({ isOpen, onClose, type, categories, editItem, uid, userDoc, onSaved }) => {
  const defaultForm = {
    title: "",
    description: "",
    category: categories[0],
    images: [],
    pricingOptions: [{ label: "Standard", price: "" }],
    deliveryOptions: [{ method: "Standard", fee: "", estimatedDays: "" }],
  };

  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    if (editItem) {
      setForm({
        ...defaultForm,
        ...editItem,
        pricingOptions: editItem.pricingOptions || [{ label: "Standard", price: editItem.price }],
        deliveryOptions: editItem.deliveryOptions || [{ method: "Standard", fee: 0, estimatedDays: 3 }],
      });
    } else {
      setForm(defaultForm);
    }
  }, [editItem, isOpen]);

  const validate = () => {
    if (!form.title) return "Title required";

    if (form.pricingOptions.some(p => !p.price)) {
      return "Invalid pricing";
    }

    return null;
  };

  const handleSubmit = async () => {
    const err = validate();
    if (err) return toast.error(err);

    setSaving(true);

    const data = {
      ...form,
      pricingOptions: form.pricingOptions.map(p => ({
        label: p.label,
        price: parseFloat(p.price)
      })),
      deliveryOptions: form.deliveryOptions.map(d => ({
        method: d.method,
        fee: parseFloat(d.fee) || 0,
        estimatedDays: parseInt(d.estimatedDays) || 0
      })),
      price: parseFloat(form.pricingOptions[0].price),
      sellerId: uid,
    };

    if (editItem) {
      type === "product"
        ? await updateProduct(editItem.id, data)
        : await updateService(editItem.id, data);
    } else {
      type === "product"
        ? await createProduct(data)
        : await createService(data);
    }

    setSaving(false);
    onSaved();
  };

  const updatePricing = (i, key, value) => {
    const updated = [...form.pricingOptions];
    updated[i][key] = value;
    setForm({ ...form, pricingOptions: updated });
  };

  const updateDelivery = (i, key, value) => {
    const updated = [...form.deliveryOptions];
    updated[i][key] = value;
    setForm({ ...form, deliveryOptions: updated });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Listing">
      <FormInput label="Title" value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
      <FormTextarea label="Description" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />

      <h4>Pricing</h4>
      {form.pricingOptions.map((p, i) => (
        <div key={i}>
          <input value={p.label} onChange={e => updatePricing(i, "label", e.target.value)} />
          <input type="number" value={p.price} onChange={e => updatePricing(i, "price", e.target.value)} />
        </div>
      ))}
      <Button onClick={() => setForm({...form, pricingOptions: [...form.pricingOptions, { label: "", price: "" }]})}>
        Add Pricing
      </Button>

      <h4>Delivery</h4>
      {form.deliveryOptions.map((d, i) => (
        <div key={i}>
          <input value={d.method} onChange={e => updateDelivery(i, "method", e.target.value)} />
          <input type="number" value={d.fee} onChange={e => updateDelivery(i, "fee", e.target.value)} />
          <input type="number" value={d.estimatedDays} onChange={e => updateDelivery(i, "estimatedDays", e.target.value)} />
        </div>
      ))}
      <Button onClick={() => setForm({...form, deliveryOptions: [...form.deliveryOptions, { method: "", fee: "", estimatedDays: "" }]})}>
        Add Delivery
      </Button>

      <Button loading={saving} onClick={handleSubmit}>
        Save
      </Button>
    </Modal>
  );
};