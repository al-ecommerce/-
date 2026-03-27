import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getProducts } from "../firebase/db";
import { useAuth } from "../context/AuthContext";
import { ListingCard } from "../components/ListingCard";
import { Spinner, Button, PageHeader, SearchBar, EmptyState, Alert } from "../components/UI";

const CATEGORIES = ["All", "Electronics", "Fashion", "Food", "Auto", "Property", "Services", "Education", "Health", "Other"];
const SORTS = [
  { value: "newest", label: "Newest First" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
];

export default function Products() {
  const { currentUser, isSeller } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState(params.get("category") || "All");
  const [sort, setSort] = useState("newest");

  const loadProducts = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getProducts({});   // fetch all approved, filter client-side
      setProducts(data);
    } catch (e) {
      console.error("Products load error:", e);
      setError("Could not load products. Please check your internet connection and try again.");
    }
    setLoading(false);
  };

  useEffect(() => { loadProducts(); }, []);

  const filtered = products
    .filter(p => category === "All" || p.category === category)
    .filter(p => !search || p.title?.toLowerCase().includes(search.toLowerCase()) || p.description?.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sort === "price_asc") return (a.price || 0) - (b.price || 0);
      if (sort === "price_desc") return (b.price || 0) - (a.price || 0);
      return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
    });

  return (
    <div className="page-wrapper">
      <div className="container" style={{ paddingTop: 28 }}>
        <PageHeader
          title="Products"
          subtitle={loading ? "Loading..." : `${filtered.length} listing${filtered.length !== 1 ? "s" : ""} available`}
          action={isSeller && (
            <Button variant="primary" onClick={() => navigate("/seller-dashboard?tab=products")}>+ Add Product</Button>
          )}
        />

        {error && (
          <Alert type="danger">
            {error} <button onClick={loadProducts} style={{ marginLeft: 8, background: "none", border: "none", color: "var(--danger)", fontWeight: 700, cursor: "pointer", textDecoration: "underline" }}>Retry</button>
          </Alert>
        )}

        {/* Filters */}
        <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 240px" }}>
            <SearchBar value={search} onChange={setSearch} placeholder="Search products..." />
          </div>
          <div style={{ flex: "0 0 180px" }}>
            <select className="form-select" value={sort} onChange={e => setSort(e.target.value)}>
              {SORTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
        </div>

        {/* Category Pills */}
        <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 16, marginBottom: 8 }}>
          {CATEGORIES.map(c => (
            <button key={c}
              onClick={() => setCategory(c)}
              style={{
                flexShrink: 0, padding: "6px 14px", borderRadius: 20,
                border: "1.5px solid " + (category === c ? "var(--accent)" : "var(--border)"),
                background: category === c ? "var(--accent-glow)" : "var(--surface)",
                color: category === c ? "var(--accent)" : "var(--text-secondary)",
                fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-body)"
              }}
            >{c}</button>
          ))}
        </div>

        {loading
          ? <Spinner center />
          : filtered.length > 0
            ? <div className="grid grid-4" style={{ gap: 16 }}>
                {filtered.map(p => <ListingCard key={p.id} item={p} type="product" />)}
              </div>
            : <EmptyState
                icon="📦"
                title={search || category !== "All" ? "No products match your filters" : "No products yet"}
                description={search || category !== "All" ? "Try a different search or category" : "Be the first to list a product on AlEcom"}
                action={search || category !== "All"
                  ? <Button variant="secondary" onClick={() => { setSearch(""); setCategory("All"); }}>Clear Filters</Button>
                  : isSeller && <Button variant="primary" onClick={() => navigate("/seller-dashboard?tab=products")}>Add First Product</Button>
                }
              />
        }
      </div>
    </div>
  );
}
