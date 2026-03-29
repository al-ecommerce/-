import { useState } from "react";
import ImageURLField from "./ImageURLField";

/**
 * ImageGalleryField
 * Lets a seller add up to 5 product images, each with an optional
 * color / variant label (e.g. "Red", "Blue", "Black").
 *
 * Props:
 *   images   {Array}  - [{ url: "", label: "" }, ...]
 *   onChange {fn}     - called with updated images array
 */
export default function ImageGalleryField({ images = [], onChange }) {
  const MAX = 5;

  // Ensure we always have at least one slot
  const slots = images.length > 0 ? images : [{ url: "", label: "" }];

  const updateSlot = (index, field, value) => {
    const updated = slots.map((s, i) => i === index ? { ...s, [field]: value } : s);
    onChange(updated.filter((s, i) => i === 0 || s.url || s.label)); // keep first always
  };

  const addSlot = () => {
    if (slots.length >= MAX) return;
    onChange([...slots, { url: "", label: "" }]);
  };

  const removeSlot = (index) => {
    if (slots.length <= 1) {
      onChange([{ url: "", label: "" }]);
      return;
    }
    onChange(slots.filter((_, i) => i !== index));
  };

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div>
          <div className="form-label" style={{ margin: 0 }}>Product Images</div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
            Add up to {MAX} images. Label each one with a colour or variant name.
          </div>
        </div>
        {slots.length < MAX && (
          <button
            type="button"
            onClick={addSlot}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              background: "var(--accent-glow)", border: "1px solid rgba(26,86,219,0.25)",
              color: "var(--accent)", borderRadius: 20, padding: "5px 14px",
              fontSize: 12, fontWeight: 700, cursor: "pointer",
              fontFamily: "var(--font-body)",
            }}
          >
            + Add Colour / Variant
          </button>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {slots.map((slot, index) => (
          <div
            key={index}
            style={{
              border: "1.5px solid var(--border)", borderRadius: "var(--radius-lg)",
              overflow: "hidden",
              boxShadow: slot.url ? "var(--shadow-sm)" : "none",
            }}
          >
            {/* Slot header */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "10px 14px",
              background: "var(--surface-2)",
              borderBottom: "1px solid var(--border)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {/* Colour swatch preview */}
                <div style={{
                  width: 24, height: 24, borderRadius: "50%",
                  border: "2px solid var(--border)",
                  background: slot.url ? "var(--accent-glow)" : "var(--surface-3)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 12, fontWeight: 800, color: "var(--accent)",
                }}>
                  {index + 1}
                </div>
                <span style={{ fontWeight: 600, fontSize: 13 }}>
                  {index === 0 ? "Main Image" : `Variant ${index + 1}`}
                </span>
                {slot.label && (
                  <span style={{
                    background: "var(--accent-glow)", color: "var(--accent)",
                    padding: "2px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600,
                  }}>
                    {slot.label}
                  </span>
                )}
              </div>
              {index > 0 && (
                <button
                  type="button"
                  onClick={() => removeSlot(index)}
                  style={{
                    background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.2)",
                    color: "var(--danger)", borderRadius: 6, padding: "3px 10px",
                    fontSize: 12, fontWeight: 600, cursor: "pointer",
                    fontFamily: "var(--font-body)",
                  }}
                >
                  Remove
                </button>
              )}
            </div>

            {/* Slot body */}
            <div style={{ padding: "14px 16px" }}>
              {/* Colour / variant label */}
              <div className="form-group" style={{ marginBottom: 12 }}>
                <label className="form-label">
                  {index === 0 ? "Colour / Variant Name (optional)" : "Colour / Variant Name *"}
                </label>
                <input
                  className="form-input"
                  type="text"
                  value={slot.label}
                  onChange={e => updateSlot(index, "label", e.target.value)}
                  placeholder={
                    index === 0 ? "e.g. Red, Blue, Black, Default..." :
                    "e.g. Blue, Large, 128GB..."
                  }
                  maxLength={30}
                />
                <span className="form-hint">
                  Buyers will see this label when switching between images
                </span>
              </div>

              {/* Image URL field */}
              <ImageURLField
                label={index === 0 ? "Main Product Image" : `Variant Image — ${slot.label || `Option ${index + 1}`}`}
                value={slot.url}
                onChange={url => updateSlot(index, "url", url)}
                required={index === 0}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Usage tip */}
      <div style={{
        marginTop: 12, padding: "10px 14px",
        background: "rgba(26,86,219,0.05)",
        border: "1px solid rgba(26,86,219,0.15)",
        borderRadius: "var(--radius-sm)", fontSize: 13,
        color: "var(--text-secondary)", lineHeight: 1.6,
      }}>
        💡 <strong>Tip:</strong> Add one image per colour or size variation. Buyers can click through each one on the product page before purchasing.
      </div>
    </div>
  );
}
