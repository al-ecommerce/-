import emailjs from "emailjs-com";

// ─── CONFIGURATION ────────────────────────────────────────
// Replace these with your actual EmailJS credentials
const SERVICE_ID  = "YOUR_EMAILJS_SERVICE_ID";   // e.g. "service_abc123"
const PUBLIC_KEY  = "YOUR_EMAILJS_PUBLIC_KEY";    // e.g. "user_xxxxxxxxxxx"

// ─── TEMPLATE IDs ─────────────────────────────────────────
// Create each of these templates in your EmailJS dashboard.
// Template variables available in all templates: {{to_name}}, {{to_email}}
const T = {
  welcome:          "template_welcome",           // on signup
  payment:          "template_payment",           // on any wallet credit/debit
  momoSubmitted:    "template_momo_submitted",    // user submits MoMo proof
  momoVerified:     "template_momo_verified",     // admin verifies MoMo
  momoRejected:     "template_momo_rejected",     // admin rejects MoMo
  orderPlaced:      "template_order_placed",      // buyer places order
  orderReceived:    "template_order_received",    // seller gets new order
  orderCompleted:   "template_order_completed",   // delivery confirmed
  sellerApproval:   "template_seller_approval",   // seller approved/rejected
  productApproved:  "template_product_approved",  // product goes live
  withdrawal:       "template_withdrawal",        // withdrawal approved
  announcement:     "template_announcement",      // admin broadcast
  requestPosted:    "template_request_posted",    // new request posted
  offerReceived:    "template_offer_received",    // buyer gets an offer
};

// ─── SAFE SEND ────────────────────────────────────────────
// Wraps every send in try/catch so email failures never break the app
const send = async (templateId, params) => {
  try {
    await emailjs.send(SERVICE_ID, templateId, params, PUBLIC_KEY);
  } catch (e) {
    // Log silently — never crash the app because email failed
    console.warn(`EmailJS send failed [${templateId}]:`, e?.text || e?.message || e);
  }
};

// ─── ACCOUNT EMAILS ───────────────────────────────────────
export const sendWelcomeEmail = (email, name) =>
  send(T.welcome, {
    to_email: email,
    to_name: name,
    platform_name: "ASVAN",
    login_url: window.location.origin,
  });

// ─── MOMO PAYMENT EMAILS ──────────────────────────────────
export const sendMomoSubmittedEmail = (email, name, amount, reference) =>
  send(T.momoSubmitted, {
    to_email: email,
    to_name: name,
    amount: `GHS ${Number(amount).toFixed(2)}`,
    reference,
    admin_number: "0549548274",
    message: `Your MoMo top-up of GHS ${Number(amount).toFixed(2)} has been received and is being verified. Reference: ${reference}. You will be notified once your wallet is credited.`,
  });

export const sendMomoVerifiedEmail = (email, name, amount) =>
  send(T.momoVerified, {
    to_email: email,
    to_name: name,
    amount: `GHS ${Number(amount).toFixed(2)}`,
    message: `Great news! Your MoMo payment of GHS ${Number(amount).toFixed(2)} has been verified and credited to your ASVAN wallet. You can now shop and place orders.`,
  });

export const sendMomoRejectedEmail = (email, name, amount, reason) =>
  send(T.momoRejected, {
    to_email: email,
    to_name: name,
    amount: `GHS ${Number(amount).toFixed(2)}`,
    reason: reason || "The payment reference could not be verified.",
    message: `Your MoMo top-up request for GHS ${Number(amount).toFixed(2)} was not verified. Reason: ${reason || "Could not verify payment reference."}. Please contact support if you believe this is an error.`,
  });

// ─── ORDER EMAILS ─────────────────────────────────────────
export const sendOrderPlacedEmail = (email, name, orderId, amount) =>
  send(T.orderPlaced, {
    to_email: email,
    to_name: name,
    order_id: orderId?.slice(0, 8)?.toUpperCase(),
    amount: `GHS ${Number(amount).toFixed(2)}`,
    message: `Your order has been placed successfully. Order ID: #${orderId?.slice(0,8)?.toUpperCase()}. Amount: GHS ${Number(amount).toFixed(2)}. Your payment is held in escrow and will be released to the seller once you confirm delivery.`,
  });

export const sendOrderReceivedEmail = (email, name, orderId, itemTitle, buyerName) =>
  send(T.orderReceived, {
    to_email: email,
    to_name: name,
    order_id: orderId?.slice(0, 8)?.toUpperCase(),
    item_title: itemTitle,
    buyer_name: buyerName,
    message: `You have a new order! ${buyerName} ordered "${itemTitle}". Order ID: #${orderId?.slice(0,8)?.toUpperCase()}. Please fulfil this order promptly.`,
  });

export const sendOrderCompletedEmail = (email, name, orderId, amount) =>
  send(T.orderCompleted, {
    to_email: email,
    to_name: name,
    order_id: orderId?.slice(0, 8)?.toUpperCase(),
    amount: `GHS ${Number(amount).toFixed(2)}`,
    message: `Order #${orderId?.slice(0,8)?.toUpperCase()} has been completed. GHS ${Number(amount).toFixed(2)} has been credited to your ASVAN wallet.`,
  });

// ─── SELLER EMAILS ────────────────────────────────────────
export const sendSellerApprovalEmail = (email, name, status) =>
  send(T.sellerApproval, {
    to_email: email,
    to_name: name,
    status,
    message: status === "approved"
      ? `Congratulations ${name}! Your seller account on ASVAN has been approved. You can now list products and services.`
      : `Your seller application has been reviewed. Unfortunately it was not approved at this time. Contact support for details.`,
  });

export const sendProductApprovedEmail = (email, name, productTitle) =>
  send(T.productApproved, {
    to_email: email,
    to_name: name,
    product_title: productTitle,
    message: `Your product "${productTitle}" has been approved by our team and is now live on ASVAN for buyers to see.`,
  });

// ─── WITHDRAWAL EMAIL ─────────────────────────────────────
export const sendWithdrawalApprovedEmail = (email, name, amount) =>
  send(T.withdrawal, {
    to_email: email,
    to_name: name,
    amount: `GHS ${Number(amount).toFixed(2)}`,
    message: `Your withdrawal request of GHS ${Number(amount).toFixed(2)} has been approved and is being processed to your account.`,
  });

// ─── REQUEST / OFFER EMAILS ───────────────────────────────
export const sendRequestPostedEmail = (email, name, requestTitle) =>
  send(T.requestPosted, {
    to_email: email,
    to_name: name,
    request_title: requestTitle,
    message: `Your request "${requestTitle}" is now live on ASVAN. Sellers will start sending you offers shortly.`,
  });

export const sendOfferReceivedEmail = (email, name, requestTitle, sellerName, offerPrice) =>
  send(T.offerReceived, {
    to_email: email,
    to_name: name,
    request_title: requestTitle,
    seller_name: sellerName,
    offer_price: `GHS ${Number(offerPrice).toFixed(2)}`,
    message: `${sellerName} sent you an offer of GHS ${Number(offerPrice).toFixed(2)} for your request "${requestTitle}". Log in to review and accept.`,
  });

// ─── ADMIN ANNOUNCEMENT ───────────────────────────────────
export const sendAnnouncementEmail = (email, name, subject, message) =>
  send(T.announcement, {
    to_email: email,
    to_name: name,
    subject,
    message,
  });
