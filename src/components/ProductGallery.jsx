/**
 * ProductGallery
 * ─────────────────────────────────────────────────
 * Replaces the inline ProductImageGallery in ProductDetail.
 * Features:
 *   • Swipe gestures on mobile (touch events)
 *   • Keyboard arrow navigation
 *   • Animated crossfade transitions
 *   • 360° mode: auto-cycles through all images
 *   • Thumbnail strip
 *   • Variant/colour label chips
 */
import { useState, useEffect, useRef, useCallback } from "react";

export default function ProductGallery({ product }) {
  const images = (product.images?.filter(i => i.url) || []).length > 0
    ? product.images.filter(i => i.url)
    : product.imageURL ? [{ url: product.imageURL, label: "" }] : [];

  const [active,   setActive]   = useState(0);
  const [mode360,  setMode360]  = useState(false);  // 360° auto-rotate mode
  const [fading,   setFading]   = useState(false);  // crossfade flag
  const intervalRef = useRef(null);
  const touchStartX = useRef(null);
  const touchStartY = useRef(null);

  // ── Navigate with animation ─────────────────────────────
  const goTo = useCallback((idx) => {
    if (idx === active) return;
    setFading(true);
    setTimeout(() => {
      setActive(idx);
      setFading(false);
    }, 150);
  }, [active]);

  const prev = () => goTo((active - 1 + images.length) % images.length);
  const next = useCallback(() => goTo((active + 1) % images.length), [active, goTo, images.length]);

  // ── Keyboard navigation ─────────────────────────────────
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "ArrowLeft")  prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active]);

  // ── 360° mode: auto-cycle every 400ms ──────────────────
  useEffect(() => {
    if (mode360 && images.length > 1) {
      intervalRef.current = setInterval(next, 400);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [mode360, next, images.length]);

  // ── Touch / swipe gesture ───────────────────────────────
  const onTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };
  const onTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40) {
      dx < 0 ? next() : prev();
    }
    touchStartX.current = null;
  };

  if (images.length === 0) {
    return (
      <div style={{ width: "100%", height: 380, background: "var(--surface-3)", borderRadius: "var(--radius-xl)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 64, border: "1px solid var(--border)" }}>
        📦
      </div>
    );
  }

  return (
    <div>
      {/* ── Main image ─────────────────────────────────── */}
      <div
        style={{ width: "100%", height: 380, background: "var(--surface-3)", borderRadius: "var(--radius-xl)", overflow: "hidden", border: "1px solid var(--border)", position: "relative", userSelect: "none" }}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <img
          src={images[active].url}
          alt={images[active].label || product.title}
          style={{
            width: "100%", height: "100%", objectFit: "cover",
            opacity: fading ? 0 : 1,
            transition: "opacity 0.15s ease",
          }}
          onError={e => { e.target.style.display = "none"; }}
        />

        {/* 360° badge */}
        {mode360 && (
          <div style={{
            position: "absolute", top: 12, left: 12,
            background: "rgba(0,0,0,0.7)", color: "#fff",
            padding: "4px 12px", borderRadius: 20,
            fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", gap: 6,
          }}>
            <span style={{ display: "inline-block", animation: "spin 1s linear infinite", fontSize: 14 }}>↻</span>
            360°
          </div>
        )}

        {/* Label overlay */}
        {images[active].label && (
          <div style={{ position: "absolute", bottom: 12, left: 12, background: "rgba(0,0,0,0.6)", color: "#fff", padding: "4px 12px", borderRadius: 20, fontSize: 13, fontWeight: 600, backdropFilter: "blur(4px)" }}>
            {images[active].label}
          </div>
        )}

        {/* Image counter */}
        {images.length > 1 && (
          <div style={{ position: "absolute", top: 12, right: 12, background: "rgba(0,0,0,0.5)", color: "#fff", padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
            {active + 1} / {images.length}
          </div>
        )}

        {/* Nav arrows */}
        {images.length > 1 && (
          <>
            <button onClick={prev} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.9)", border: "none", cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "var(--shadow)" }}>‹</button>
            <button onClick={next} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.9)", border: "none", cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "var(--shadow)" }}>›</button>
          </>
        )}
      </div>

      {/* ── Controls bar ───────────────────────────────── */}
      {images.length > 1 && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
          {/* Thumbnail strip */}
          <div style={{ display: "flex", gap: 8, overflowX: "auto" }}>
            {images.map((img, i) => (
              <button key={i} onClick={() => goTo(i)} style={{
                width: 64, height: 64, borderRadius: "var(--radius-sm)", overflow: "hidden",
                border: `2.5px solid ${i === active ? "var(--accent)" : "var(--border)"}`,
                cursor: "pointer", padding: 0, flexShrink: 0, background: "var(--surface-3)",
                transition: "border-color 0.2s",
              }}>
                <img src={img.url} alt={img.label || `View ${i + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => { e.target.style.display = "none"; }} />
              </button>
            ))}
          </div>

          {/* 360° toggle */}
          <button
            onClick={() => setMode360(v => !v)}
            title="Toggle 360° view"
            style={{
              padding: "6px 14px", borderRadius: 20, border: "1.5px solid",
              borderColor: mode360 ? "var(--accent)" : "var(--border)",
              background: mode360 ? "var(--accent-glow)" : "var(--surface)",
              color: mode360 ? "var(--accent)" : "var(--text-muted)",
              fontSize: 12, fontWeight: 700, cursor: "pointer",
              fontFamily: "var(--font-body)", flexShrink: 0,
              display: "flex", alignItems: "center", gap: 5,
            }}
          >
            ↻ {mode360 ? "Stop" : "360°"}
          </button>
        </div>
      )}

      {/* ── Colour / variant chips ──────────────────────── */}
      {images.some(i => i.label) && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginTop: 10 }}>
          <span style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 500 }}>View:</span>
          {images.map((img, i) => (
            <button key={i} onClick={() => goTo(i)} style={{
              padding: "5px 14px", borderRadius: 20, border: "1.5px solid",
              borderColor: i === active ? "var(--accent)" : "var(--border)",
              background: i === active ? "var(--accent-glow)" : "var(--surface)",
              color: i === active ? "var(--accent)" : "var(--text-secondary)",
              fontSize: 13, fontWeight: i === active ? 700 : 500,
              cursor: "pointer", fontFamily: "var(--font-body)", transition: "all 0.15s",
            }}>
              {img.label || `Photo ${i + 1}`}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
