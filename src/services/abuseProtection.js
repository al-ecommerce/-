/**
 * ASVAN Abuse & Fraud Protection
 *
 * Protects against:
 * 1. Repeated invalid MoMo submissions (fake references)
 * 2. Rate limiting on orders, requests, offers
 * 3. Spam account creation
 * 4. Database flooding
 * 5. Malicious inputs (XSS, SQL injection-style)
 *
 * All limits are enforced CLIENT-SIDE as a first layer.
 * Firestore security rules are the BACKEND enforcement layer.
 */

import { db } from "../firebase/config";
import {
  doc, getDoc, setDoc, updateDoc, increment,
  serverTimestamp, collection, addDoc, getDocs, query, where
} from "firebase/firestore";
import { updateUserDoc } from "../firebase/db";

// ─── RATE LIMIT TRACKER ──────────────────────────────────
// Stored in Firestore: rateLimits/{uid}
// Tracks action counts per rolling window

const LIMITS = {
  momoSubmit:    { max: 3,  windowHours: 24,  label: "MoMo payment submissions" },
  orderCreate:   { max: 10, windowHours: 24,  label: "orders" },
  requestCreate: { max: 5,  windowHours: 24,  label: "requests" },
  offerCreate:   { max: 20, windowHours: 24,  label: "offers" },
  reportCreate:  { max: 5,  windowHours: 24,  label: "reports" },
  messageCreate: { max: 100,windowHours: 1,   label: "messages" },
};

/**
 * Check if user has exceeded a rate limit.
 * Returns { allowed: bool, remaining: number, resetAt: Date }
 */
export const checkRateLimit = async (uid, action) => {
  const limit  = LIMITS[action];
  if (!limit) return { allowed: true, remaining: 999 };

  const ref    = doc(db, "rateLimits", uid);
  const snap   = await getDoc(ref);
  const now    = Date.now();
  const window = limit.windowHours * 60 * 60 * 1000;

  if (!snap.exists()) {
    // First action — create record
    await setDoc(ref, {
      [action]: { count: 1, windowStart: now }
    }, { merge: true });
    return { allowed: true, remaining: limit.max - 1 };
  }

  const data   = snap.data();
  const record = data[action] || { count: 0, windowStart: now };

  // Reset window if expired
  if (now - record.windowStart > window) {
    await updateDoc(ref, {
      [`${action}.count`]:       1,
      [`${action}.windowStart`]: now,
    });
    return { allowed: true, remaining: limit.max - 1 };
  }

  // Check limit
  if (record.count >= limit.max) {
    const resetAt = new Date(record.windowStart + window);
    return {
      allowed:   false,
      remaining: 0,
      resetAt,
      message:   `Too many ${limit.label}. You can try again after ${resetAt.toLocaleTimeString()}.`,
    };
  }

  // Increment
  await updateDoc(ref, { [`${action}.count`]: increment(1) });
  return { allowed: true, remaining: limit.max - record.count - 1 };
};

// ─── MOMO FRAUD DETECTION ────────────────────────────────
/**
 * Validates a MoMo submission before saving.
 * Returns { valid: bool, reason: string }
 */
export const validateMomoSubmission = async (uid, { amount, reference, userReference, senderPhone }) => {
  // 1. Amount sanity check
  if (!amount || isNaN(amount) || amount <= 0) {
    return { valid: false, reason: "Invalid amount." };
  }
  if (amount > 50000) {
    return { valid: false, reason: "Amount exceeds maximum single transaction limit of GHS 50,000." };
  }

  // 2. Reference format checks
  if (!reference || reference.trim().length < 4) {
    return { valid: false, reason: "Transaction reference too short." };
  }
  // Block obviously fake references
  const fakePatterns = [/^(1234|0000|test|fake|abc|xyz)/i, /^(.)\1{4,}$/]; // repeating chars
  for (const pat of fakePatterns) {
    if (pat.test(userReference?.trim() || "")) {
      await logSuspiciousActivity(uid, "fake_momo_ref", { userReference, amount });
      return { valid: false, reason: "Invalid transaction reference format." };
    }
  }

  // 3. Phone number format (Ghana numbers)
  if (senderPhone) {
    const phone = senderPhone.replace(/\s/g, "");
    const ghanaPhone = /^(0|\+233)(2[0-9]{8}|5[0-9]{8}|3[0-9]{8})$/;
    if (!ghanaPhone.test(phone)) {
      return { valid: false, reason: "Please enter a valid Ghana phone number (e.g. 0244000000)." };
    }
  }

  // 4. Rate limit check
  const rateCheck = await checkRateLimit(uid, "momoSubmit");
  if (!rateCheck.allowed) {
    await logSuspiciousActivity(uid, "momo_rate_limit_hit", { amount });
    return { valid: false, reason: rateCheck.message };
  }

  return { valid: true };
};

// ─── INPUT SANITIZATION ──────────────────────────────────
/**
 * Sanitize text input — strip HTML, scripts, and dangerous patterns.
 * Used on all user-generated text before saving to Firestore.
 */
export const sanitizeText = (text, maxLength = 2000) => {
  if (!text || typeof text !== "string") return "";

  return text
    // Remove HTML tags
    .replace(/<[^>]*>/g, "")
    // Remove script patterns
    .replace(/javascript:/gi, "")
    .replace(/on\w+\s*=/gi, "")
    // Remove null bytes
    .replace(/\0/g, "")
    // Trim and limit length
    .trim()
    .slice(0, maxLength);
};

/**
 * Sanitize a price — ensure it's a valid positive number within range.
 */
export const sanitizePrice = (value, min = 1, max = 100000) => {
  const num = parseFloat(value);
  if (isNaN(num) || num < min) return null;
  if (num > max) return null;
  return Math.round(num * 100) / 100; // 2 decimal places
};

/**
 * Sanitize a URL — must be https and a known image domain or generic https.
 */
export const sanitizeImageURL = (url) => {
  if (!url || typeof url !== "string") return "";
  const trimmed = url.trim();
  if (!trimmed.startsWith("https://")) return "";
  // Block localhost and private IPs
  if (/localhost|127\.|192\.168\.|10\.\d|0\.0\.0\.0/.test(trimmed)) return "";
  return trimmed.slice(0, 500);
};

// ─── SUSPICIOUS ACTIVITY LOGGING ─────────────────────────
/**
 * Log suspicious actions to Firestore for admin review.
 */
export const logSuspiciousActivity = async (uid, type, details = {}) => {
  try {
    await addDoc(collection(db, "suspiciousActivity"), {
      uid, type, details,
      timestamp: serverTimestamp(),
      userAgent: navigator.userAgent,
    });
  } catch (e) {
    console.warn("Could not log suspicious activity:", e.message);
  }
};

// ─── AUTO-BAN CHECK ──────────────────────────────────────
/**
 * Checks suspicious activity count for a user.
 * If they've hit 5+ incidents, flag for admin review.
 */
export const checkUserTrustScore = async (uid) => {
  try {
    const snap  = await getDocs(query(collection(db, "suspiciousActivity"), where("uid", "==", uid)));
    const count = snap.size;
    if (count >= 5) {
      await updateUserDoc(uid, { flaggedForReview: true, suspiciousCount: count });
      return { flagged: true, count };
    }
    return { flagged: false, count };
  } catch (e) {
    return { flagged: false, count: 0 };
  }
};
