import { useState, useEffect, useRef } from "react";

// ─── SPINNER ─────────────────────────────────────────────
export const Spinner = ({ size = "md", center = false }) => (
  <div style={center ? { display: "flex", justifyContent: "center", padding: "40px" } : {}}>
    <div className={`spinner ${size === "sm" ? "spinner-sm" : ""}`} />
  </div>
);

// ─── AVATAR ──────────────────────────────────────────────
export const Avatar = ({ name = "", photoURL = "", size = "md", style = {} }) => {
  const initials = name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) || "?";
  const cls = `avatar avatar-${size}`;
  if (photoURL) return <img src={photoURL} alt={name} className={cls} style={{ ...style }} />;
  return (
    <div className={cls} style={{ ...style }}>
      {initials}
    </div>
  );
};

// ─── BADGE ───────────────────────────────────────────────
export const Badge = ({ children, type = "muted", style = {} }) => (
  <span className={`badge badge-${type}`} style={style}>{children}</span>
);

export const VerifiedBadge = () => (
  <span title="Verified Seller" style={{ color: "#4F7CFF", fontSize: 14 }}>✓</span>
);

// ─── BUTTON ──────────────────────────────────────────────
export const Button = ({ children, variant = "primary", size = "", full = false, loading = false, onClick, type = "button", style = {}, disabled = false }) => (
  <button
    type={type}
    className={`btn btn-${variant} ${size ? `btn-${size}` : ""} ${full ? "btn-full" : ""}`}
    onClick={onClick}
    disabled={disabled || loading}
    style={style}
  >
    {loading ? <div className="spinner spinner-sm" style={{ borderTopColor: "#fff" }} /> : children}
  </button>
);

// ─── MODAL ───────────────────────────────────────────────
export const Modal = ({ isOpen, onClose, title, children, footer }) => {
  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  if (!isOpen) return null;
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal animate-slide">
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", fontSize: 20, color: "var(--text-muted)", cursor: "pointer", padding: "4px 8px" }}
          >×</button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
};

// ─── ALERT ───────────────────────────────────────────────
export const Alert = ({ type = "info", children }) => (
  <div className={`alert alert-${type}`}>
    <span>{type === "success" ? "✓" : type === "danger" ? "✕" : type === "warning" ? "⚠" : "ℹ"}</span>
    <span>{children}</span>
  </div>
);

// ─── TOAST ───────────────────────────────────────────────
let toastListeners = [];
export const toast = {
  success: (msg) => toastListeners.forEach(fn => fn({ msg, type: "success", id: Date.now() })),
  error: (msg) => toastListeners.forEach(fn => fn({ msg, type: "danger", id: Date.now() })),
  info: (msg) => toastListeners.forEach(fn => fn({ msg, type: "info", id: Date.now() })),
};

export const ToastContainer = () => {
  const [toasts, setToasts] = useState([]);
  useEffect(() => {
    const fn = (t) => {
      setToasts(prev => [...prev, t]);
      setTimeout(() => setToasts(prev => prev.filter(x => x.id !== t.id)), 3500);
    };
    toastListeners.push(fn);
    return () => { toastListeners = toastListeners.filter(l => l !== fn); };
  }, []);
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          <span>{t.type === "success" ? "✓" : t.type === "danger" ? "✕" : "ℹ"}</span>
          {t.msg}
        </div>
      ))}
    </div>
  );
};

// ─── EMPTY STATE ─────────────────────────────────────────
export const EmptyState = ({ icon = "📦", title = "Nothing here", description = "", action = null }) => (
  <div className="empty-state">
    <div className="empty-icon">{icon}</div>
    <h3>{title}</h3>
    {description && <p>{description}</p>}
    {action && <div style={{ marginTop: 16 }}>{action}</div>}
  </div>
);

// ─── STAR RATING ─────────────────────────────────────────
export const StarRating = ({ value = 0, onChange, readonly = false }) => (
  <div style={{ display: "flex", gap: 2 }}>
    {[1, 2, 3, 4, 5].map(s => (
      <span
        key={s}
        onClick={() => !readonly && onChange && onChange(s)}
        style={{
          fontSize: 18, cursor: readonly ? "default" : "pointer",
          color: s <= value ? "#F59E0B" : "var(--border-dark)"
        }}
      >★</span>
    ))}
  </div>
);

// ─── FORM INPUT ──────────────────────────────────────────
export const FormInput = ({ label, error, hint, type = "text", ...props }) => (
  <div className="form-group">
    {label && <label className="form-label">{label}</label>}
    <input type={type} className="form-input" {...props} />
    {error && <span className="form-error">{error}</span>}
    {hint && <span className="form-hint">{hint}</span>}
  </div>
);

export const FormTextarea = ({ label, error, hint, ...props }) => (
  <div className="form-group">
    {label && <label className="form-label">{label}</label>}
    <textarea className="form-textarea" {...props} />
    {error && <span className="form-error">{error}</span>}
    {hint && <span className="form-hint">{hint}</span>}
  </div>
);

