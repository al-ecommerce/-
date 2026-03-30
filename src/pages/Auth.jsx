import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login, register, resetPassword } from "../firebase/auth";
import { Button, Alert, FormInput } from "../components/UI";

// ─── PASSWORD STRENGTH ────────────────────────────────────
const checkPasswordStrength = (password) => {
  const checks = {
    length:    password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number:    /[0-9]/.test(password),
    special:   /[^A-Za-z0-9]/.test(password),
  };
  const passed = Object.values(checks).filter(Boolean).length;
  const level  = passed <= 1 ? "weak" : passed <= 3 ? "fair" : passed === 4 ? "good" : "strong";
  return { checks, passed, level };
};

const STRENGTH_COLOR = { weak: "#DC2626", fair: "#D97706", good: "#2563EB", strong: "#059669" };
const STRENGTH_LABEL = { weak: "Weak",    fair: "Fair",    good: "Good",    strong: "Strong" };

const PasswordStrengthMeter = ({ password }) => {
  if (!password) return null;
  const { checks, passed, level } = checkPasswordStrength(password);
  const color = STRENGTH_COLOR[level];
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: "flex", gap: 4, marginBottom: 6 }}>
        {[1,2,3,4,5].map(i => (
          <div key={i} style={{
            flex: 1, height: 4, borderRadius: 2,
            background: i <= passed ? color : "var(--border)", transition: "background 0.3s",
          }} />
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
        <span style={{ fontSize: 12, color, fontWeight: 700 }}>{STRENGTH_LABEL[level]} Password</span>
        <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{passed}/5 requirements</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 12px", padding: "10px 12px", background: "var(--surface-2)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)" }}>
        {[
          [checks.length,    "At least 8 characters"],
          [checks.uppercase, "One uppercase letter"],
          [checks.lowercase, "One lowercase letter"],
          [checks.number,    "One number"],
          [checks.special,   "One special character"],
        ].map(([met, label]) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: met ? "var(--success)" : "var(--text-muted)" }}>
            <span style={{ fontWeight: 700 }}>{met ? "✓" : "○"}</span>{label}
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── AUTH CARD ────────────────────────────────────────────
const AuthCard = ({ children, title, subtitle }) => (
  <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, background: "linear-gradient(135deg, var(--surface-2) 0%, var(--surface-3) 100%)" }}>
    <div style={{ width: "100%", maxWidth: 440 }}>
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <div style={{ width: 52, height: 52, background: "var(--accent)", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-display)", fontWeight: 700, color: "#fff", fontSize: 22, margin: "0 auto 14px" }}>A</div>
        <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 26, letterSpacing: "-0.3px" }}>{title}</h1>
        <p style={{ color: "var(--text-muted)", fontSize: 14, marginTop: 4 }}>{subtitle}</p>
      </div>
      <div style={{ background: "var(--surface)", borderRadius: "var(--radius-xl)", padding: "32px 28px", boxShadow: "var(--shadow-lg)", border: "1px solid var(--border)" }}>
        {children}
      </div>
    </div>
  </div>
);

