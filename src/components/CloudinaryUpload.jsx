import { useState, useRef, useCallback } from "react";
import { uploadImage, validateImageFile, isCloudinaryConfigured } from "../services/cloudinary";

/**
 * CloudinaryUpload
 * ────────────────
 * Reusable drag-and-drop image uploader backed by Cloudinary.
 * Replaces the old ImageURLField / ImageGalleryField for product images.
 *
 * Props:
 *   images        {Array}    Current images: [{ url, label, publicId? }]
 *   onChange      {fn}       Called with updated images array after each upload/remove
 *   maxImages     {number}   Default: 5
 *   disabled      {boolean}  Disables all interactions (e.g. while form is submitting)
 *   folder        {string}   Cloudinary folder (default: "products")
 *
 * Each image in the array: { url: string, label: string }
 * The first image is automatically used as the thumbnail.
 */
export default function CloudinaryUpload({
  images    = [],
  onChange,
  maxImages = 5,
  disabled  = false,
  folder    = "products",
  onUploadStart,  // called when any upload begins
  onUploadEnd,    // called when all uploads for a batch are done
}) {
  const [uploadingIndex, setUploadingIndex] = useState(null); // which slot is uploading
  const [progress,       setProgress]       = useState({});   // { slotIndex: 0-100 }
  const [errors,         setErrors]         = useState({});   // { slotIndex: "message" }
  const [dragOver,       setDragOver]       = useState(false);
  const fileInputRef = useRef(null);

  const configured = isCloudinaryConfigured();

  // ── Upload a single file into a specific slot ─────────────
  const uploadFile = useCallback(async (file, slotIndex) => {
    const check = validateImageFile(file);
    if (!check.valid) {
      setErrors(e => ({ ...e, [slotIndex]: check.error }));
      return;
    }

    setErrors(e => { const n = { ...e }; delete n[slotIndex]; return n; });
    setUploadingIndex(slotIndex);
    setProgress(p => ({ ...p, [slotIndex]: 0 }));
    if (onUploadStart) onUploadStart();

    try {
      const url = await uploadImage(file, {
        folder,
        onProgress: (pct) => setProgress(p => ({ ...p, [slotIndex]: pct })),
      });

      const updated = [...images];
      updated[slotIndex] = { url, label: images[slotIndex]?.label || "" };
      onChange(updated);
    } catch (err) {
      setErrors(e => ({ ...e, [slotIndex]: err.message }));
    } finally {
      setUploadingIndex(null);
      setProgress(p => { const n = { ...p }; delete n[slotIndex]; return n; });
      if (onUploadEnd) onUploadEnd();
    }
  }, [images, onChange, folder, onUploadStart, onUploadEnd]);

  // ── Add new images (from input or drop) ──────────────────
  const handleFiles = useCallback(async (files) => {
    const slotsUsed   = images.filter(i => i.url).length;
    const slotsAvail  = maxImages - slotsUsed;
    const toProcess   = Array.from(files).slice(0, slotsAvail);

    if (toProcess.length === 0) return;

    // Upload each file into its slot
    for (let i = 0; i < toProcess.length; i++) {
      const slotIndex = slotsUsed + i;
      await uploadFile(toProcess[i], slotIndex);
    }
  }, [images, maxImages, uploadFile]);

  const handleInputChange  = (e) => { if (e.target.files) handleFiles(e.target.files); e.target.value = ""; };
  const handleDrop         = (e) => { e.preventDefault(); setDragOver(false); if (!disabled) handleFiles(e.dataTransfer.files); };
  const handleDragOver     = (e) => { e.preventDefault(); if (!disabled) setDragOver(true); };
  const handleDragLeave    = ()  => setDragOver(false);

  const updateLabel = (index, label) => {
    const updated = [...images];
    updated[index] = { ...updated[index], label };
    onChange(updated);
  };

  const removeImage = (index) => {
    const updated = images.filter((_, i) => i !== index);
    onChange(updated);
    setErrors(e => { const n = { ...e }; delete n[index]; return n; });
  };

  const filledImages = images.filter(i => i.url);
  const canAddMore   = filledImages.length < maxImages;
  const isUploading  = uploadingIndex !== null;

  if (!configured) {
    return (
      <div style={{ padding: "14px 16px", background: "rgba(220,38,38,0.07)", border: "1px solid rgba(220,38,38,0.25)", borderRadius: "var(--radius-sm)", fontSize: 13, color: "var(--danger)" }}>
        ⚠ Cloudinary is not configured. Add <code>VITE_CLOUDINARY_CLOUD_NAME</code> and{" "}
        <code>VITE_CLOUDINARY_UPLOAD_PRESET</code> to your <code>.env</code> file.
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <div>
          <div className="form-label" style={{ margin: 0 }}>Product Photos</div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 3 }}>
            {filledImages.length}/{maxImages} photos uploaded. First photo is the main thumbnail.
          </div>
        </div>
        {canAddMore && !disabled && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            style={{
              background: isUploading ? "var(--surface-3)" : "var(--accent-glow)",
              border: `1px solid ${isUploading ? "var(--border)" : "rgba(26,86,219,0.25)"}`,
              color: isUploading ? "var(--text-muted)" : "var(--accent)",
              borderRadius: 20, padding: "5px 14px",
              fontSize: 12, fontWeight: 700, cursor: isUploading ? "not-allowed" : "pointer",
              fontFamily: "var(--font-body)", whiteSpace: "nowrap", flexShrink: 0,
            }}
          >
            {isUploading ? "Uploading…" : `+ Add Photo`}
          </button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
        multiple
        style={{ display: "none" }}
        onChange={handleInputChange}
        disabled={disabled || isUploading}
      />

      {/* Drop zone — shown when no images yet */}
      {filledImages.length === 0 && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => !disabled && !isUploading && fileInputRef.current?.click()}
          style={{
            border: `2px dashed ${dragOver ? "var(--accent)" : "var(--border)"}`,
            borderRadius: "var(--radius-lg)",
            padding: "40px 20px",
            textAlign: "center",
            cursor: disabled ? "not-allowed" : "pointer",
            background: dragOver ? "var(--accent-glow)" : "var(--surface-2)",
            transition: "all 0.2s",
            marginBottom: 16,
          }}
        >
          <div style={{ fontSize: 40, marginBottom: 10 }}>📷</div>
          <div style={{ fontWeight: 700, marginBottom: 6, fontSize: 15 }}>
            {isUploading ? "Uploading…" : "Drop photos here or click to browse"}
          </div>
          <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
            JPG, PNG, WEBP · Max {maxImages} photos · Max 10MB each
          </div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
            Images are automatically compressed before upload
          </div>
        </div>
      )}

      {/* Uploaded images grid */}
      {filledImages.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12, marginBottom: 12 }}>
          {images.map((img, index) => {
            if (!img.url && uploadingIndex !== index) return null;
            const isThisUploading = uploadingIndex === index;
            const pct = progress[index] || 0;
            const err = errors[index];

            return (
              <div key={index} style={{
                border: `1.5px solid ${err ? "var(--danger)" : index === 0 ? "var(--accent)" : "var(--border)"}`,
                borderRadius: "var(--radius-lg)",
                overflow: "hidden",
                position: "relative",
              }}>
                {/* Thumbnail badge */}
                {index === 0 && img.url && (
                  <div style={{
                    position: "absolute", top: 6, left: 6, zIndex: 2,
                    background: "var(--accent)", color: "#fff",
                    fontSize: 10, fontWeight: 800, padding: "2px 8px", borderRadius: 10,
                  }}>MAIN</div>
                )}

                {/* Remove button */}
                {img.url && !disabled && (
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    disabled={isUploading}
                    style={{
                      position: "absolute", top: 6, right: 6, zIndex: 2,
                      width: 24, height: 24, borderRadius: "50%",
                      background: "rgba(220,38,38,0.85)", color: "#fff",
                      border: "none", cursor: "pointer", fontSize: 12,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontWeight: 700,
                    }}
                  >✕</button>
                )}

                {/* Image preview */}
                {img.url ? (
                  <img
                    src={img.url}
                    alt={img.label || `Photo ${index + 1}`}
                    style={{ width: "100%", height: 140, objectFit: "cover", display: "block" }}
                    onError={e => { e.target.style.background = "var(--surface-3)"; }}
                  />
                ) : isThisUploading ? (
                  <div style={{ height: 140, background: "var(--surface-3)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }}>
                    <div style={{ fontSize: 24 }}>⏳</div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{pct}%</div>
                    <div style={{ width: "70%", height: 4, background: "var(--border)", borderRadius: 2, overflow: "hidden" }}>
                      <div style={{ width: `${pct}%`, height: "100%", background: "var(--accent)", borderRadius: 2, transition: "width 0.3s" }} />
                    </div>
                  </div>
                ) : null}

                {/* Label input */}
                {img.url && (
                  <div style={{ padding: "8px 10px", borderTop: "1px solid var(--border)" }}>
                    <input
                      type="text"
                      value={img.label || ""}
                      onChange={e => updateLabel(index, e.target.value)}
                      placeholder={index === 0 ? "e.g. Front view, Red…" : "e.g. Back, Blue, Size L…"}
                      maxLength={30}
                      disabled={disabled}
                      style={{
                        width: "100%", border: "none", outline: "none",
                        fontSize: 12, background: "transparent",
                        color: "var(--text)", fontFamily: "var(--font-body)",
                        padding: 0,
                      }}
                    />
                  </div>
                )}

                {/* Error */}
                {err && (
                  <div style={{ padding: "6px 10px", background: "rgba(220,38,38,0.08)", fontSize: 11, color: "var(--danger)", lineHeight: 1.4 }}>
                    ✕ {err}
                  </div>
                )}
              </div>
            );
          })}

          {/* Add more slot */}
          {canAddMore && !disabled && (
            <div
              onClick={() => !isUploading && fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              style={{
                border: `2px dashed ${dragOver ? "var(--accent)" : "var(--border)"}`,
                borderRadius: "var(--radius-lg)",
                height: 140 + 38, // match card height
                display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center", gap: 6,
                cursor: isUploading ? "not-allowed" : "pointer",
                background: dragOver ? "var(--accent-glow)" : "var(--surface-2)",
                transition: "all 0.2s",
                color: "var(--text-muted)", fontSize: 13,
              }}
            >
              <div style={{ fontSize: 28 }}>＋</div>
              <div style={{ fontSize: 12 }}>Add photo</div>
            </div>
          )}
        </div>
      )}

      {/* Overall upload progress */}
      {isUploading && (
        <div style={{ padding: "10px 12px", background: "var(--accent-glow)", border: "1px solid rgba(26,86,219,0.2)", borderRadius: "var(--radius-sm)", fontSize: 13, color: "var(--accent)", display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 16, height: 16, border: "2px solid var(--accent)", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite", flexShrink: 0 }} />
          Uploading photo {uploadingIndex + 1}… {progress[uploadingIndex] || 0}%
        </div>
      )}

      {/* Tip */}
      <div style={{ marginTop: 8, fontSize: 12, color: "var(--text-muted)", lineHeight: 1.5 }}>
        💡 Add photos from different angles — front, back, sides. Add optional labels to each photo. Buyers scroll through all photos before buying.
      </div>
    </div>
  );
}
