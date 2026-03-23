import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getProducts } from "../firebase/db";
import { useAuth } from "../context/AuthContext";
import { ListingCard } from "../components/ListingCard";
import { Spinner, Button, PageHeader, SearchBar, FormSelect, EmptyState } from "../components/UI";

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
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState(params.get("category") || "All");
  const [sort, setSort] = useState("newest");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const filters = {};
        if (category !== "All") filters.category = category;
        const data = await getProducts(filters);
        setProducts(data);
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    load();
  }, [category]);

  const filtered = products
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
          subtitle={`${filtered.length} listings available`}
          action={isSeller && (
            <Button variant="primary" onClick={() => navigate("/seller-dashboard?tab=products")}>+ Add Product</Button>
          )}
        />

        {/* Filters */}
        <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 240px" }}>
            <SearchBar value={search} onChange={setSearch} placeholder="Search products..." />
          </div>
          <div style={{ flex: "0 0 160px" }}>
            <select className="form-select" value={category} onChange={e => setCategory(e.target.value)}>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
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
            : <EmptyState icon="📦" title="No products found" description="Try adjusting your search or filters" />
        }
      </div>
    </div>
  );
}
