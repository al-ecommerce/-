import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  getPlatformSettings, getUserSubscription, createSubscription,
  debitWallet, getWallet, createNotification
} from "../firebase/db";
import { Spinner, Button, Alert, Badge, PageHeader, toast } from "../components/UI";

const PLAN_FEATURES = {
  basic: [
    "List up to 20 products",
    "List up to 10 services",
    "Standard search placement",
    "Basic analytics",
    "Chat with buyers",
    "Email support",
  ],
  premium: [
    "Unlimited product listings",
    "Unlimited service listings",
    "Priority search placement",
    "Advanced analytics dashboard",
    "Chat with buyers",
    "1 free featured listing/month",
    "Verified badge eligibility",
    "Priority support",
    "Early access to new features",
  ],
};

export default function Subscriptions() {
  const { currentUser, userDoc, isSeller } = useAuth();
  const navigate = useNavigate();
  const [settings, setSettings] = useState({});
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState("");

  useEffect(() => {
    if (!currentUser) return navigate("/login");
    const load = async () => {
      try {
        const [s, sub] = await Promise.all([
          getPlatformSettings(),
          getUserSubscription(currentUser.uid)
        ]);
        setSettings(s);
        setSubscription(sub);
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    load();
  }, [currentUser]);

  const handleSubscribe = async (plan) => {
    if (!isSeller) return toast.error("Become a seller first to subscribe");
    setSubscribing(plan);
    try {
      const price = plan === "basic" ? settings.basicSubscriptionPrice : settings.premiumSubscriptionPrice;
      const wallet = await getWallet(currentUser.uid);
      if (wallet.balance < price) {
        toast.error(`Insufficient balance. ${plan} plan costs GHS ${price}/month`);
        setSubscribing("");
        return;
      }
      await debitWallet(currentUser.uid, price, `${plan} subscription`);
      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + 1);
      await createSubscription({
        uid: currentUser.uid,
        plan,
        price,
        status: "active",
        expiresAt
      });
      await createNotification(currentUser.uid, {
        title: `${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan Activated!`,
        body: `Your ${plan} subscription is active until ${expiresAt.toLocaleDateString()}`,
        type: "system"
      });
      setSubscription({ plan, status: "active", expiresAt });
      toast.success(`${plan} plan activated!`);
    } catch (e) {
      toast.error(e.message || "Subscription failed");
    }
    setSubscribing("");
  };

  if (loading) return <Spinner center />;

  const basicPrice = settings.basicSubscriptionPrice || 10;
  const premiumPrice = settings.premiumSubscriptionPrice || 30;

  return (
    <div className="page-wrapper">
      <div className="container" style={{ paddingTop: 28 }}>
        <PageHeader
          title="Seller Subscriptions"
          subtitle="Unlock premium features to grow your business"
        />

        {subscription && (
          <div className="alert alert-success" style={{ marginBottom: 24 }}>
            <span>✓</span>
            <span>
              You are on the <strong>{subscription.plan}</strong> plan.
              {subscription.expiresAt && (
                <> Renews {new Date(subscription.expiresAt?.seconds ? subscription.expiresAt.seconds * 1000 : subscription.expiresAt).toLocaleDateString()}.</>
              )}
            </span>
          </div>
        )}

        {!isSeller && (
          <Alert type="warning">
            You need a seller account to subscribe. <span style={{ fontWeight: 700, cursor: "pointer", color: "var(--accent)" }} onClick={() => navigate("/seller-dashboard")}>Become a seller →</span>
          </Alert>
        )}

        {/* Plan Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, maxWidth: 800, margin: "0 auto" }}>
          {/* Basic Plan */}
          <div className="card" style={{ position: "relative", overflow: "hidden" }}>
            <div style={{ padding: "4px 12px", background: "var(--surface-3)", borderRadius: 20, display: "inline-block", fontSize: 12, fontWeight: 700, marginBottom: 16 }}>BASIC</div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 38, fontWeight: 800, color: "var(--text)", lineHeight: 1 }}>
              GHS {basicPrice}
              <span style={{ fontSize: 16, fontWeight: 400, color: "var(--text-muted)" }}>/month</span>
            </div>
            <p style={{ color: "var(--text-muted)", fontSize: 14, margin: "12px 0 20px" }}>
              Perfect for new sellers getting started
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
              {PLAN_FEATURES.basic.map(f => (
                <div key={f} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14 }}>
                  <span style={{ color: "var(--success)", fontWeight: 700 }}>✓</span>
                  <span>{f}</span>
                </div>
              ))}
            </div>
            <Button
              variant={subscription?.plan === "basic" ? "secondary" : "outline"}
              full
              loading={subscribing === "basic"}
              onClick={() => handleSubscribe("basic")}
              disabled={subscription?.plan === "basic"}
            >
              {subscription?.plan === "basic" ? "Current Plan" : "Subscribe to Basic"}
            </Button>
          </div>

          {/* Premium Plan */}
          <div className="card" style={{
            position: "relative", overflow: "hidden",
            border: "2px solid var(--accent)",
            background: "linear-gradient(180deg, var(--accent-glow) 0%, var(--surface) 100%)"
          }}>
            <div style={{
              position: "absolute", top: 16, right: 16,
              background: "var(--accent)", color: "#fff",
              padding: "4px 12px", borderRadius: 20, fontSize: 11, fontWeight: 700
            }}>BEST VALUE</div>
            <div style={{ padding: "4px 12px", background: "var(--accent-glow)", borderRadius: 20, display: "inline-block", fontSize: 12, fontWeight: 700, color: "var(--accent)", marginBottom: 16 }}>PREMIUM</div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 38, fontWeight: 800, color: "var(--accent)", lineHeight: 1 }}>
              GHS {premiumPrice}
              <span style={{ fontSize: 16, fontWeight: 400, color: "var(--text-muted)" }}>/month</span>
            </div>
            <p style={{ color: "var(--text-secondary)", fontSize: 14, margin: "12px 0 20px" }}>
              For serious sellers who want maximum exposure
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
              {PLAN_FEATURES.premium.map(f => (
                <div key={f} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14 }}>
                  <span style={{ color: "var(--accent)", fontWeight: 700 }}>✓</span>
                  <span>{f}</span>
                </div>
              ))}
            </div>
            <Button
              variant={subscription?.plan === "premium" ? "secondary" : "primary"}
              full
              loading={subscribing === "premium"}
              onClick={() => handleSubscribe("premium")}
              disabled={subscription?.plan === "premium"}
            >
              {subscription?.plan === "premium" ? "Current Plan" : "Subscribe to Premium"}
            </Button>
          </div>
        </div>

        {/* FAQ */}
        <div style={{ maxWidth: 640, margin: "48px auto 0" }}>
          <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, marginBottom: 20, textAlign: "center" }}>Subscription FAQ</h3>
          {[
            ["Can I cancel anytime?", "Yes. Your plan remains active until the end of the billing period. No automatic renewals."],
            ["How does billing work?", "Subscription fee is deducted from your AlEcom wallet. Ensure you have sufficient balance."],
            ["Can I upgrade mid-month?", "Yes. Upgrade to Premium anytime; the premium fee will be deducted and your plan updated immediately."],
            ["What happens when my plan expires?", "Your account reverts to the free tier. Listings remain active but without premium benefits."],
          ].map(([q, a]) => (
            <div key={q} style={{ padding: "16px 0", borderBottom: "1px solid var(--border)" }}>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>{q}</div>
              <div style={{ fontSize: 14, color: "var(--text-secondary)" }}>{a}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
