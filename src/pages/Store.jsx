import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getUserDoc, getProducts, getServices, getReviewsForTarget } from "../firebase/db";
import { ListingCard } from "../components/ListingCard";
import { Spinner, Button, Badge, StarRating, VerifiedBadge, EmptyState, Tabs, Avatar } from "../components/UI";

export default function StorePage() {
  const { uid } = useParams();
  const navigate = useNavigate();
  const [seller, setSeller] = useState(null);
  const [products, setProducts] = useState([]);
  const [services, setServices] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("products");

  useEffect(() => {
    const load = async () => {
      try {
        const [s, p, sv] = await Promise.all([
          getUserDoc(uid),
          getProducts({ sellerId: uid }),
          getServices({ sellerId: uid }),
        ]);
        if (!s || !s.isSeller) { navigate("/"); return; }
        setSeller(s); setProducts(p); setServices(sv);
        // Gather reviews for all listings
        const allIds = [...p.map(x => x.id), ...sv.map(x => x.id)];
        const reviewArrays = await Promise.all(allIds.slice(0, 10).map(id => getReviewsForTarget(id)));
        setReviews(reviewArrays.flat());
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    load();
  }, [uid]);

  if (loading) return <Spinner center />;
  if (!seller) return null;

  const avgRating = reviews.length ? (reviews.reduce((a, r) => a + r.rating, 0) / reviews.length).toFixed(1) : null;

  return (
    <div className="page-wrapper">
      {/* Store Banner */}
      <div style={{
        background: "linear-gradient(135deg, var(--primary), var(--primary-light))",
        padding: "40px 0 60px"
      }}>
        <div className="container">
          <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
            <Avatar name={seller.displayName} photoURL={seller.photoURL} size="xl" style={{ border: "4px solid rgba(255,255,255,0.2)" }} />
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <h1 style={{ fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 800, color: "#fff" }}>
                  {seller.displayName}'s Store
                </h1>
                {seller.isSellerVerified && (
                  <span style={{
                    background: "var(--accent)", color: "#fff",
                    padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 700
                  }}>✓ Verified Seller</span>
                )}
              </div>
              {seller.bio && <p style={{ color: "rgba(255,255,255,0.7)", marginTop: 6, fontSize: 14 }}>{seller.bio}</p>}
              <div style={{ display: "flex", gap: 20, marginTop: 12, flexWrap: "wrap" }}>
                <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 14 }}>
                  📦 <strong style={{ color: "#fff" }}>{products.length}</strong> Products
                </div>
                <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 14 }}>
                  🛠 <strong style={{ color: "#fff" }}>{services.length}</strong> Services
                </div>
                {avgRating && (
                  <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 14 }}>
                    ⭐ <strong style={{ color: "#fff" }}>{avgRating}</strong> Rating
                  </div>
                )}
                {seller.location && (
                  <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 14 }}>
                    📍 {seller.location}
                  </div>
                )}
              </div>
            </div>
            <Button
              variant="outline"
              style={{ color: "#fff", borderColor: "rgba(255,255,255,0.4)" }}
              onClick={() => navigate(`/chat?with=${uid}`)}
            >
              💬 Message Seller
            </Button>
          </div>
        </div>
      </div>

      <div className="container" style={{ paddingTop: 28 }}>
        <Tabs
          tabs={[
            { value: "products", label: `Products (${products.length})` },
            { value: "services", label: `Services (${services.length})` },
            { value: "reviews", label: `Reviews (${reviews.length})` },
          ]}
          active={tab}
          onChange={setTab}
        />

        {tab === "products" && (
          products.length === 0
            ? <EmptyState icon="📦" title="No products listed" description="This seller hasn't listed any products yet." />
            : <div className="grid grid-4" style={{ gap: 16 }}>
                {products.map(p => <ListingCard key={p.id} item={p} type="product" />)}
              </div>
        )}

        {tab === "services" && (
          services.length === 0
            ? <EmptyState icon="🛠" title="No services listed" description="This seller hasn't listed any services yet." />
            : <div className="grid grid-4" style={{ gap: 16 }}>
                {services.map(s => <ListingCard key={s.id} item={s} type="service" />)}
              </div>
        )}

        {tab === "reviews" && (
          reviews.length === 0
            ? <EmptyState icon="⭐" title="No reviews yet" description="Be the first to leave a review after purchasing." />
            : <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {reviews.map(r => (
                  <div key={r.id} className="card" style={{ padding: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                      <span style={{ fontWeight: 600 }}>{r.reviewerName || "Anonymous"}</span>
                      <StarRating value={r.rating} readonly />
                    </div>
                    <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6 }}>{r.comment}</p>
                    <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 8 }}>
                      {r.createdAt?.seconds ? new Date(r.createdAt.seconds * 1000).toLocaleDateString() : ""}
                    </div>
                  </div>
                ))}
              </div>
        )}
      </div>
    </div>
  );
}
