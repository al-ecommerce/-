import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login, register, resetPassword } from "../firebase/auth";
import { Button, Alert, FormInput } from "../components/UI";

const AuthCard = ({ children, title, subtitle }) => (
  <div style={{
    minHeight: "100vh", display: "flex", alignItems: "center",
    justifyContent: "center", padding: 20,
    background: "linear-gradient(135deg, var(--surface-2) 0%, var(--surface-3) 100%)"
  }}>
    <div style={{ width: "100%", maxWidth: 440 }}>
      {/* Logo */}
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <div style={{
          width: 52, height: 52, background: "var(--accent)",
          borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: "var(--font-display)", fontWeight: 800, color: "#fff", fontSize: 22,
          margin: "0 auto 14px"
        }}>A</div>
        <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 26 }}>{title}</h1>
        <p style={{ color: "var(--text-muted)", fontSize: 14, marginTop: 4 }}>{subtitle}</p>
      </div>
      <div style={{
        background: "var(--surface)", borderRadius: "var(--radius-xl)",
        padding: "32px 28px", boxShadow: "var(--shadow-lg)", border: "1px solid var(--border)"
      }}>
        {children}
      </div>
    </div>
  </div>
);

export const LoginPage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [resetSent, setResetSent] = useState(false);

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

  const handleReset = async (e) => {
    e.preventDefault();
    if (!form.email) return setError("Enter your email first");
    setLoading(true);
    try {
      await resetPassword(form.email);
      setResetSent(true); setShowReset(false);
    } catch (err) { setError(err.message); }
    setLoading(false);
  };

  return (
    <AuthCard title="Welcome Back" subtitle="Sign in to your ASVAN account">
      {error && <Alert type="danger">{error}</Alert>}
      {resetSent && <Alert type="success">Password reset email sent! Check your inbox.</Alert>}
      <form onSubmit={handleLogin}>
        <FormInput
          label="Email Address"
          type="email"
          value={form.email}
          onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
          placeholder="you@example.com"
          required
        />
        <FormInput
          label="Password"
          type="password"
          value={form.password}
          onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
          placeholder="Enter your password"
          required
        />
        <div style={{ textAlign: "right", marginTop: -8, marginBottom: 16 }}>
          <button type="button" onClick={() => setShowReset(true)}
            style={{ background: "none", border: "none", color: "var(--accent)", fontSize: 13, cursor: "pointer" }}>
            Forgot password?
          </button>
        </div>
        <Button type="submit" variant="primary" full loading={loading}>Sign In</Button>
      </form>
      {showReset && (
        <div style={{ marginTop: 16, padding: 16, background: "var(--surface-3)", borderRadius: "var(--radius-sm)" }}>
          <p style={{ fontSize: 13, marginBottom: 10 }}>Enter your email to receive a reset link:</p>
          <div style={{ display: "flex", gap: 8 }}>
            <input className="form-input" type="email" placeholder="Email" value={form.email}
              onChange={e => setForm(p => ({ ...p, email: e.target.value }))} style={{ flex: 1 }} />
            <Button size="sm" onClick={handleReset} loading={loading}>Send</Button>
          </div>
        </div>
      )}
      <p style={{ textAlign: "center", marginTop: 20, fontSize: 14, color: "var(--text-muted)" }}>
        Don't have an account? <Link to="/register" style={{ fontWeight: 700 }}>Sign Up</Link>
      </p>
    </AuthCard>
  );
};

export const RegisterPage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ displayName: "", email: "", password: "", confirmPassword: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirmPassword) return setError("Passwords do not match");
    if (form.password.length < 6) return setError("Password must be at least 6 characters");
    setLoading(true);
    try {
      await register(form.email, form.password, form.displayName);
      setSuccess(true);
    } catch (err) {
      setError(getAuthError(err.code));
    }
    setLoading(false);
  };

  if (success) return (
    <AuthCard title="Check Your Email" subtitle="Almost there!">
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 52, marginBottom: 16 }}>📧</div>
        <p style={{ color: "var(--text-secondary)", marginBottom: 20 }}>
          We've sent a verification email to <strong>{form.email}</strong>. Please verify your email before signing in.
        </p>
        <Button variant="primary" full onClick={() => navigate("/login")}>Go to Login</Button>
      </div>
    </AuthCard>
  );

  return (
    <AuthCard title="Create Account" subtitle="Join ASVAN today — it's free">
      {error && <Alert type="danger">{error}</Alert>}
      <form onSubmit={handleRegister}>
        <FormInput label="Full Name" value={form.displayName}
          onChange={e => setForm(p => ({ ...p, displayName: e.target.value }))}
          placeholder="John Doe" required />
        <FormInput label="Email Address" type="email" value={form.email}
          onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
          placeholder="you@example.com" required />
        <FormInput label="Password" type="password" value={form.password}
          onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
          placeholder="At least 6 characters" required />
        <FormInput label="Confirm Password" type="password" value={form.confirmPassword}
          onChange={e => setForm(p => ({ ...p, confirmPassword: e.target.value }))}
          placeholder="Repeat password" required />
        <div style={{ margin: "12px 0 16px", fontSize: 12, color: "var(--text-muted)", lineHeight: 1.6 }}>
          By creating an account you agree to ASVAN's Terms of Service and Privacy Policy.
        </div>
        <Button type="submit" variant="primary" full loading={loading}>Create Account</Button>
      </form>
      <p style={{ textAlign: "center", marginTop: 20, fontSize: 14, color: "var(--text-muted)" }}>
        Already have an account? <Link to="/login" style={{ fontWeight: 700 }}>Sign In</Link>
      </p>
    </AuthCard>
  );
};

const getAuthError = (code) => {
  const map = {
    "auth/user-not-found": "No account found with this email",
    "auth/wrong-password": "Incorrect password",
    "auth/email-already-in-use": "Email already registered",
    "auth/weak-password": "Password is too weak",
    "auth/invalid-email": "Invalid email address",
    "auth/too-many-requests": "Too many attempts. Please try again later",
    "auth/network-request-failed": "Network error. Check your connection",
  };
  return map[code] || "An error occurred. Please try again.";
};
