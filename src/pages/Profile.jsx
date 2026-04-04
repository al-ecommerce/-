import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { updateUserDoc, getProducts, getServices } from "../firebase/db";
import { deleteAccount } from "../firebase/auth";
import { Spinner, Button, Alert, FormInput, FormTextarea, PageHeader, Badge, StarRating, toast, VerifiedBadge, Avatar, Modal } from "../components/UI";

// ─── GHANA REGIONS ────────────────────────────────────────
const GHANA_REGIONS = [
  "Greater Accra", "Ashanti", "Western", "Eastern", "Central",
  "Northern", "Upper East", "Upper West", "Volta", "Brong-Ahafo",
  "Oti", "Bono East", "Ahafo", "Savannah", "North East", "Western North",
];

export default function Profile() {
  const { currentUser, userDoc, isSeller, isVerifiedSeller } = useAuth();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [services, setServices] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    if (!currentUser) return navigate("/login");
    if (userDoc) setForm({
      displayName: userDoc.displayName || "",
      phone:       userDoc.phone       || "",
      whatsapp:    userDoc.whatsapp    || "",
      bio:         userDoc.bio         || "",
      region:      userDoc.region      || "",
      city:        userDoc.city        || "",
      address:     userDoc.address     || "",
      photoURL:    userDoc.photoURL    || "",
    });
  }, [userDoc]);

  useEffect(() => {
    if (!currentUser || !isSeller) return;
    Promise.all([
      getProducts({ sellerId: currentUser.uid }),
      getServices({ sellerId: currentUser.uid }),
    ]).then(([p, s]) => { setProducts(p); setServices(s); });
  }, [currentUser, isSeller]);

  const handleSave = async () => {
    if (!form.displayName.trim()) return toast.error("Display name is required");
    setLoading(true);
    try {
      await updateUserDoc(currentUser.uid, {
        displayName: form.displayName.trim(),
        phone:       form.phone.trim(),
        whatsapp:    form.whatsapp.trim(),
        bio:         form.bio.trim(),
        region:      form.region,
        city:        form.city.trim(),
        address:     form.address.trim(),
        photoURL:    form.photoURL.trim(),
      });
      toast.success("Profile updated!");
      setEditing(false);
    } catch (e) { toast.error("Update failed"); }
    setLoading(false);
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) return setDeleteError("Please enter your password to confirm");
    setDeleteLoading(true);
    setDeleteError("");
    try {
      await deleteAccount(deletePassword);
      navigate("/");
      toast.success("Account deleted.");
    } catch (e) {
      if (e.code === "auth/wrong-password" || e.code === "auth/invalid-credential") {
        setDeleteError("Incorrect password. Please try again.");
      } else {
        setDeleteError(e.message || "Deletion failed. Try again.");
      }
    }
    setDeleteLoading(false);
  };

  if (!userDoc) return <Spinner center />;

  // Derived location string for display
  const locationParts = [userDoc.city, userDoc.region].filter(Boolean);
  const locationDisplay = locationParts.length ? locationParts.join(", ") : userDoc.location || null;

  return (
    <div className="page-wrapper">
      <div className="container" style={{ paddingTop: 28, maxWidth: 800 }}>

        {/* ── Header card ── */}
        <div className="card" style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 20, flexWrap: "wrap" }}>
            <Avatar name={userDoc.displayName} photoURL={userDoc.photoURL} size="xl" />
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <h1 style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 800 }}>{userDoc.displayName}</h1>
                {isVerifiedSeller && <VerifiedBadge />}
                {userDoc.isSuspended && <Badge type="danger">⚠ Suspended</Badge>}
              </div>
              <div style={{ color: "var(--text-muted)", fontSize: 14, marginTop: 4 }}>{userDoc.email}</div>

              {/* Contact row */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 16, marginTop: 6 }}>
                {locationDisplay && (
                  <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>📍 {locationDisplay}</span>
                )}
                {userDoc.phone && (
                  <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>📞 {userDoc.phone}</span>
                )}
                {isSeller && userDoc.whatsapp && (
                  <a
                    href={`https://wa.me/${userDoc.whatsapp.replace(/^0/, "233").replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: 13, color: "#25D366", fontWeight: 600, textDecoration: "none" }}
                  >
                    💬 WhatsApp
                  </a>
                )}
              </div>

              {userDoc.address && (
                <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>🏠 {userDoc.address}</div>
              )}
              {userDoc.bio && (
                <p style={{ fontSize: 14, color: "var(--text-secondary)", marginTop: 8, lineHeight: 1.6 }}>{userDoc.bio}</p>
              )}

              <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
                <Badge type={userDoc.role === "admin" ? "danger" : isSeller ? "primary" : "muted"}>
                  {userDoc.role === "admin" ? "⚙️ Admin" : isSeller ? "🏪 Seller" : "👤 Buyer"}
                </Badge>
                {!currentUser.emailVerified && <Badge type="warning">⚠ Email not verified</Badge>}
                {currentUser.emailVerified  && <Badge type="success">✓ Verified Email</Badge>}
              </div>
            </div>
            <Button variant={editing ? "secondary" : "outline"} size="sm" onClick={() => setEditing(!editing)}>
              {editing ? "Cancel" : "✏️ Edit Profile"}
            </Button>
          </div>

          {/* ── Edit form ── */}
          {editing && (
            <div style={{ marginTop: 24, paddingTop: 24, borderTop: "1px solid var(--border)" }}>

              {/* Personal */}
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 12 }}>Personal</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <FormInput label="Display Name *" value={form.displayName}
                  onChange={e => setForm(p => ({ ...p, displayName: e.target.value }))} />
                <FormInput label="Phone Number" type="tel" value={form.phone}
                  onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                  placeholder="024XXXXXXX" />
              </div>

              {/* WhatsApp — sellers only */}
              {isSeller && (
                <FormInput
                  label="WhatsApp Number"
                  type="tel"
                  value={form.whatsapp}
                  onChange={e => setForm(p => ({ ...p, whatsapp: e.target.value }))}
                  placeholder="024XXXXXXX"
                  hint="Shown to buyers as a contact link"
                />
              )}

              <FormInput
                label="Photo URL"
                value={form.photoURL}
                onChange={e => setForm(p => ({ ...p, photoURL: e.target.value }))}
                placeholder="https://i.imgur.com/yourphoto.jpg"
                hint="Paste any public image link for your profile photo"
              />
              <FormTextarea label="Bio" value={form.bio}
                onChange={e => setForm(p => ({ ...p, bio: e.target.value }))}
                placeholder="Tell people about yourself..." rows={3} />

              {/* Location */}
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.8px", margin: "16px 0 12px" }}>Location</div>
              <div className="form-group">
                <label className="form-label">Region</label>
                <select className="form-select" value={form.region}
                  onChange={e => setForm(p => ({ ...p, region: e.target.value }))}>
                  <option value="">-- Select region --</option>
                  {GHANA_REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <FormInput label="City / Town" value={form.city}
                  onChange={e => setForm(p => ({ ...p, city: e.target.value }))}
                  placeholder="e.g. Kumasi" />
                <FormInput label="Area / Landmark" value={form.address}
                  onChange={e => setForm(p => ({ ...p, address: e.target.value }))}
                  placeholder="e.g. Near Kejetia" />
              </div>

              <Button variant="primary" loading={loading} onClick={handleSave}>Save Changes</Button>
            </div>
          )}
        </div>

        {/* ── Email verification notice ── */}
        {!currentUser.emailVerified && (
          <Alert type="warning" style={{ marginBottom: 24 }}>
            Your email is not verified. Please check your inbox and verify your email to access all features.
          </Alert>
        )}

        {/* ── Seller stats ── */}
        {isSeller && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
            {[
              { label: "Products", value: products.length, icon: "📦" },
              { label: "Services", value: services.length, icon: "🛠" },
              { label: "Listings", value: products.length + services.length, icon: "📋" },
            ].map(s => (
              <div key={s.label} className="card" style={{ textAlign: "center" }}>
                <div style={{ fontSize: 28 }}>{s.icon}</div>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 800, marginTop: 6 }}>{s.value}</div>
                <div style={{ fontSize: 13, color: "var(--text-muted)" }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* ── Quick links ── */}
        <div className="card" style={{ marginBottom: 24 }}>
          <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, marginBottom: 16 }}>Quick Links</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {[
              { icon: "📦", label: "My Orders",     path: "/orders" },
              { icon: "💰", label: "Wallet",         path: "/wallet" },
              { icon: "🔒", label: "Escrow",         path: "/escrow" },
              { icon: "💬", label: "Messages",       path: "/chat" },
              { icon: "🔔", label: "Notifications",  path: "/notifications" },
              { icon: "📚", label: "User Manual",    path: "/manual" },
            ].map(l => (
              <button key={l.path} onClick={() => navigate(l.path)} style={{
                display: "flex", alignItems: "center", gap: 10, padding: "12px 14px",
                border: "1.5px solid var(--border)", borderRadius: "var(--radius-sm)",
                background: "var(--surface)", cursor: "pointer", textAlign: "left",
                fontFamily: "var(--font-body)", fontSize: 14, fontWeight: 600,
                transition: "all 0.2s",
              }}
                onMouseEnter={e => e.currentTarget.style.borderColor = "var(--accent)"}
                onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border)"}
              >
                <span style={{ fontSize: 20 }}>{l.icon}</span>
                {l.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Become seller CTA ── */}
        {!isSeller && (
          <div style={{
            background: "linear-gradient(135deg, var(--accent), #6B48FF)",
            borderRadius: "var(--radius-xl)", padding: "28px 24px", color: "#fff", marginBottom: 24,
          }}>
            <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 20, marginBottom: 8 }}>
              Start Selling on AlEcom
            </h3>
            <p style={{ opacity: 0.8, fontSize: 14, marginBottom: 16 }}>
              Reach thousands of buyers. List products and services with full escrow protection.
            </p>
            <Button variant="secondary" style={{ background: "#fff", color: "var(--accent)" }}
              onClick={() => navigate("/seller-dashboard")}>
              Become a Seller →
            </Button>
          </div>
        )}

        {/* ── Danger zone ── */}
        <div style={{ border: "1.5px solid var(--danger)", borderRadius: "var(--radius-lg)", padding: "20px 22px" }}>
          <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 16, color: "var(--danger)", marginBottom: 8 }}>
            ⚠ Danger Zone
          </h3>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 16, lineHeight: 1.6 }}>
            Permanently delete your account and all associated data. This action <strong>cannot be undone</strong>. Your wallet balance, listings, order history, and messages will all be removed.
          </p>
          <Button variant="danger" size="sm" onClick={() => setShowDeleteModal(true)}>
            Delete My Account
          </Button>
        </div>
      </div>

      {/* ── Delete account modal ── */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => { setShowDeleteModal(false); setDeletePassword(""); setDeleteError(""); }}
        title="Delete Account"
        footer={
          <>
            <Button variant="secondary" onClick={() => { setShowDeleteModal(false); setDeletePassword(""); setDeleteError(""); }}>Cancel</Button>
            <Button variant="danger" loading={deleteLoading} onClick={handleDeleteAccount}>
              Permanently Delete
            </Button>
          </>
        }
      >
        <Alert type="danger">
          This will permanently delete your account, all your listings, wallet balance, and data. This cannot be reversed.
        </Alert>
        <p style={{ fontSize: 14, color: "var(--text-secondary)", margin: "16px 0" }}>
          To confirm, please enter your current password:
        </p>
        {deleteError && <Alert type="danger">{deleteError}</Alert>}
        <FormInput
          label="Current Password"
          type="password"
          value={deletePassword}
          onChange={e => setDeletePassword(e.target.value)}
          placeholder="Enter your password"
        />
      </Modal>
    </div>
  );
}
