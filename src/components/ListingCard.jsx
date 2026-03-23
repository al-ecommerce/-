import { useNavigate } from "react-router-dom";
import { Badge, VerifiedBadge, PriceTag, StatusBadge } from "./UI";

export const ListingCard = ({ item, type = "product" }) => {
  const navigate = useNavigate();
  const path = `/${type}s/${item.id}`;

  return (
    <div className="listing-card card-hover" onClick={() => navigate(path)}>
      <div style={{
        width: "100%", height: 180,
        background: item.imageURL ? "transparent" : "linear-gradient(135deg, var(--surface-3), var(--border))",
        position: "relative", overflow: "hidden"
      }}>
        {item.imageURL
          ? <img src={item.imageURL} alt={item.title} className="listing-card-img" />
          : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40 }}>
              {type === "product" ? "📦" : "🛠"}
            </div>
        }
        {item.featured && (
          <div style={{
            position: "absolute", top: 10, left: 10,
            background: "#F59E0B", color: "#fff",
            padding: "3px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700
          }}>⭐ Featured</div>
        )}
        {item.status && item.status !== "approved" && (
          <div style={{ position: "absolute", top: 10, right: 10 }}>
            <StatusBadge status={item.status} />
          </div>
        )}
      </div>
      <div className="listing-card-body">
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
          <h3 className="listing-card-title truncate" style={{ flex: 1 }}>{item.title}</h3>
          {item.isSellerVerified && <VerifiedBadge />}
        </div>
        <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {item.description}
        </p>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 12 }}>
          <PriceTag amount={item.price} />
          {item.category && <Badge type="muted">{item.category}</Badge>}
        </div>
        <div className="listing-card-meta">
          {item.location && <span>📍 {item.location}</span>}
          {item.rating > 0 && <span>⭐ {Number(item.rating).toFixed(1)}</span>}
          {item.views > 0 && <span>👁 {item.views}</span>}
        </div>
      </div>
    </div>
  );
};

export const RequestCard = ({ item }) => {
  const navigate = useNavigate();
  return (
    <div className="card card-hover" style={{ cursor: "pointer" }} onClick={() => navigate(`/requests/${item.id}`)}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <h3 style={{ fontWeight: 700, fontSize: 15, flex: 1 }}>{item.title}</h3>
        <StatusBadge status={item.status} />
      </div>
      <p style={{ color: "var(--text-secondary)", fontSize: 14, marginTop: 8, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
        {item.description}
      </p>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 14, flexWrap: "wrap", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {item.budget && <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, color: "var(--accent)" }}>Budget: GHS {item.budget}</span>}
          {item.category && <Badge type="muted">{item.category}</Badge>}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text-muted)" }}>
          💬 {item.offerCount || 0} offers
          {item.deadline && <span>• Due {new Date(item.deadline?.seconds * 1000 || item.deadline).toLocaleDateString()}</span>}
        </div>
      </div>
    </div>
  );
};

export const OrderCard = ({ order }) => {
  const navigate = useNavigate();
  return (
    <div className="card" style={{ cursor: "pointer" }} onClick={() => navigate(`/orders/${order.id}`)}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15 }}>{order.itemTitle || "Order"}</div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>#{order.id?.slice(0, 8)}</div>
        </div>
        <StatusBadge status={order.status} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 14 }}>
        <PriceTag amount={order.amount} size="sm" />
        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
          {order.createdAt?.seconds ? new Date(order.createdAt.seconds * 1000).toLocaleDateString() : "—"}
        </span>
      </div>
    </div>
  );
};
