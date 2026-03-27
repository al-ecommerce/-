import emailjs from "emailjs-com";

// ─── YOUR EMAILJS CREDENTIALS ────────────────────────────
// Replace with your actual values from emailjs.com dashboard
export const SERVICE_ID = "service_30gqve5";
export const PUBLIC_KEY = "template_2l9r3sl";

// ─── SINGLE TEMPLATE ─────────────────────────────────────
// You only need ONE template in EmailJS: template_main
// Template fields:
//   To:       {{to_email}}
//   Subject:  {{to_subject}}
//   Body:     Hi {{to_name}}, \n\n {{message}} \n\n — ASVAN Team
//
// The "From" email in EmailJS is fixed to alecommerce123@gmail.com
// (set this in your EmailJS email service settings)
const TEMPLATE = "template_main";

// Admin email — receives a copy of all payment & order events
const ADMIN_EMAIL = "alecommerce123@gmail.com";
const ADMIN_NAME  = "ASVAN Admin";

// ─── CORE SEND ────────────────────────────────────────────
// Never throws — email failure must never crash the app
const send = async (toEmail, toName, subject, message) => {
  try {
    await emailjs.send(SERVICE_ID, Asvan, {
      to_email:   toEmail,
      to_name:    toName,
      to_subject: subject,
      message,
    }, PUBLIC_KEY);
  } catch (e) {
    console.warn("EmailJS failed:", e?.text || e?.message || e);
  }
};

// Admin copy — sends a second email to the admin inbox
const adminCopy = (subject, message) =>
  send(ADMIN_EMAIL, ADMIN_NAME, `[ASVAN Copy] ${subject}`, message);

// ─── ACCOUNT ─────────────────────────────────────────────
export const sendWelcomeEmail = (email, name) =>
  send(email, name,
    "Welcome to ASVAN Marketplace! 🎉",
    `Thank you for joining ASVAN, Ghana's trusted marketplace.\n\nYou can now browse products and services, post requests, and connect with verified sellers.\n\nPlease verify your email address to unlock all features.\n\nWe're glad to have you!`
  );

export const sendAccountDeletedEmail = (email, name) =>
  send(email, name,
    "Your ASVAN Account Has Been Deleted",
    `Hi ${name},\n\nYour ASVAN account has been permanently deleted as requested.\n\nAll your data, listings, and wallet balance have been removed.\n\nIf this was a mistake or you didn't request this, please contact support immediately at ${ADMIN_EMAIL}.\n\nWe're sorry to see you go.`
  );

// ─── PAYMENTS — user + admin copy ────────────────────────
export const sendMomoSubmittedEmail = (email, name, amount, reference) => {
  const msg = `Your MoMo top-up of GHS ${Number(amount).toFixed(2)} has been received and is pending verification.\n\nTransaction Reference: ${reference}\nAdmin MoMo Number: 0549548274\n\nYou will receive another notification once your wallet has been credited. This usually takes a few minutes.`;
  send(email, name, "MoMo Payment Received — Pending Verification", msg);
  adminCopy(`MoMo Payment Submitted — GHS ${Number(amount).toFixed(2)}`,
    `User: ${name} (${email})\nAmount: GHS ${Number(amount).toFixed(2)}\nReference: ${reference}\n\nPlease verify this payment in the admin panel at /admin/momo`
  );
};

export const sendMomoVerifiedEmail = (email, name, amount) => {
  const msg = `Great news! Your MoMo payment of GHS ${Number(amount).toFixed(2)} has been verified and credited to your ASVAN wallet.\n\nYou can now use your wallet to place orders on the platform.\n\nThank you for topping up!`;
  send(email, name, "✅ Wallet Credited — GHS " + Number(amount).toFixed(2), msg);
};

export const sendMomoRejectedEmail = (email, name, amount, reason) => {
  const msg = `Unfortunately, your MoMo payment submission of GHS ${Number(amount).toFixed(2)} could not be verified.\n\nReason: ${reason || "The transaction reference provided could not be matched."}\n\nIf you believe this is an error, please contact support and provide your MoMo reference number.\n\nSupport: ${ADMIN_EMAIL}`;
  send(email, name, "Payment Submission Not Verified", msg);
};

