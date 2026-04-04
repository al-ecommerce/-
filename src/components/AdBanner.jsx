import { useState, useEffect, useRef } from "react";
import { getApprovedAds, updateAd } from "../firebase/db";

// Rotates through active ads. Tracks impressions + clicks.
export default function AdBanner({ style = {} }) {
  const [ads,     setAds]     = useState([]);
  const [current, setCurrent] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    getApprovedAds()
      .then(all => {
        // Filter to non-expired ads
        const live = all.filter(a => {
          if (!a.expiresAt) return true;
          const exp = a.expiresAt?.seconds ? new Date(a.expiresAt.seconds * 1000) : new Date(a.expiresAt);
          return exp > new Date();
        });
        setAds(live);
        // Record impression for each ad shown
        live.forEach(a => {
          updateAd(a.id, { impressions: (a.impressions || 0) + 1 }).catch(() => {});
        });
      })
      .catch(() => {});
  }, []);

  // Rotate every 6 seconds if multiple ads
  useEffect(() => {
    if (ads.length <= 1) return;
    timerRef.current = setInterval(() => {
      setCurrent(i => (i + 1) % ads.length);
    }, 6000);
    return () => clearInterval(timerRef.current);
  }, [ads.length]);

  if (ads.length === 0) return null;

  const ad = ads[current];

  const handleClick = () => {
    updateAd(ad.id, { clicks: (ad.clicks || 0) + 1 }).catch(() => {});
    if (ad.ctaLink) window.open(ad.ctaLink, "_blank", "noopener");
  };

  return (
    <div
      onClick={handleClick}
      style={{
        background: "linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 100%)",
        borderRadius: "var(--radius-lg)",
        display: "flex", alignItems: "stretch",
        position: "relative", overflow: "hidden",
        cursor: ad.ctaLink ? "pointer" : "default",
        transition: "opacity 0.3s",
        minHeight: 90,
        ...style,
      }}
    >
      {/* ── Left: image (if present) ── */}
      {ad.imageURL && (
        <div style={{ flexShrink: 0, width: 120, position: "relative" }}>
          <img
            src={ad.imageURL}
            alt={ad.title}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
            }}
          />
          {/* subtle gradient overlay so the image blends into the banner */}
          <div style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(to right, transparent 60%, #1d4ed8 100%)",
          }} />
        </div>
      )}

      {/* ── Right: content ── */}
      <div style={{
        flex: 1, minWidth: 0,
        padding: "18px 22px",
        display: "flex", alignItems: "center",
        justifyContent: "space-between",
        gap: 16, flexWrap: "wrap",
        position: "relative",
      }}>
        {/* Background decoration circle */}
        <div style={{
          position: "absolute", right: -20, top: -20,
          width: 120, height: 120,
          borderRadius: "50%", background: "rgba(255,255,255,0.06)",
          pointerEvents: "none",
        }} />

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 10, color: "rgba(255,255,255,0.5)", fontWeight: 700,
            letterSpacing: "1px", textTransform: "uppercase", marginBottom: 4,
          }}>Sponsored</div>
          <div style={{
            fontFamily: "var(--font-display)", fontWeight: 700,
            color: "#fff", fontSize: 16, letterSpacing: "-0.2px", marginBottom: 2,
          }}>{ad.title}</div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.72)" }}>
            {ad.description}
          </div>
        </div>

        {/* CTA Button */}
        {ad.ctaLink && (
          <div style={{
            padding: "9px 20px", background: "#fff", color: "#1d4ed8",
            borderRadius: "var(--radius-sm)", fontWeight: 700, fontSize: 13,
            flexShrink: 0, whiteSpace: "nowrap",
          }}>
            {ad.ctaText || "Learn More"}
          </div>
        )}

        {/* Pagination dots */}
        {ads.length > 1 && (
          <div style={{
            position: "absolute", bottom: 8, right: 16,
            display: "flex", gap: 5,
          }}>
            {ads.map((_, i) => (
              <button
                key={i}
                onClick={e => {
                  e.stopPropagation();
                  setCurrent(i);
                  clearInterval(timerRef.current);
                }}
                style={{
                  width: i === current ? 18 : 6, height: 6, borderRadius: 3,
                  border: "none", cursor: "pointer", padding: 0,
                  background: i === current ? "#fff" : "rgba(255,255,255,0.35)",
                  transition: "all 0.3s",
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
