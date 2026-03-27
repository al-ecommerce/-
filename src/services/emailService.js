import emailjs from "emailjs-com";

// ─── CREDENTIALS ─────────────────────────────────────────
const SERVICE_ID  = "service_4s496vf";
const PUBLIC_KEY  = "neoIsEgbi-PZwadW3";
const TEMPLATE_ID = "template_2l9r3sl";

// Initialise once — required by emailjs-com v3
emailjs.init(PUBLIC_KEY);

// ─── YOUR TEMPLATE VARIABLES ─────────────────────────────
// In your EmailJS template "template_2l9r3sl", you must have:
//
//   To Email  field : {{to_email}}
//   Subject   field : {{to_subject}}
//   Body      field : {{message}}
//
// Optional (used in greeting):
//   {{to_name}}
//
// The FROM address is fixed to alecommerce123@gmail.com
// in your EmailJS service settings — no change needed here.
//
// Admin copy: payment & order emails also send to alecommerce123@gmail.com

const ADMIN_EMAIL = "alecommerce123@gmail.com";
const ADMIN_NAME  = "AlEcom Admin";

// ─── CORE SEND ───────────────────────────────────────────
// Uses emailjs.sendForm is NOT used here.
// emailjs.send() works directly with template params.
// Wrapped in try/catch — email failure NEVER crashes the app.
const send = async (toEmail, toName, subject, message) => {
  // Guard — skip if email is empty
  if (!toEmail || !toEmail.includes("@")) {
    console.warn("EmailJS skipped — invalid email:", toEmail);
    return;
  }
  try {
    const result = await emailjs.send(
      SERVICE_ID,
      TEMPLATE_ID,
      {
        to_email:   toEmail,
        to_name:    toName || "User",
        to_subject: subject,
        message:    message,
      }
      // No 4th arg needed because we called emailjs.init() above
    );
    console.log(`Email sent to ${toEmail} — status: ${result.status}`);
  } catch (err) {
    // Log the exact error text from EmailJS so you can debug in console
    console.error(
      `EmailJS ERROR → to: ${toEmail} | template: ${TEMPLATE_ID}`,
      err?.text || err?.message || err
    );
  }
};

// Admin gets a copy of important events
const adminCopy = (subject, message) =>
  send(ADMIN_EMAIL, ADMIN_NAME, `[AlEcom] ${subject}`, message);

// ─── ACCOUNT ─────────────────────────────────────────────
export const sendWelcomeEmail = (email, name) =>
  send(
    email, name,
    "Welcome to AlEcom Marketplace!",
    `Thank you for joining AlEcom, Ghana's trusted marketplace.\n\nYou can now browse products and services, post requests, and connect with verified sellers.\n\nPlease verify your email address to unlock all features.\n\nWe are glad to have you on board!`
  );

export const sendAccountDeletedEmail = (email, name) =>
  send(
    email, name,
    "Your AlEcom Account Has Been Deleted",
    `Your AlEcom account has been permanently deleted as requested.\n\nAll your data, listings, and wallet balance have been removed.\n\nIf this was a mistake, please contact support at ${ADMIN_EMAIL} immediately.`
  );

// ─── MOMO PAYMENTS ───────────────────────────────────────
export const sendMomoSubmittedEmail = (email, name, amount, reference) => {
  const msg = `Your MoMo top-up of GHS ${Number(amount).toFixed(2)} has been received and is pending verification.\n\nTransaction Reference: ${reference}\nAdmin MoMo Number: 0549548274\n\nYou will be notified once your wallet has been credited. This usually takes a few minutes.`;
  send(email, name, "MoMo Payment Received — Pending Verification", msg);
  // Admin copy so you can verify immediately
  adminCopy(
    `MoMo Payment to Verify — GHS ${Number(amount).toFixed(2)}`,
    `User: ${name}\nEmail: ${email}\nAmount: GHS ${Number(amount).toFixed(2)}\nReference: ${reference}\n\nLog in to /admin/momo to verify and credit the wallet.`
  );
};

export const sendMomoVerifiedEmail = (email, name, amount) =>
  send(
    email, name,
    "Wallet Credited — GHS " + Number(amount).toFixed(2),
    `Your MoMo payment of GHS ${Number(amount).toFixed(2)} has been verified and credited to your AlEcom wallet.\n\nYou can now use your balance to place orders on the platform.\n\nThank you for topping up!`
  );

export const sendMomoRejectedEmail = (email, name, amount, reason) =>
  send(
    email, name,
    "Payment Submission Not Verified",
    `Your MoMo payment submission of GHS ${Number(amount).toFixed(2)} could not be verified.\n\nReason: ${reason || "The transaction reference could not be matched."}\n\nIf you believe this is an error, please contact support at ${ADMIN_EMAIL} with your MoMo reference.`
  );