// ─── STANDALONE FORGOT PASSWORD PAGE ─────────────────────
export const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [email,   setEmail]   = useState("");
  const [loading, setLoading] = useState(false);
  const [sent,    setSent]    = useState(false);
  const [error,   setError]   = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return setError("Please enter your email address");
    if (!email.includes("@")) return setError("Please enter a valid email address");
    setLoading(true);
    setError("");
    try {
      await resetPassword(email.trim());
      setSent(true);
    } catch (err) {
      setError(getAuthError(err.code));
    }
    setLoading(false);
  };

  if (sent) return (
    <AuthCard title="Check Your Inbox" subtitle="Reset link sent">
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>📧</div>
        <p style={{ color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: 8 }}>
          A password reset link has been sent to:
        </p>
        <div style={{ fontWeight: 700, fontSize: 16, color: "var(--accent)", marginBottom: 20, wordBreak: "break-all" }}>
          {email}
        </div>
        <Alert type="info" style={{ textAlign: "left", marginBottom: 20 }}>
          Check your spam or junk folder if you don't see it within 2 minutes. The link expires in 1 hour.
        </Alert>
        <Button variant="primary" full onClick={() => navigate("/login")}>Back to Sign In</Button>
        <button
          type="button"
          onClick={() => { setSent(false); setError(""); }}
          style={{ marginTop: 12, background: "none", border: "none", color: "var(--accent)", fontSize: 13, cursor: "pointer", display: "block", margin: "12px auto 0" }}
        >
          Wrong email? Try again
        </button>
      </div>
    </AuthCard>
  );

  return (
    <AuthCard title="Reset Your Password" subtitle="Enter your email and we'll send a reset link">
      {error && <Alert type="danger">{error}</Alert>}
      <form onSubmit={handleSubmit}>
        <FormInput
          label="Email Address"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="you@example.com"
          hint="Enter the email you registered with"
          required
        />
        <Button type="submit" variant="primary" full loading={loading} style={{ marginTop: 8 }}>
          Send Reset Link
        </Button>
      </form>
      <p style={{ textAlign: "center", marginTop: 20, fontSize: 14, color: "var(--text-muted)" }}>
        Remembered it? <Link to="/login" style={{ fontWeight: 700, color: "var(--accent)" }}>Sign In</Link>
      </p>
    </AuthCard>
  );
};

// ─── LOGIN ────────────────────────────────────────────────
export const LoginPage = () => {
  const navigate = useNavigate();
  const [form,    setForm]    = useState({ email: "", password: "" });
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass,setShowPass]= useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      await login(form.email, form.password);
      navigate("/");
    } catch (err) {
      setError(getAuthError(err.code));
    }
    setLoading(false);
  };

  return (
    <AuthCard title="Welcome Back" subtitle="Sign in to your ASVAN account">
      {error && <Alert type="danger">{error}</Alert>}
      <form onSubmit={handleLogin}>
        <FormInput label="Email Address" type="email" value={form.email}
          onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
          placeholder="you@example.com" required />

        <div className="form-group">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <label className="form-label" style={{ margin: 0 }}>Password</label>
            <Link to="/forgot-password" style={{ fontSize: 12, color: "var(--accent)", fontWeight: 600, textDecoration: "none" }}>
              Forgot password?
            </Link>
          </div>
          <div style={{ position: "relative" }}>
            <input
              className="form-input"
              type={showPass ? "text" : "password"}
              value={form.password}
              onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
              placeholder="Enter your password"
              required
              style={{ paddingRight: 44 }}
            />
            <button type="button" onClick={() => setShowPass(v => !v)}
              style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "var(--text-muted)" }}>
              {showPass ? "🙈" : "👁"}
            </button>
          </div>
        </div>

        <Button type="submit" variant="primary" full loading={loading} style={{ marginTop: 8 }}>Sign In</Button>
      </form>
      <p style={{ textAlign: "center", marginTop: 20, fontSize: 14, color: "var(--text-muted)" }}>
        Don't have an account? <Link to="/register" style={{ fontWeight: 700, color: "var(--accent)" }}>Sign Up</Link>
      </p>
    </AuthCard>
  );
};