// ─── ORDERS — user + admin copy ──────────────────────────
export const sendOrderPlacedEmail = (email, name, orderId, amount, itemTitle) => {
  const ref = orderId?.slice(0, 8)?.toUpperCase();
  const msg = `Your order has been placed successfully!\n\nOrder ID: #${ref}\nItem: ${itemTitle}\nAmount: GHS ${Number(amount).toFixed(2)}\n\nYour payment is held securely in escrow and will only be released to the seller after you confirm delivery.\n\nYou can track your order in the Orders section of your account.`;
  send(email, name, `Order Confirmed — #${ref}`, msg);
  adminCopy(`New Order #${ref} — GHS ${Number(amount).toFixed(2)}`,
    `Buyer: ${name} (${email})\nItem: ${itemTitle}\nOrder ID: #${ref}\nAmount: GHS ${Number(amount).toFixed(2)}`
  );
};

export const sendOrderReceivedEmail = (email, name, orderId, itemTitle, buyerName) => {
  const ref = orderId?.slice(0, 8)?.toUpperCase();
  const msg = `You have a new order!\n\nOrder ID: #${ref}\nItem: "${itemTitle}"\nBuyer: ${buyerName}\n\nPlease fulfil this order promptly. Payment is held in escrow and will be released to your wallet once the buyer confirms delivery.\n\nLog in to view the full order details.`;
  send(email, name, `New Order Received — #${ref}`, msg);
};

export const sendOrderCompletedEmail = (email, name, orderId, amount) => {
  const ref = orderId?.slice(0, 8)?.toUpperCase();
  const msg = `Order #${ref} has been completed!\n\nGHS ${Number(amount).toFixed(2)} has been released from escrow and credited to your ASVAN wallet.\n\nThank you for selling on ASVAN.`;
  send(email, name, `Payment Released — GHS ${Number(amount).toFixed(2)}`, msg);
};

// ─── SELLER ───────────────────────────────────────────────
export const sendSellerApprovalEmail = (email, name, approved) => {
  const msg = approved
    ? `Congratulations ${name}! Your seller account on ASVAN has been approved.\n\nYou can now list products and services, receive orders, and get paid directly to your wallet.\n\nLog in to your Seller Dashboard to get started.`
    : `Thank you for applying to sell on ASVAN.\n\nUnfortunately, your seller application was not approved at this time.\n\nPlease ensure your profile is complete and contact support if you have questions.`;
  send(email, name, approved ? "🎉 Seller Account Approved!" : "Seller Application Update", msg);
};

export const sendProductApprovedEmail = (email, name, productTitle) => {
  const msg = `Your product "${productTitle}" has been reviewed and approved by the ASVAN team.\n\nIt is now live on the marketplace and visible to all buyers.\n\nLog in to view your listing and start receiving orders!`;
  send(email, name, `Product Approved — "${productTitle}"`, msg);
};

// ─── REQUESTS & OFFERS ───────────────────────────────────
export const sendRequestPostedEmail = (email, name, requestTitle) => {
  const msg = `Your request "${requestTitle}" is now live on ASVAN.\n\nSellers will start sending you offers shortly. You will be notified by email when an offer arrives.\n\nYou can view and manage your request from the Requests page.`;
  send(email, name, `Request Posted — "${requestTitle}"`, msg);
};

export const sendOfferReceivedEmail = (email, name, requestTitle, sellerName, offerPrice) => {
  const msg = `${sellerName} has sent you an offer on your request!\n\nRequest: "${requestTitle}"\nOffer Price: GHS ${Number(offerPrice).toFixed(2)}\nFrom: ${sellerName}\n\nLog in to review the offer details and accept if it meets your requirements.`;
  send(email, name, `New Offer Received — GHS ${Number(offerPrice).toFixed(2)}`, msg);
};

// ─── WITHDRAWALS ─────────────────────────────────────────
export const sendWithdrawalApprovedEmail = (email, name, amount) => {
  const msg = `Your withdrawal request of GHS ${Number(amount).toFixed(2)} has been approved.\n\nThe funds are being processed to your registered payment account. Please allow up to 24 hours for the transfer to complete.\n\nThank you for using ASVAN.`;
  send(email, name, `Withdrawal Approved — GHS ${Number(amount).toFixed(2)}`, msg);
  adminCopy(`Withdrawal Processed — GHS ${Number(amount).toFixed(2)}`,
    `User: ${name} (${email})\nAmount: GHS ${Number(amount).toFixed(2)}`
  );
};

// ─── ADMIN ANNOUNCEMENT ───────────────────────────────────
export const sendAnnouncementEmail = (email, name, subject, message) =>
  send(email, name, subject, message);

// ─── ACCOUNT ACTIONS ─────────────────────────────────────
export const sendSuspensionEmail = (email, name, reason) => {
  const msg = `Your ASVAN account has been temporarily suspended.\n\nReason: ${reason || "Violation of platform terms."}\n\nIf you believe this is an error, please contact support at ${ADMIN_EMAIL}.`;
  send(email, name, "Account Suspended — Action Required", msg);
};
