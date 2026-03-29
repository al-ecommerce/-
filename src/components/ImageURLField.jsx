import { useState, useRef } from "react";

const GUIDES = [
  {
    name: "Imgur",
    icon: "🖼️",
    color: "#1BB76E",
    url: "https://imgur.com",
    steps: [
      "Open imgur.com on your phone browser",
      "Tap the camera icon or 'New Post'",
      "Select your photo from your gallery",
      "After upload, tap the photo to open it",
      "Tap the three dots (...) → 'Copy link'",
      "Paste the link here — it ends with .jpg or .png",
    ],
    tip: "Imgur is completely free and the most reliable option.",
    example: "https://i.imgur.com/abc1234.jpg",
  },
  {
    name: "Rojuka",
    icon: "📤",
    color: "#4F8EFF",
    url: "https://rjke.com",
    steps: [
      "Open rjke.com on your phone",
      "Tap 'Upload Image' and choose from your gallery",
      "Wait for upload to complete",
      "Tap 'Copy URL' or long-press the image link",
      "Paste the copied link into the field below",
    ],
    tip: "Rjke.com (Rojuka) is quick and does not require an account.",
    example: "https://rjke.com/i/abcdef.jpg",
  },
  {
    name: "ImageBB",
    icon: "📸",
    color: "#FF6B35",
    url: "https://imgbb.com",
    steps: [
      "Go to imgbb.com on your phone",
      "Tap 'Start Uploading' — no account needed",
      "Choose your photo from your gallery",
      "After upload, look for 'Direct link'",
      "Copy that link and paste it here",
    ],
    tip: "ImageBB gives you a direct link immediately after upload.",
    example: "https://i.ibb.co/abc123/photo.jpg",
  },
  {
    name: "Google Drive",
    icon: "📁",
    color: "#0F9D58",
    url: "https://drive.google.com",
    steps: [
      "Open Google Drive and upload your photo",
      "Long-press the file → tap the three dots",
      "Tap 'Share' → change access to 'Anyone with link'",
      "Copy the sharing link",
      "Replace everything with: https://drive.google.com/uc?id=FILE_ID",
      "The FILE_ID is the long string between /d/ and /view in the link",
    ],
    tip: "Works well if you already use Google Drive.",
    example: "https://drive.google.com/uc?id=1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs",
  },
];

