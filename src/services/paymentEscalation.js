/**
 * Payment Escalation Service
 *
 * Checks for MoMo payments that have been pending too long
 * and sends escalation emails to admin.
 *
 * Call this once on app startup from AuthContext or App.jsx.
 * It runs a check every 15 minutes while the admin is logged in.
 */

import { getAllMomoPayments } from "../firebase/db";
import { sendAnnouncementEmail } from "./emailService";

const ADMIN_EMAIL = "alecommerce123@gmail.com";

const THRESHOLDS = [
  { minutes: 30,  label: "30 minutes",  escalationKey: "notified_30m"  },
  { minutes: 120, label: "2 hours",     escalationKey: "notified_2h"   },
  { minutes: 240, label: "4 hours",     escalationKey: "notified_4h"   },
];

// Track which payments we've already sent escalations for (in memory)
const escalated = new Set();

export const checkPendingPayments = async () => {
  try {
    const payments = await getAllMomoPayments();
    const pending  = payments.filter(p => p.status === "pending");
    const now      = Date.now();

    for (const payment of pending) {
      const created = payment.createdAt?.seconds
        ? payment.createdAt.seconds * 1000
        : Date.now();
      const ageMin = Math.floor((now - created) / 60000);

      for (const threshold of THRESHOLDS) {
        const key = `${payment.id}_${threshold.escalationKey}`;
        if (ageMin >= threshold.minutes && !escalated.has(key)) {
          escalated.add(key);

          const subject = `⚡ URGENT: MoMo Payment Pending ${threshold.label} — GHS ${Number(payment.amount).toFixed(2)}`;
          const message = `A MoMo payment has been waiting for verification for ${threshold.label}.\n\n` +
            `User: ${payment.userName} (${payment.userEmail})\n` +
            `Amount: GHS ${Number(payment.amount).toFixed(2)}\n` +
            `Reference: ${payment.reference}\n` +
            `Submitted: ${new Date(created).toLocaleString()}\n` +
            `Type: ${payment.type === "checkout" ? "Product/Service Order" : "Wallet Top-up"}\n\n` +
            `Please log in to the admin panel and verify this payment at /admin/momo\n\n` +
            `If you are unable to verify right now, the buyer has been notified of the delay.\n` +
            `Their payment is safe in escrow and will not be lost.`;

          await sendAnnouncementEmail(ADMIN_EMAIL, "AlEcom Admin", subject, message);

          console.log(`[Escalation] Sent ${threshold.label} alert for payment ${payment.id}`);
        }
      }
    }
  } catch (e) {
    console.warn("Payment escalation check failed:", e.message);
  }
};

// Start the periodic checker (every 15 minutes)
export const startEscalationService = () => {
  // Run immediately on start
  checkPendingPayments();
  // Then every 15 minutes
  const interval = setInterval(checkPendingPayments, 15 * 60 * 1000);
  // Return cleanup function
  return () => clearInterval(interval);
};
