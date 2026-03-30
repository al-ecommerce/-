import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/UI";

const SECTIONS = [
  {
    id: "account",
    title: "Getting Started",
    icon: "👤",
    color: "#4F7CFF",
    steps: [
      { title: "Create an Account", desc: "Click 'Sign Up' and fill in your name, email, and password. Your account is free.", icon: "✍️" },
      { title: "Verify Your Email", desc: "Check your inbox for a verification email from ASVAN and click the link to activate your account.", icon: "📧" },
      { title: "Complete Your Profile", desc: "Add your photo, location, and bio to build trust with other users.", icon: "✅" },
    ]
  },
  {
    id: "seller",
    title: "Becoming a Seller",
    icon: "🏪",
    color: "#10B981",
    steps: [
      { title: "Activate Seller Account", desc: "Go to Seller Dashboard and click 'Activate Seller Account'. It's completely free.", icon: "🔓" },
      { title: "Create Your First Listing", desc: "Add a product or service with clear photos, detailed description, and fair pricing.", icon: "📝" },
      { title: "Wait for Admin Approval", desc: "All listings are reviewed by our team before going live to ensure quality and authenticity.", icon: "⏳" },
      { title: "Get Verified", desc: "Apply for seller verification to build trust and get a verified badge on your listings.", icon: "✓" },
    ]
  },
  {
    id: "buying",
    title: "Buying & Ordering",
    icon: "🛒",
    color: "#F59E0B",
    steps: [
      { title: "Browse Listings", desc: "Search products and services by category, price, or keywords.", icon: "🔍" },
      { title: "Fund Your Wallet", desc: "Add funds to your ASVAN wallet using Mobile Money or bank transfer.", icon: "💰" },
      { title: "Place an Order", desc: "Click 'Buy Now' on a product/service. Payment is held in escrow — not released until delivery.", icon: "🛒" },
      { title: "Confirm Delivery", desc: "After receiving your item, click 'Confirm Delivery' to release payment to the seller.", icon: "✓" },
    ]
  },
  {
    id: "escrow",
    title: "How Escrow Works",
    icon: "🔒",
    color: "#6B48FF",
    steps: [
      { title: "Payment Held Securely", desc: "When you pay, funds go into escrow — a secure holding account controlled by ASVAN.", icon: "🔒" },
      { title: "Seller Delivers", desc: "The seller fulfills the order knowing payment is secured and will be released upon delivery.", icon: "📦" },
      { title: "You Confirm", desc: "After receiving and verifying your order, confirm delivery in the order page.", icon: "✅" },
      { title: "Funds Released", desc: "Payment is released to the seller's wallet minus platform commission.", icon: "💸" },
    ]
  },
  {
    id: "requests",
    title: "Requests & Offers",
    icon: "📋",
    color: "#EF4444",
    steps: [
      { title: "Post a Request", desc: "Can't find what you need? Post a request describing what you're looking for and your budget.", icon: "📋" },
      { title: "Receive Offers", desc: "Sellers will send you offers with their price and delivery time.", icon: "💬" },
      { title: "Accept the Best Offer", desc: "Review offers and accept the one that best meets your needs.", icon: "✓" },
      { title: "Place Order", desc: "Once accepted, the offer converts to an order with full escrow protection.", icon: "🛒" },
    ]
  },
  {
    id: "scams",
    title: "Avoiding Scams",
    icon: "⚠️",
    color: "#EF4444",
    steps: [
      { title: "Never Pay Outside ASVAN", desc: "Scammers may ask for Mobile Money payments directly. Always pay through the platform.", icon: "🚫" },
      { title: "Too Good to Be True", desc: "If a price is extremely low or an offer seems unrealistic, proceed with caution.", icon: "⚠️" },
      { title: "Don't Share Personal Info", desc: "Never share your password, bank details, or national ID with anyone on the platform.", icon: "🔐" },
      { title: "Verify Before Confirming", desc: "Only confirm delivery after you've physically received and tested your item.", icon: "✅" },
    ]
  },
  {
    id: "wallet",
    title: "Wallet & Withdrawals",
    icon: "💰",
    color: "#10B981",
    steps: [
      { title: "Wallet Overview", desc: "Your wallet stores your ASVAN balance. All transactions are tracked here.", icon: "💰" },
      { title: "Adding Funds", desc: "Top up via Mobile Money (MTN, Vodafone, AirtelTigo) or bank transfer.", icon: "➕" },
      { title: "Withdrawing", desc: "Request a withdrawal from your wallet. Admin approves within 24 hours. A small fee applies.", icon: "💸" },
      { title: "Installments", desc: "Pay for large purchases in installments. First payment locks your order; remaining paid monthly.", icon: "📅" },
    ]
  },
  {
    id: "safety",
    title: "Safety Tips",
    icon: "🛡️",
    color: "#F59E0B",
    steps: [
      { title: "Always Use Escrow", desc: "Never pay outside of ASVAN. Escrow protects both buyers and sellers.", icon: "🔒" },
      { title: "Verify Sellers", desc: "Look for the verified badge. Verified sellers have been identity-checked by our team.", icon: "✓" },
      { title: "Read Reviews", desc: "Check seller ratings and reviews before placing an order.", icon: "⭐" },
      { title: "Report Suspicious Activity", desc: "See a scam? Click the Report button on any listing or user profile.", icon: "🚩" },
    ]
  },
  {
    id: "delivery",
    title: "Confirming Delivery",
    icon: "✅",
    color: "#059669",
    steps: [
      { title: "When to Confirm", desc: "Confirm delivery ONLY after you have physically received and inspected the item. Check that it matches the listing description, is in the right condition, and works correctly.", icon: "🔍" },
      { title: "How to Confirm", desc: "Go to Orders → click the order → find the green 'Confirm Delivery' button. Click it to release escrow funds to the seller. This action is permanent and cannot be undone.", icon: "✅" },
      { title: "If Something Is Wrong", desc: "Do NOT confirm if you have a problem. Instead click 'Raise Dispute'. This freezes the payment so nobody gets it until admin resolves the issue.", icon: "⚠️" },
      { title: "Auto-Release (7 Days)", desc: "If you do not confirm OR dispute within 7 days of the seller marking delivery, payment is automatically released to the seller. You will receive email reminders to act.", icon: "⏱" },
      { title: "Dispute Window", desc: "You have 7 days from when the seller marks delivery to raise a dispute. After that, the payment is final and cannot be reversed.", icon: "📅" },
      { title: "Seller's Role", desc: "Sellers can mark orders as 'Delivered' from their order page. They can also request admin review if you do not respond. Admin may auto-release funds after 7 days.", icon: "🏪" },
    ]
  },
  {
    id: "password",
    title: "Account & Password",
    icon: "🔐",
    color: "#7C3AED",
    steps: [
      { title: "Forgot Your Password?", desc: "On the Login page, click 'Forgot password?' next to the password field. You will be taken to a dedicated page where you enter your email and receive a reset link.", icon: "🔑" },
      { title: "Reset Link Email", desc: "Check your inbox (and spam/junk folder) for an email from ASVAN. Click the link in the email — it opens a page where you create a new password.", icon: "📧" },
      { title: "Link Expires", desc: "The reset link expires in 1 hour. If it has expired, visit the login page and request a new one.", icon: "⏱" },
      { title: "Strong Password Required", desc: "Your new password must be at least 8 characters with one uppercase letter, one number, and one special character. The registration page shows a strength meter to guide you.", icon: "💪" },
      { title: "Change Password in Profile", desc: "If you are already logged in and want to change your password, go to Profile → Delete Account section — this requires your current password for security. To change it without deleting, use the Forgot Password flow.", icon: "👤" },
      { title: "Account Locked?", desc: "Too many failed attempts will temporarily lock your account. Wait 10 minutes and try again, or use the Forgot Password flow to reset.", icon: "🔒" },
    ]
  },
];

