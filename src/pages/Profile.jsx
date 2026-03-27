import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { updateUserDoc, getProducts, getServices, getReviews } from "../firebase/db";
import { deleteAccount } from "../firebase/auth";
import {
  Spinner, Button, Alert, FormInput, FormTextarea,
  Badge, toast, VerifiedBadge, Avatar, Modal
} from "../components/UI";

export default function Profile() {
  const { currentUser, userDoc, isSeller, isVerifiedSeller } = useAuth();
  const navigate = useNavigate();

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(false);

  const [products, setProducts] = useState([]);
  const [services, setServices] = useState([]);
  const [reviews, setReviews] = useState([]);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  // Redirect if not logged in
  useEffect(() => {
    if (!currentUser) return navigate("/login");
    if (userDoc) {
      setForm({
        displayName: userDoc.displayName || "",
        phone: userDoc.phone || "",
        bio: userDoc.bio || "",
        location: userDoc.location || "",
        photoURL: userDoc.photoURL || "",
      });
    }
  }, [currentUser, userDoc, navigate]);

  // Load seller data
  useEffect(() => {
    if (!currentUser || !isSeller) return;

    Promise.all([
      getProducts({ sellerId: currentUser.uid }),
      getServices({ sellerId: currentUser.uid }),
      getReviews({ sellerId: currentUser.uid }),
    ]).then(([p, s, r]) => {
      setProducts(p || []);
      setServices(s || []);
      setReviews(r || []);
    });
  }, [currentUser, isSeller]);

  const handleSave = async () => {
    setLoading(true);
    try {
      await updateUserDoc(currentUser.uid, form);
      toast.success("Profile updated!");
      setEditing(false);
    } catch (e) {
      toast.error("Update failed");
    }
    setLoading(false);
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      return setDeleteError("Please enter your password to confirm");
    }

    setDeleteLoading(true);
    setDeleteError("");

    try {
      await deleteAccount(deletePassword);
      toast.success("Account deleted.");
      navigate("/");
    } catch (e) {
      if (
        e.code === "auth/wrong-password" ||
        e.code === "auth/invalid-credential"
      ) {
        setDeleteError("Incorrect password. Please try again.");
      } else {
        setDeleteError(e.message || "Deletion failed. Try again.");
      }
    }

    setDeleteLoading(false);
  };

  if (!userDoc) return <Spinner center />;

  // Calculate average rating
  const avgRating =
    reviews.length > 0
      ? reviews.reduce((a, r) => a + (r.rating || 0), 0) / reviews.length
      : 0;

  return (
    <div className="page-wrapper">
      <div className="container" style={{ paddingTop: 28, maxWidth: 800 }}>
        {/* Header */}
        <div className="card" style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
            <Avatar
              name={userDoc.displayName}
              photoURL={userDoc.photoURL}
              size="xl"
            />

            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <h1 style={{ fontSize: 22, fontWeight: 800 }}>
                  {userDoc.displayName}
                </h1>
                {isVerifiedSeller && <VerifiedBadge />}
                {userDoc.isSuspended && (
                  <Badge type="danger">⚠ Suspended</Badge>
                )}
              </div>

              <div style={{ fontSize: 14 }}>{userDoc.email}</div>

              {userDoc.location && (
                <div style={{ fontSize: 14 }}>
                  📍 {userDoc.location}
                </div>
              )}

              {userDoc.bio && (
                <p style={{ fontSize: 14, marginTop: 8 }}>
                  {userDoc.bio}
                </p>
              )}

              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <Badge
                  type={
                    userDoc.role === "admin"
                      ? "danger"
                      : isSeller
                      ? "primary"
                      : "muted"
                  }
                >
                  {userDoc.role === "admin"
                    ? "⚙️ Admin"
                    : isSeller
                    ? "🏪 Seller"
                    : "👤 Buyer"}
                </Badge>

                {!currentUser.emailVerified && (
                  <Badge type="warning">⚠ Email not verified</Badge>
                )}
                {currentUser.emailVerified && (
                  <Badge type="success">✓ Verified Email</Badge>
                )}
              </div>
            </div>

            <Button
              variant={editing ? "secondary" : "outline"}
              size="sm"
              onClick={() => setEditing(!editing)}
            >
              {editing ? "Cancel" : "✏️ Edit Profile"}
            </Button>
          </div>

          {/* Edit Form */}
          {editing && (
            <div style={{ marginTop: 24 }}>
              <FormInput
                label="Display Name"
                value={form.displayName}
                onChange={(e) =>
                  setForm((p) => ({ ...p, displayName: e.target.value }))
                }
              />
              <FormInput
                label="Phone"
                value={form.phone}
                onChange={(e) =>
                  setForm((p) => ({ ...p, phone: e.target.value }))
                }
              />
              <FormInput
                label="Location"
                value={form.location}
                onChange={(e) =>
                  setForm((p) => ({ ...p, location: e.target.value }))
                }
              />
              <FormInput
                label="Photo URL"
                value={form.photoURL}
                onChange={(e) =>
                  setForm((p) => ({ ...p, photoURL: e.target.value }))
                }
              />
              <FormTextarea
                label="Bio"
                value={form.bio}
                onChange={(e) =>
                  setForm((p) => ({ ...p, bio: e.target.value }))
                }
              />

              <Button
                variant="primary"
                loading={loading}
                onClick={handleSave}
              >
                Save Changes
              </Button>
            </div>
          )}
        </div>

        {/* Seller Stats */}
        {isSeller && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 16,
              marginBottom: 24,
            }}
          >
            <div className="card" style={{ textAlign: "center" }}>
              <div style={{ fontSize: 28 }}>📦</div>
              <div style={{ fontSize: 24, fontWeight: 800 }}>
                {products.length}
              </div>
              <div>Products</div>
            </div>

            <div className="card" style={{ textAlign: "center" }}>
              <div style={{ fontSize: 28 }}>🛠</div>
              <div style={{ fontSize: 24, fontWeight: 800 }}>
                {services.length}
              </div>
              <div>Services</div>
            </div>

            <div className="card" style={{ textAlign: "center" }}>
              <div style={{ fontSize: 28 }}>⭐</div>
              <div style={{ fontSize: 24, fontWeight: 800 }}>
                {avgRating > 0 ? avgRating.toFixed(1) : "N/A"}
              </div>
              <div>Rating</div>
            </div>
          </div>
        )}

        {/* Danger Zone */}
        <div style={{ border: "1.5px solid red", padding: 20 }}>
          <h3 style={{ color: "red" }}>⚠ Danger Zone</h3>
          <Button
            variant="danger"
            size="sm"
            onClick={() => setShowDeleteModal(true)}
          >
            Delete My Account
          </Button>
        </div>
      </div>

      {/* Delete Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Account"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setShowDeleteModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              loading={deleteLoading}
              onClick={handleDeleteAccount}
            >
              Permanently Delete
            </Button>
          </>
        }
      >
        <Alert type="danger">
          This action cannot be undone.
        </Alert>

        {deleteError && <Alert type="danger">{deleteError}</Alert>}

        <FormInput
          label="Current Password"
          type="password"
          value={deletePassword}
          onChange={(e) => setDeletePassword(e.target.value)}
        />
      </Modal>
    </div>
  );
}