import { useNavigate } from "react-router-dom";
import { Button } from "../components/UI";

export default function NotFound() {
  const navigate = useNavigate();
  return (
    <div style={{
      minHeight: "calc(100vh - var(--nav-height))",
      display: "flex", alignItems: "center", justifyContent: "center",
      flexDirection: "column", textAlign: "center", padding: 24,
      background: "var(--surface-2)"
    }}>
      <div style={{
        fontFamily: "var(--font-display)", fontSize: 120, fontWeight: 900,
        color: "var(--border-dark)", lineHeight: 1, marginBottom: 12,
        letterSpacing: -4
      }}>404</div>
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 800, marginBottom: 12 }}>
        Page Not Found
      </h1>
      <p style={{ color: "var(--text-muted)", fontSize: 16, maxWidth: 400, lineHeight: 1.6, marginBottom: 32 }}>
        The page you're looking for doesn't exist or has been moved.
      </p>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
        <Button variant="primary" onClick={() => navigate("/")}>Go Home</Button>
        <Button variant="secondary" onClick={() => navigate(-1)}>Go Back</Button>
      </div>
    </div>
  );
}
