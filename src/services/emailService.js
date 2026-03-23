import emailjs from "emailjs-com";

const SERVICE_ID = "YOUR_EMAILJS_SERVICE_ID";
const PUBLIC_KEY = "YOUR_EMAILJS_PUBLIC_KEY";

const TEMPLATES = {
  welcome: "template_welcome",
  sellerApproval: "template_seller_approval",
  orderPlaced: "template_order_placed",
  orderCompleted: "template_order_completed",
  withdrawalApproved: "template_withdrawal_approved",
  announcement: "template_announcement",
  passwordReset: "template_password_reset",
  verification: "template_verification"
};

const send = (templateId, params) =>
  emailjs.send(SERVICE_ID, templateId, params, PUBLIC_KEY);

export const sendWelcomeEmail = (email, name) =>
  send(TEMPLATES.welcome, { to_email: email, to_name: name });

export const sendSellerApprovalEmail = (email, name, status) =>
  send(TEMPLATES.sellerApproval, { to_email: email, to_name: name, status });

export const sendOrderPlacedEmail = (email, name, orderId, amount) =>
  send(TEMPLATES.orderPlaced, { to_email: email, to_name: name, order_id: orderId, amount });

export const sendOrderCompletedEmail = (email, name, orderId) =>
  send(TEMPLATES.orderCompleted, { to_email: email, to_name: name, order_id: orderId });

export const sendWithdrawalApprovedEmail = (email, name, amount) =>
  send(TEMPLATES.withdrawalApproved, { to_email: email, to_name: name, amount });

export const sendAnnouncementEmail = (email, name, subject, message) =>
  send(TEMPLATES.announcement, { to_email: email, to_name: name, subject, message });

export const sendVerificationEmail = (email, name, code) =>
  send(TEMPLATES.verification, { to_email: email, to_name: name, code });