// ─── REGISTER ─────────────────────────────────────────────
export const RegisterPage = () => {
  const navigate = useNavigate();
  const [form,       setForm]       = useState({ displayName: "", email: "", password: "", confirmPassword: "" });
  const [error,      setError]      = useState("");
  const [loading,    setLoading]    = useState(false);
  const [success,    setSuccess]    = useState(false);
  const [showPass,   setShowPass]   = useState(false);
  const [showConfirm,setShowConfirm]= useState(false);

  const strength = checkPasswordStrength(form.password);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.displayName.trim())    return setError("Please enter your full name");
    if (form.displayName.trim().length < 2) return setError("Name must be at least 2 characters");
    if (form.password !== form.confirmPassword) return setError("Passwords do not match");
    if (form.password.length < 8)    return setError("Password must be at least 8 characters");
    if (!strength.checks.uppercase)  return setError("Password must contain at least one uppercase letter (A-Z)");
    if (!strength.checks.number)     return setError("Password must contain at least one number (0-9)");
    setLoading(true);
    try {
      await register(form.email, form.password, form.displayName.trim());
      setSuccess(true);
    } catch (err) { setError(getAuthError(err.code)); }
    setLoading(false);
  };

  if (success) return (
    <AuthCard title="Check Your Email" subtitle="One more step!">
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 52, marginBottom: 16 }}>📧</div>
        <p style={{ color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: 16 }}>
          A verification email was sent to <strong>{form.email}</strong>. Please verify before signing in.
        </p>
        <Alert type="info">Check your spam/junk folder if you don't see it.</Alert>
        <Button variant="primary" full onClick={() => navigate("/login")} style={{ marginTop: 16 }}>Go to Login</Button>
      </div>
    </AuthCard>
  );

  return (
    <AuthCard title="Create Account" subtitle="Join ASVAN — Ghana's trusted marketplace">
      {error && <Alert type="danger">{error}</Alert>}
      <form onSubmit={handleRegister}>
        <FormInput label="Full Name *" value={form.displayName}
          onChange={e => setForm(p => ({ ...p, displayName: e.target.value }))}
          placeholder="e.g. Kwame Mensah" required />
        <FormInput label="Email Address *" type="email" value={form.email}
          onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
          placeholder="you@example.com" required />
        <div className="form-group">
          <label className="form-label">Password *</label>
          <div style={{ position: "relative" }}>
            <input className="form-input" type={showPass ? "text" : "password"} value={form.password}
              onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
              placeholder="Create a strong password" required style={{ paddingRight: 44 }} />
            <button type="button" onClick={() => setShowPass(v => !v)}
              style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "var(--text-muted)" }}>
              {showPass ? "🙈" : "👁"}
            </button>
          </div>
          <PasswordStrengthMeter password={form.password} />
        </div>
        <div className="form-group">
          <label className="form-label">Confirm Password *</label>
          <div style={{ position: "relative" }}>
            <input className="form-input" type={showConfirm ? "text" : "password"} value={form.confirmPassword}
              onChange={e => setForm(p => ({ ...p, confirmPassword: e.target.value }))}
              placeholder="Repeat your password" required style={{ paddingRight: 44 }} />
            <button type="button" onClick={() => setShowConfirm(v => !v)}
              style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "var(--text-muted)" }}>
              {showConfirm ? "🙈" : "👁"}
            </button>
          </div>
          {form.confirmPassword && form.password !== form.confirmPassword && (
            <span style={{ fontSize: 12, color: "var(--danger)" }}>✕ Passwords do not match</span>
          )}
          {form.confirmPassword && form.password === form.confirmPassword && form.password.length >= 8 && (
            <span style={{ fontSize: 12, color: "var(--success)" }}>✓ Passwords match</span>
          )}
        </div>
        <div style={{ margin: "12px 0 16px", fontSize: 12, color: "var(--text-muted)", lineHeight: 1.6 }}>
          By creating an account you agree to ASVAN's <Link to="/policy" style={{ color: "var(--accent)" }}>Terms of Service</Link> and Platform Policy.
        </div>
        <Button type="submit" variant="primary" full loading={loading}>Create Account</Button>
      </form>
      <p style={{ textAlign: "center", marginTop: 20, fontSize: 14, color: "var(--text-muted)" }}>
        Already have an account? <Link to="/login" style={{ fontWeight: 700, color: "var(--accent)" }}>Sign In</Link>
      </p>
    </AuthCard>
  );
};

// ─── ERROR MESSAGES ───────────────────────────────────────
const getAuthError = (code) => {
  const map = {
    "auth/user-not-found":        "No account found with this email address",
    "auth/wrong-password":        "Incorrect password. Please try again",
    "auth/invalid-credential":    "Invalid email or password",
    "auth/email-already-in-use":  "An account with this email already exists",
    "auth/weak-password":         "Password is too weak — use at least 8 characters with uppercase and numbers",
    "auth/invalid-email":         "Invalid email address format",
    "auth/too-many-requests":     "Too many failed attempts. Please wait a few minutes and try again",
    "auth/network-request-failed":"Network error. Check your internet connection",
    "auth/user-disabled":         "This account has been disabled. Contact support",
    "auth/missing-email":         "Please enter your email address",
  };
  return map[code] || "Something went wrong. Please try again.";
};