export default function ImageURLField({
  label    = "Product Image",
  value    = "",
  onChange,
  required = false,
}) {
  const [showGuide, setShowGuide] = useState(false);
  const [tab,       setTab]       = useState(0);
  const [imgStatus, setImgStatus] = useState("idle"); // idle | checking | ok | error
  const [errMsg,    setErrMsg]    = useState("");
  const debounce = useRef(null);

  const validate = (url) => {
    if (!url) { setImgStatus("idle"); return; }
    if (!url.startsWith("http")) {
      setImgStatus("error");
      setErrMsg("The link must start with https://");
      return;
    }
    setImgStatus("checking");
    const img = new Image();
    img.onload  = () => setImgStatus("ok");
    img.onerror = () => {
      setImgStatus("error");
      setErrMsg("Could not load this image. Make sure it is a direct public link ending in .jpg, .png, or .webp");
    };
    img.src = url;
  };

  const handleChange = (e) => {
    const v = e.target.value;
    onChange(v);
    setImgStatus("idle");
    clearTimeout(debounce.current);
    if (v) debounce.current = setTimeout(() => validate(v), 900);
  };

  const tryExample = (ex) => {
    onChange(ex);
    validate(ex);
  };

  const borderColor =
    imgStatus === "ok"    ? "var(--success)" :
    imgStatus === "error" ? "var(--danger)"  : "var(--border)";

  return (
    <div className="form-group">
      {/* Label row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <label className="form-label" style={{ margin: 0 }}>
          {label}{required && <span style={{ color: "var(--danger)" }}> *</span>}
        </label>
        <button
          type="button"
          onClick={() => setShowGuide(v => !v)}
          style={{
            background: showGuide ? "var(--surface-3)" : "var(--accent-glow)",
            border: "1px solid " + (showGuide ? "var(--border)" : "rgba(26,86,219,0.25)"),
            color: showGuide ? "var(--text-muted)" : "var(--accent)",
            borderRadius: 20, padding: "4px 14px",
            fontSize: 12, fontWeight: 600, cursor: "pointer",
            fontFamily: "var(--font-body)", transition: "all 0.2s",
          }}
        >
          {showGuide ? "✕ Close" : "📖 How to get an image link"}
        </button>
      </div>

      {/* Guide panel */}
      {showGuide && (
        <div style={{
          border: "1px solid var(--border)", borderRadius: "var(--radius-lg)",
          overflow: "hidden", marginBottom: 14, animation: "slideUp 0.2s ease",
        }}>
          {/* Tab bar */}
          <div style={{ display: "flex", background: "var(--surface-3)", borderBottom: "1px solid var(--border)" }}>
            {GUIDES.map((g, i) => (
              <button key={i} type="button" onClick={() => setTab(i)} style={{
                flex: 1, padding: "10px 4px", border: "none", cursor: "pointer",
                fontFamily: "var(--font-body)", fontSize: 12,
                fontWeight: tab === i ? 700 : 400,
                background: tab === i ? "var(--surface)" : "transparent",
                color: tab === i ? g.color : "var(--text-muted)",
                borderBottom: `2px solid ${tab === i ? g.color : "transparent"}`,
                transition: "all 0.15s",
              }}>
                {g.icon}<br />
                <span style={{ fontSize: 11 }}>{g.name}</span>
              </button>
            ))}
          </div>

          {/* Step content */}
          <div style={{ padding: 16 }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 10, marginBottom: 14,
              padding: "10px 12px",
              background: GUIDES[tab].color + "12",
              borderRadius: "var(--radius-sm)",
              border: `1px solid ${GUIDES[tab].color}30`,
            }}>
              <span style={{ fontSize: 20 }}>{GUIDES[tab].icon}</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13, color: GUIDES[tab].color }}>{GUIDES[tab].name}</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{GUIDES[tab].tip}</div>
              </div>
              <a
                href={GUIDES[tab].url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  marginLeft: "auto", padding: "6px 14px",
                  background: GUIDES[tab].color, color: "#fff",
                  borderRadius: "var(--radius-sm)", fontSize: 12,
                  fontWeight: 700, textDecoration: "none", whiteSpace: "nowrap",
                  flexShrink: 0,
                }}
              >
                Open Site →
              </a>
            </div>

            {/* Steps */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
              {GUIDES[tab].steps.map((step, i) => (
                <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
                    background: GUIDES[tab].color, color: "#fff",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 11, fontWeight: 800,
                  }}>{i + 1}</div>
                  <div style={{ fontSize: 13, lineHeight: 1.55, paddingTop: 2, color: "var(--text-secondary)" }}>
                    {step}
                  </div>
                </div>
              ))}
            </div>

            {/* Example URL */}
            <div style={{
              background: "var(--surface-3)", borderRadius: "var(--radius-sm)", padding: "10px 12px",
            }}>
              <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 700, marginBottom: 6, letterSpacing: "0.5px" }}>
                EXAMPLE LINK FORMAT
              </div>
              <div style={{ fontFamily: "monospace", fontSize: 12, color: "var(--text)", wordBreak: "break-all", lineHeight: 1.5 }}>
                {GUIDES[tab].example}
              </div>
              <button type="button"
                onClick={() => tryExample(GUIDES[tab].example)}
                style={{
                  marginTop: 8, background: "var(--surface)", border: "1px solid var(--border)",
                  borderRadius: 4, padding: "4px 12px", fontSize: 11,
                  cursor: "pointer", color: "var(--accent)", fontFamily: "var(--font-body)", fontWeight: 600,
                }}>
                Test this example
              </button>
            </div>
          </div>
        </div>
      )}

      {/* URL Input */}
      <div style={{ position: "relative" }}>
        <input
          type="url"
          className="form-input"
          value={value}
          onChange={handleChange}
          placeholder="Paste your image link here — e.g. https://i.imgur.com/abc.jpg"
          style={{ borderColor, paddingRight: 42, transition: "border-color 0.2s" }}
        />
        <div style={{
          position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
          fontSize: 16, lineHeight: 1,
        }}>
          {imgStatus === "checking" && <span style={{ fontSize: 13 }}>⏳</span>}
          {imgStatus === "ok"       && <span style={{ color: "var(--success)" }}>✓</span>}
          {imgStatus === "error"    && <span style={{ color: "var(--danger)" }}>✕</span>}
        </div>
      </div>

      {/* Status feedback */}
      {imgStatus === "checking" && (
        <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 5 }}>Checking image link…</div>
      )}
      {imgStatus === "ok" && (
        <div style={{ fontSize: 12, color: "var(--success)", fontWeight: 600, marginTop: 5 }}>
          ✓ Image link is valid and working
        </div>
      )}
      {imgStatus === "error" && (
        <div style={{ fontSize: 12, color: "var(--danger)", marginTop: 5 }}>✕ {errMsg}</div>
      )}

      {/* Live preview */}
      {imgStatus === "ok" && value && (
        <div style={{ marginTop: 10 }}>
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 6, fontWeight: 700 }}>PREVIEW</div>
          <img
            src={value}
            alt="Preview"
            style={{
              width: "100%", height: 180, objectFit: "cover",
              borderRadius: "var(--radius-sm)", border: `2px solid var(--success)`,
              display: "block",
            }}
          />
        </div>
      )}

      {/* No guide hint */}
      {!showGuide && (
        <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 5 }}>
          Upload your photo to Imgur, Rojuka, or ImageBB, then paste the link here.
          <button type="button" onClick={() => setShowGuide(true)}
            style={{ background: "none", border: "none", color: "var(--accent)", cursor: "pointer", fontSize: 12, fontWeight: 600, padding: "0 0 0 4px" }}>
            Show me how →
          </button>
        </div>
      )}
    </div>
  );
}
