import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { getProducts, getServices, getRequests } from "../firebase/db";
import { ListingCard, RequestCard } from "../components/ListingCard";
import { Spinner, PageHeader, Tabs, EmptyState } from "../components/UI";
import { useDebounce } from "../hooks/index";

export default function Search() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const q = params.get("q") || "";

  const [products, setProducts] = useState([]);
  const [services, setServices] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState("products");

  useEffect(() => {
    if (!q) return;
    const load = async () => {
      setLoading(true);
      try {
        const [p, s, r] = await Promise.all([
          getProducts(),
          getServices(),
          getRequests()
        ]);
        const ql = q.toLowerCase();
        setProducts(p.filter(x => x.title?.toLowerCase().includes(ql) || x.description?.toLowerCase().includes(ql)));
        setServices(s.filter(x => x.title?.toLowerCase().includes(ql) || x.description?.toLowerCase().includes(ql)));
        setRequests(r.filter(x => x.title?.toLowerCase().includes(ql) || x.description?.toLowerCase().includes(ql)));
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    load();
  }, [q]);

  const total = products.length + services.length + requests.length;

  return (
    <div className="page-wrapper">
      <div className="container" style={{ paddingTop: 28 }}>
        <PageHeader
          title={`Search Results`}
          subtitle={`${total} results for "${q}"`}
        />

        <Tabs
          tabs={[
            { value: "products", label: "Products", count: products.length },
            { value: "services", label: "Services", count: services.length },
            { value: "requests", label: "Requests", count: requests.length },
          ]}
          active={tab}
          onChange={setTab}
        />

        {loading ? <Spinner center /> : (
          <>
            {tab === "products" && (
              products.length === 0
                ? <EmptyState icon="📦" title="No products found" description={`No products match "${q}"`} />
                : <div className="grid grid-4" style={{ gap: 16 }}>
                    {products.map(p => <ListingCard key={p.id} item={p} type="product" />)}
                  </div>
            )}
            {tab === "services" && (
              services.length === 0
                ? <EmptyState icon="🛠" title="No services found" description={`No services match "${q}"`} />
                : <div className="grid grid-4" style={{ gap: 16 }}>
                    {services.map(s => <ListingCard key={s.id} item={s} type="service" />)}
                  </div>
            )}
            {tab === "requests" && (
              requests.length === 0
                ? <EmptyState icon="📋" title="No requests found" description={`No requests match "${q}"`} />
                : <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {requests.map(r => <RequestCard key={r.id} item={r} />)}
                  </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
