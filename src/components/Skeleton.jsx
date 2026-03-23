// Skeleton loading components for better UX

export const SkeletonCard = () => (
  <div style={{
    background: "var(--surface)", border: "1px solid var(--border)",
    borderRadius: "var(--radius-lg)", overflow: "hidden"
  }}>
    <div className="skeleton" style={{ height: 180, width: "100%" }} />
    <div style={{ padding: 14 }}>
      <div className="skeleton" style={{ height: 16, width: "70%", marginBottom: 8 }} />
      <div className="skeleton" style={{ height: 13, width: "90%", marginBottom: 4 }} />
      <div className="skeleton" style={{ height: 13, width: "60%", marginBottom: 14 }} />
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <div className="skeleton" style={{ height: 20, width: 80 }} />
        <div className="skeleton" style={{ height: 20, width: 60 }} />
      </div>
    </div>
  </div>
);

export const SkeletonList = ({ count = 4 }) => (
  <div className="grid grid-4" style={{ gap: 16 }}>
    {Array.from({ length: count }).map((_, i) => <SkeletonCard key={i} />)}
  </div>
);

export const SkeletonRow = () => (
  <tr>
    {Array.from({ length: 5 }).map((_, i) => (
      <td key={i}><div className="skeleton" style={{ height: 16, width: i === 0 ? 120 : 80 }} /></td>
    ))}
  </tr>
);

export const SkeletonTable = ({ rows = 5 }) => (
  <div className="table-wrapper">
    <table>
      <tbody>
        {Array.from({ length: rows }).map((_, i) => <SkeletonRow key={i} />)}
      </tbody>
    </table>
  </div>
);

export const SkeletonText = ({ lines = 3 }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
    {Array.from({ length: lines }).map((_, i) => (
      <div key={i} className="skeleton" style={{ height: 14, width: i === lines - 1 ? "60%" : "100%" }} />
    ))}
  </div>
);

export const SkeletonStat = () => (
  <div className="stat-card">
    <div className="skeleton" style={{ width: 44, height: 44, borderRadius: 8, marginBottom: 12 }} />
    <div className="skeleton" style={{ height: 28, width: "60%", marginBottom: 6 }} />
    <div className="skeleton" style={{ height: 13, width: "40%" }} />
  </div>
);