export const FormSelect = ({ label, error, children, ...props }) => (
  <div className="form-group">
    {label && <label className="form-label">{label}</label>}
    <select className="form-select" {...props}>{children}</select>
    {error && <span className="form-error">{error}</span>}
  </div>
);

// ─── STAT CARD ────────────────────────────────────────────
export const StatCard = ({ icon, label, value, color = "#4F7CFF", sublabel = "" }) => (
  <div className="stat-card">
    <div className="stat-icon" style={{ background: color + "18" }}>
      <span style={{ fontSize: 22 }}>{icon}</span>
    </div>
    <div className="stat-value">{value}</div>
    <div className="stat-label">{label}</div>
    {sublabel && <div style={{ fontSize: 12, color: "var(--success)", marginTop: 4 }}>{sublabel}</div>}
  </div>
);

// ─── CONFIRM DIALOG ──────────────────────────────────────
export const ConfirmDialog = ({ isOpen, onClose, onConfirm, title = "Confirm", message = "Are you sure?", confirmText = "Confirm", danger = false }) => (
  <Modal isOpen={isOpen} onClose={onClose} title={title}
    footer={<>
      <Button variant="secondary" onClick={onClose}>Cancel</Button>
      <Button variant={danger ? "danger" : "primary"} onClick={() => { onConfirm(); onClose(); }}>{confirmText}</Button>
    </>}
  >
    <p style={{ color: "var(--text-secondary)" }}>{message}</p>
  </Modal>
);

// ─── PAGE HEADER ─────────────────────────────────────────
export const PageHeader = ({ title, subtitle, action }) => (
  <div style={{ marginBottom: 28, display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
    <div>
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 800, margin: 0 }}>{title}</h1>
      {subtitle && <p style={{ color: "var(--text-muted)", marginTop: 4, fontSize: 14 }}>{subtitle}</p>}
    </div>
    {action && <div>{action}</div>}
  </div>
);

// ─── SEARCH BAR ──────────────────────────────────────────
export const SearchBar = ({ value, onChange, placeholder = "Search..." }) => (
  <div style={{ position: "relative" }}>
    <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", fontSize: 16 }}>🔍</span>
    <input
      className="form-input"
      style={{ paddingLeft: 36 }}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
    />
  </div>
);

// ─── TABS ────────────────────────────────────────────────
export const Tabs = ({ tabs, active, onChange }) => (
  <div className="tabs">
    {tabs.map(tab => (
      <button key={tab.value} className={`tab-btn ${active === tab.value ? "active" : ""}`} onClick={() => onChange(tab.value)}>
        {tab.label} {tab.count !== undefined && <Badge type={active === tab.value ? "primary" : "muted"}>{tab.count}</Badge>}
      </button>
    ))}
  </div>
);

// ─── PRICE TAG ───────────────────────────────────────────
export const PriceTag = ({ amount, currency = "GHS", size = "md" }) => {
  const s = size === "lg" ? 26 : size === "sm" ? 14 : 18;
  return (
    <span style={{ fontFamily: "var(--font-display)", fontSize: s, fontWeight: 800, color: "var(--accent)" }}>
      {currency} {Number(amount || 0).toFixed(2)}
    </span>
  );
};

// ─── STATUS BADGE ────────────────────────────────────────
export const StatusBadge = ({ status }) => {
  const map = {
    // Order statuses
    pending:          ["warning", "⏳ Pending"],
    awaiting_payment: ["warning", "💳 Awaiting Payment"],
    paid:             ["primary", "💰 Paid"],
    accepted:         ["primary", "✓ Accepted"],
    processing:       ["primary", "⚙ Processing"],
    shipped:          ["primary", "🚚 Shipped"],
    delivered:        ["success", "📦 Delivered"],
    completed:        ["success", "✓ Completed"],
    cancelled:        ["danger",  "✕ Cancelled"],
    disputed:         ["danger",  "⚠ Disputed"],
    refunded:         ["warning", "↩ Refunded"],
    // Listing statuses
    approved:         ["success", "✓ Approved"],
    rejected:         ["danger",  "✕ Rejected"],
    active:           ["success", "● Active"],
    // Escrow
    held:             ["warning", "🔒 In Escrow"],
    released:         ["success", "✓ Released"],
    // General
    open:             ["primary", "● Open"],
    closed:           ["muted",   "Closed"],
    suspended:        ["danger",  "⚠ Suspended"],
    banned:           ["danger",  "⛔ Banned"],
    verified:         ["success", "✓ Verified"],
  };
  const [type, label] = map[status] || ["muted", status || "Unknown"];
  return <Badge type={type}>{label}</Badge>;
};

// ─── REPORT BUTTON ───────────────────────────────────────
export const ReportButton = ({ onReport }) => (
  <button
    onClick={onReport}
    style={{
      background: "none", border: "none", color: "var(--text-muted)",
      fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 4
    }}
  >
    🚩 Report
  </button>
);