// ─── ORDERS ──────────────────────────────────────────────
export const sendOrderPlacedEmail = (email, name, orderId, amount, itemTitle) => {
  const ref = (orderId || "").slice(0, 8).toUpperCase();
  const msg = `Your order has been placed successfully.\n\nOrder ID: #${ref}\nItem: ${itemTitle || "Item"}\nAmount: GHS ${Number(amount).toFixed(2)}\n\nYour payment is held securely in escrow and will only be released to the seller after you confirm delivery.`;
  send(email, name, `Order Confirmed — #${ref}`, msg);
  adminCopy(
    `New Order #${ref} — GHS ${Number(amount).toFixed(2)}`,
    `Buyer: ${name} (${email})\nItem: ${itemTitle}\nOrder: #${ref}\nAmount: GHS ${Number(amount).toFixed(2)}`
  );
};

export const sendOrderReceivedEmail = (email, name, orderId, itemTitle, buyerName) => {
  const ref = (orderId || "").slice(0, 8).toUpperCase();
  send(
    email, name,
    `New Order Received — #${ref}`,
    `You have a new order!\n\nOrder ID: #${ref}\nItem: ${itemTitle || "Item"}\nBuyer: ${buyerName}\n\nPlease fulfil this order promptly. Payment is held in escrow and released to your wallet once the buyer confirms delivery.`
  );
};

export const sendOrderCompletedEmail = (email, name, orderId, amount) => {
  const ref = (orderId || "").slice(0, 8).toUpperCase();
  send(
    email, name,
    `Payment Released — GHS ${Number(amount).toFixed(2)}`,
    `Order #${ref} has been completed.\n\nGHS ${Number(amount).toFixed(2)} has been released from escrow and credited to your AlEcom wallet.\n\nThank you for selling on AlEcom!`
  );
};

// ─── SELLER ──────────────────────────────────────────────
export const sendSellerApprovalEmail = (email, name, approved) =>
  send(
    email, name,
    approved ? "Seller Account Approved!" : "Seller Application Update",
    approved
      ? `Congratulations ${name}! Your seller account on AlEcom has been approved.\n\nYou can now list products and services, receive orders, and get paid directly to your wallet.\n\nLog in to your Seller Dashboard to get started.`
      : `Thank you for applying to sell on AlEcom.\n\nUnfortunately your application was not approved at this time. Please ensure your profile is complete and contact support if you have questions.`
  );

export const sendProductApprovedEmail = (email, name, productTitle) =>
  send(
    email, name,
    `Product Approved — "${productTitle}"`,
    `Your product "${productTitle}" has been reviewed and approved by the AlEcom team.\n\nIt is now live on the marketplace and visible to all buyers.\n\nLog in to view your listing and start receiving orders!`
  );

// ─── REQUESTS & OFFERS ───────────────────────────────────
export const sendRequestPostedEmail = (email, name, requestTitle) =>
  send(
    email, name,
    `Request Posted — "${requestTitle}"`,
    `Your request "${requestTitle}" is now live on AlEcom.\n\nSellers will start sending you offers shortly. You will be notified by email when an offer arrives.`
  );

export const sendOfferReceivedEmail = (email, name, requestTitle, sellerName, offerPrice) =>
  send(
    email, name,
    `New Offer — GHS ${Number(offerPrice).toFixed(2)}`,
    `${sellerName} has sent you an offer on your request!\n\nRequest: "${requestTitle}"\nOffer Price: GHS ${Number(offerPrice).toFixed(2)}\nFrom: ${sellerName}\n\nLog in to review and accept the offer.`
  );

// ─── WITHDRAWALS ─────────────────────────────────────────
export const sendWithdrawalApprovedEmail = (email, name, amount) => {
  send(
    email, name,
    `Withdrawal Approved — GHS ${Number(amount).toFixed(2)}`,
    `Your withdrawal of GHS ${Number(amount).toFixed(2)} has been approved and is being processed to your account.\n\nPlease allow up to 24 hours for the transfer to complete.\n\nThank you for using AlEcom.`
  );
  adminCopy(
    `Withdrawal Processed — GHS ${Number(amount).toFixed(2)}`,
    `User: ${name} (${email})\nAmount: GHS ${Number(amount).toFixed(2)}`
  );
};

// ─── ANNOUNCEMENTS ───────────────────────────────────────
export const sendAnnouncementEmail = (email, name, subject, message) =>
  send(email, name, subject, message);

// ─── ACCOUNT ACTIONS ─────────────────────────────────────
export const sendSuspensionEmail = (email, name, reason) =>
  send(
    email, name,
    "Account Suspended — Action Required",
    `Your AlEcom account has been temporarily suspended.\n\nReason: ${reason || "Violation of platform terms."}\n\nIf you believe this is an error, please contact support at ${ADMIN_EMAIL}.`
  );
