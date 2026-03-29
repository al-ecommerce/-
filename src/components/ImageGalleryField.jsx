import { useState } from "react";
import ImageURLField from "./ImageURLField";

/**
 * ImageGalleryField
 * Sellers add up to 5 product photos + optional short video URL.
 * Each photo has an optional label (colour, angle, view — seller's choice).
 *
 * Props:
 *   images     {Array}    [{ url: "", label: "" }, ...]
 *   videoURL   {string}   YouTube/Drive share URL for short video
 *   onChange   {fn}       (images) => void
 *   onVideoChange {fn}    (url) => void
 */
export default function ImageGalleryField({ images = [], videoURL = "", onChange, onVideoChange }) {
  const MAX = 5;
  const [showVideoHelp, setShowVideoHelp] = useState(false);

  const slots = images.length > 0 ? images : [{ url: "", label: "" }];

  const updateSlot = (index, field, value) => {
    const updated = slots.map((s, i) => i === index ? { ...s, [field]: value } : s);
    onChange(updated);
  };

  const addSlot = () => {
    if (slots.length >= MAX) return;
    onChange([...slots, { url: "", label: "" }]);
  };

  const removeSlot = (index) => {
    if (slots.length <= 1) { onChange([{ url: "", label: "" }]); return; }
    onChange(slots.filter((_, i) => i !== index));
  };

  return (
    <div>
      {/* ── PHOTOS ─────────────────────────────────────── */}
      <div style={{ marginBottom: 24 }}>
        <div style={{
          display: "flex", justifyContent: "space-between",
          alignItems: "flex-start", marginBottom: 14,
        }}>
          <div>
            <div className="form-label" style={{ margin: 0 }}>Product Photos</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 3 }}>
              Add up to {MAX} photos — front, back, sides, colours, sizes. Labels are optional.
            </div>
          </div>
          {slots.length < MAX && (
            <button type="button" onClick={addSlot} style={{
              display: "flex", alignItems: "center", gap: 5,
              background: "var(--accent-glow)", border: "1px solid rgba(26,86,219,0.25)",
              color: "var(--accent)", borderRadius: 20, padding: "5px 14px",
              fontSize: 12, fontWeight: 700, cursor: "pointer",
              fontFamily: "var(--font-body)", whiteSpace: "nowrap", flexShrink: 0,
            }}>
              + Add Photo
            </button>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {slots.map((slot, index) => (
            <div key={index} style={{
              border: "1.5px solid",
              borderColor: slot.url ? "var(--accent)" : "var(--border)",
              borderRadius: "var(--radius-lg)", overflow: "hidden",
              transition: "border-color 0.2s",
            }}>
              {/* Slot header */}
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "10px 14px",
                background: "var(--surface-2)",
                borderBottom: "1px solid var(--border)",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: "50%",
                    background: slot.url ? "var(--accent)" : "var(--border)",
                    color: "#fff", fontSize: 11, fontWeight: 800,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>{index + 1}</div>
                  <span style={{ fontWeight: 600, fontSize: 13 }}>
                    {index === 0 ? "Main Photo" : `Photo ${index + 1}`}
                    {slot.label && (
                      <span style={{
                        marginLeft: 8, background: "var(--accent-glow)",
                        color: "var(--accent)", padding: "1px 8px",
                        borderRadius: 20, fontSize: 11, fontWeight: 600,
                      }}>
                        {slot.label}
                      </span>
                    )}
                  </span>
                </div>
                {index > 0 && (
                  <button type="button" onClick={() => removeSlot(index)} style={{
                    background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.2)",
                    color: "var(--danger)", borderRadius: 6, padding: "3px 10px",
                    fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-body)",
                  }}>Remove</button>
                )}
              </div>

              {/* Slot body */}
              <div style={{ padding: "14px 16px" }}>
                {/* Optional label */}
                <div className="form-group" style={{ marginBottom: 12 }}>
                  <label className="form-label">
                    Label <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>(optional)</span>
                  </label>
                  <input
                    className="form-input"
                    type="text"
                    value={slot.label}
                    onChange={e => updateSlot(index, "label", e.target.value)}
                    placeholder={
                      index === 0
                        ? "e.g. Front view, Red, Main…"
                        : "e.g. Back view, Blue, Side, Size L…"
                    }
                    maxLength={30}
                    style={{ marginBottom: 0 }}
                  />
                  <span className="form-hint">
                    Describe what this photo shows — colour, angle, size. Buyers see this label.
                  </span>
                </div>

                {/* Image URL */}
                <ImageURLField
                  label={
                    index === 0
                      ? "Main Product Photo *"
                      : `Extra Photo ${index + 1} — ${slot.label || "Add a label above"}`
                  }
                  value={slot.url}
                  onChange={url => updateSlot(index, "url", url)}
                  required={index === 0}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Tip */}
        <div style={{
          marginTop: 10, padding: "10px 14px",
          background: "rgba(26,86,219,0.05)", border: "1px solid rgba(26,86,219,0.12)",
          borderRadius: "var(--radius-sm)", fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6,
        }}>
          💡 <strong>Tip:</strong> Add photos from different angles — front, back, side, and detail shots. If you sell multiple colours, add one photo per colour and label each one. Buyers can click through all photos before buying.
        </div>
      </div>

      {/* ── VIDEO ──────────────────────────────────────── */}
      {onVideoChange && (
        <div style={{
          border: "1.5px solid var(--border)", borderRadius: "var(--radius-lg)",
          overflow: "hidden", marginBottom: 8,
        }}>
          <div style={{
            padding: "12px 16px", background: "var(--surface-2)",
            borderBottom: "1px solid var(--border)",
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 13 }}>
                🎬 Product Video <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>(optional)</span>
              </div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                Add a YouTube, Google Drive, or other video link to showcase your product.
              </div>
            </div>
            <button type="button" onClick={() => setShowVideoHelp(v => !v)} style={{
              background: "none", border: "1px solid var(--border)",
              borderRadius: 20, padding: "3px 12px",
              fontSize: 11, fontWeight: 600, cursor: "pointer",
              color: "var(--text-muted)", fontFamily: "var(--font-body)",
            }}>
              {showVideoHelp ? "✕ Close" : "❓ Help"}
            </button>
          </div>

          {showVideoHelp && (
            <div style={{ padding: "12px 16px", background: "var(--surface-3)", borderBottom: "1px solid var(--border)" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 13 }}>
                {[
                  { icon: "▶️", title: "YouTube", steps: "Upload your video to YouTube. Set visibility to 'Unlisted' or 'Public'. Copy the video URL from the address bar." },
                  { icon: "📁", title: "Google Drive", steps: "Upload video to Google Drive. Right-click → Share → Anyone with link. Copy the sharing link." },
                ].map(v => (
                  <div key={v.title} style={{
                    padding: "10px 12px", background: "var(--surface)",
                    borderRadius: "var(--radius-sm)", border: "1px solid var(--border)",
                  }}>
                    <div style={{ fontWeight: 700, marginBottom: 4 }}>{v.icon} {v.title}</div>
                    <div style={{ color: "var(--text-muted)", lineHeight: 1.5 }}>{v.steps}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ padding: "14px 16px" }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Video Link</label>
              <input
                className="form-input"
                type="url"
                value={videoURL}
                onChange={e => onVideoChange(e.target.value)}
                placeholder="https://youtube.com/watch?v=... or https://drive.google.com/..."
              />
              <span className="form-hint">Paste a YouTube or Google Drive link. Buyers will see a "Watch Video" button on your product page.</span>
            </div>

            {/* Video preview badge */}
            {videoURL && (
              <div style={{
                marginTop: 10, display: "flex", alignItems: "center", gap: 10,
                padding: "10px 14px", background: "rgba(5,150,105,0.08)",
                border: "1px solid rgba(5,150,105,0.2)", borderRadius: "var(--radius-sm)",
              }}>
                <span style={{ fontSize: 20 }}>🎬</span>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13, color: "var(--success)" }}>Video link added</div>
                  <a href={videoURL} target="_blank" rel="noopener noreferrer"
                    style={{ fontSize: 12, color: "var(--accent)" }}>
                    Preview →
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