export default function Manual() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState(null);

  return (
    <div className="page-wrapper">
      {/* Hero */}
      <div style={{
        background: "linear-gradient(135deg, var(--primary), var(--primary-light))",
        padding: "48px 0 60px", textAlign: "center"
      }}>
        <div className="container">
          <div style={{ fontSize: 52, marginBottom: 12 }}>📚</div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 32, fontWeight: 800, color: "#fff", marginBottom: 12 }}>
            ASVAN User Guide
          </h1>
          <p style={{ color: "#94A3B8", fontSize: 16, maxWidth: 520, margin: "0 auto" }}>
            Everything you need to know to buy, sell, and thrive on ASVAN Marketplace.
          </p>
        </div>
      </div>

      <div className="container" style={{ paddingTop: 40 }}>
        {/* Section Cards */}
        <div className="grid grid-4" style={{ gap: 16, marginBottom: 40 }}>
          {SECTIONS.map(section => (
            <div
              key={section.id}
              className="card card-hover"
              style={{ cursor: "pointer", borderTop: `3px solid ${section.color}` }}
              onClick={() => setActiveSection(activeSection === section.id ? null : section.id)}
            >
              <div style={{ fontSize: 32, marginBottom: 10 }}>{section.icon}</div>
              <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{section.title}</h3>
              <div style={{ fontSize: 13, color: "var(--text-muted)" }}>{section.steps.length} steps</div>
              <div style={{ marginTop: 10, fontSize: 12, color: section.color, fontWeight: 600 }}>
                {activeSection === section.id ? "▲ Collapse" : "▼ Expand"}
              </div>
            </div>
          ))}
        </div>

        {/* Expanded Section */}
        {activeSection && (() => {
          const section = SECTIONS.find(s => s.id === activeSection);
          return section ? (
            <div className="card animate-slide" style={{ marginBottom: 32, borderTop: `3px solid ${section.color}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
                <span style={{ fontSize: 32 }}>{section.icon}</span>
                <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22 }}>{section.title}</h2>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: 20 }}>
                {section.steps.map((step, i) => (
                  <div key={i} style={{
                    background: "var(--surface-2)", borderRadius: "var(--radius)", padding: 20,
                    borderLeft: `4px solid ${section.color}`
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: "50%",
                        background: section.color, color: "#fff",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontWeight: 700, fontSize: 13, flexShrink: 0
                      }}>{i + 1}</div>
                      <span style={{ fontSize: 20 }}>{step.icon}</span>
                    </div>
                    <div style={{ fontWeight: 700, marginBottom: 6 }}>{step.title}</div>
                    <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>{step.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : null;
        })()}

        {/* FAQ */}
        <div style={{ marginBottom: 40 }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 800, marginBottom: 20 }}>Frequently Asked Questions</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {[
              ["Is ASVAN free to use?", "Creating an account and browsing is free. Sellers pay a small commission on each sale and optional fees for verification and featured listings."],
              ["How do I know a seller is trustworthy?", "Look for the verified badge, check their rating and reviews, and use escrow for every transaction."],
              ["What if I don't receive my order?", "Do NOT confirm delivery. Contact the seller via chat. If unresolved, go to your order and click 'Raise Dispute'. Admin will review and refund if the seller cannot prove delivery."],
              ["How do I confirm delivery?", "Go to Orders → click the order → click the green 'Confirm Delivery' button. Only do this after you have physically received and checked your item. Once confirmed, payment is released and cannot be reversed."],
              ["What if I forget to confirm delivery?", "You will receive email reminders. If you do not confirm or raise a dispute within 7 days, payment is automatically released to the seller. If you had a problem, you must raise a dispute before the 7-day window closes."],
              ["I forgot my password — how do I reset it?", "On the Login page, click 'Forgot password?' — you will be taken to a page where you enter your email. A reset link will be sent to your inbox. Check your spam folder if you don't see it. The link expires in 1 hour."],
              ["How long do withdrawals take?", "Withdrawal requests are reviewed within 24 hours on business days. Funds are sent via MoMo to your registered number."],
              ["Can I cancel an order?", "Orders can be cancelled before the seller marks delivery. Wallet payments are refunded instantly. MoMo payments are refunded within 24 hours by admin."],
              ["What is the platform commission?", "ASVAN takes a small commission (typically 10%) from the seller's payment on each completed order to maintain the platform and escrow service."],
              ["What happens if admin is unavailable to verify my MoMo payment?", "Your money is safe. No funds move until admin verifies. If verification takes longer than 2 hours, escalation emails are sent automatically. Contact alecommerce123@gmail.com marked 'URGENT' if you have waited more than 4 hours."],
            ].map(([q, a], i) => (
              <FAQItem key={i} question={q} answer={a} />
            ))}
          </div>
        </div>

        {/* CTA */}
        <div style={{
          background: "var(--accent-glow)", border: "1px solid rgba(79,124,255,0.2)",
          borderRadius: "var(--radius-xl)", padding: "32px 28px", textAlign: "center", marginBottom: 40
        }}>
          <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 20, marginBottom: 8 }}>Ready to Get Started?</h3>
          <p style={{ color: "var(--text-secondary)", marginBottom: 20 }}>Join ASVAN today and experience secure, trusted marketplace trading.</p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Button variant="primary" onClick={() => navigate("/register")}>Create Free Account</Button>
            <Button variant="secondary" onClick={() => navigate("/products")}>Browse Products</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

const FAQItem = ({ question, answer }) => {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", overflow: "hidden" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: "100%", padding: "14px 18px", background: open ? "var(--surface-3)" : "var(--surface)",
          border: "none", cursor: "pointer", textAlign: "left", display: "flex", justifyContent: "space-between",
          alignItems: "center", fontFamily: "var(--font-body)", fontSize: 14, fontWeight: 600
        }}
      >
        {question}
        <span style={{ fontSize: 18, color: "var(--text-muted)" }}>{open ? "−" : "+"}</span>
      </button>
      {open && (
        <div style={{ padding: "12px 18px", background: "var(--surface)", fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.7, borderTop: "1px solid var(--border)" }}>
          {answer}
        </div>
      )}
    </div>
  );
};
