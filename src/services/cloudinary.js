/**
 * Cloudinary Upload Utility
 * ─────────────────────────
 * Only uses CLOUD_NAME and UPLOAD_PRESET on the client.
 * API Key and API Secret are NEVER used here — they stay server-side.
 *
 * Setup:
 *  1. Create an unsigned upload preset in Cloudinary dashboard:
 *     Settings → Upload → Upload Presets → Add preset → Signing mode: Unsigned
 *     Set folder to "products"
 *  2. Add to your .env file:
 *     VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
 *     VITE_CLOUDINARY_UPLOAD_PRESET=your_upload_preset
 */

const CLOUD_NAME    = process.env.REACT_APP_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET;
const UPLOAD_URL    = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

// ─── VALIDATION ───────────────────────────────────────────
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE_MB   = 10;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

/**
 * Validate file before upload.
 * Returns { valid: true } or { valid: false, error: string }
 */
export const validateImageFile = (file) => {
  if (!file) return { valid: false, error: "No file provided" };
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, error: `Invalid file type. Allowed: JPG, PNG, WEBP, GIF` };
  }
  if (file.size > MAX_SIZE_BYTES) {
    return { valid: false, error: `File too large. Maximum size is ${MAX_SIZE_MB}MB` };
  }
  return { valid: true };
};

// ─── CLIENT-SIDE COMPRESSION ──────────────────────────────
/**
 * Compress and resize an image file before upload.
 * Target: max 1200px wide, 80% JPEG quality.
 * Returns a Blob ready for upload.
 */
export const compressImage = (file, maxWidth = 1200, quality = 0.82) => {
  return new Promise((resolve, reject) => {
    // Skip compression for small files (<200KB) — not worth it
    if (file.size < 200 * 1024) { resolve(file); return; }

    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas  = document.createElement("canvas");
      const scale   = Math.min(1, maxWidth / img.width);
      canvas.width  = Math.round(img.width  * scale);
      canvas.height = Math.round(img.height * scale);

      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // Use webp if browser supports it (better compression), else jpeg
      const outputType = file.type === "image/png" ? "image/png" : "image/webp";
      canvas.toBlob(
        (blob) => {
          if (!blob) { resolve(file); return; } // fallback to original
          resolve(blob);
        },
        outputType,
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to read image for compression"));
    };

    img.src = url;
  });
};

// ─── SINGLE UPLOAD ────────────────────────────────────────
/**
 * Upload a single image file to Cloudinary.
 *
 * @param {File|Blob} file       - The image file to upload
 * @param {Object}    options    - Optional: { folder, onProgress }
 * @returns {Promise<string>}    - Resolves with the secure_url
 * @throws  {Error}              - If upload fails
 */
export const uploadImage = async (file, options = {}) => {
  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    throw new Error(
      "Cloudinary is not configured. " +
      "Add VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET to your .env file."
    );
  }

  // Validate
  const check = validateImageFile(file);
  if (!check.valid) throw new Error(check.error);

  // Compress
  let fileToUpload;
  try {
    fileToUpload = await compressImage(file);
  } catch {
    fileToUpload = file; // compression failed, use original
  }

  // Build form data
  const formData = new FormData();
  formData.append("file",           fileToUpload);
  formData.append("upload_preset",  UPLOAD_PRESET);
  formData.append("folder",         options.folder || "products");

  // Upload with optional progress tracking
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", UPLOAD_URL, true);

    if (options.onProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          options.onProgress(Math.round((e.loaded / e.total) * 100));
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          if (data.secure_url) {
            resolve(data.secure_url);
          } else {
            reject(new Error("Cloudinary did not return a secure_url"));
          }
        } catch {
          reject(new Error("Invalid response from Cloudinary"));
        }
      } else {
        let errMsg = `Upload failed (HTTP ${xhr.status})`;
        try {
          const errData = JSON.parse(xhr.responseText);
          errMsg = errData.error?.message || errMsg;
        } catch {}
        reject(new Error(errMsg));
      }
    };

    xhr.onerror    = () => reject(new Error("Network error during upload. Check your connection."));
    xhr.onabort    = () => reject(new Error("Upload was cancelled."));
    xhr.ontimeout  = () => reject(new Error("Upload timed out. Try again."));
    xhr.timeout    = 60000; // 60-second timeout

    xhr.send(formData);
  });
};

// ─── BATCH UPLOAD ─────────────────────────────────────────
/**
 * Upload multiple images sequentially.
 * Stops and throws on first failure — product is NOT saved if any upload fails.
 *
 * @param {File[]}   files       - Array of image files
 * @param {Object}   options     - Optional: { folder, onFileProgress, onOverallProgress }
 * @returns {Promise<string[]>}  - Array of secure_urls in the same order as files
 * @throws  {Error}              - If any upload fails (includes which file number failed)
 */
export const uploadImages = async (files, options = {}) => {
  if (!files || files.length === 0) return [];
  if (files.length > 5) throw new Error("Maximum 5 images allowed per product");

  const urls = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    try {
      const url = await uploadImage(file, {
        folder:     options.folder || "products",
        onProgress: (pct) => {
          if (options.onFileProgress) options.onFileProgress(i, pct);
          if (options.onOverallProgress) {
            const overall = Math.round(((i + pct / 100) / files.length) * 100);
            options.onOverallProgress(overall);
          }
        },
      });
      urls.push(url);
    } catch (err) {
      // Fail fast — caller must not save partial product data
      throw new Error(
        `Image ${i + 1} of ${files.length} failed to upload: ${err.message}`
      );
    }
  }

  return urls;
};

// ─── CONFIGURATION CHECK ──────────────────────────────────
/**
 * Returns true if Cloudinary credentials are present.
 * Use this to show a warning in dev if .env is not configured.
 */
export const isCloudinaryConfigured = () =>
  Boolean(CLOUD_NAME && UPLOAD_PRESET);
