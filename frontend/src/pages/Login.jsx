import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../api/axios.js";
import { getRedirectPath } from "../utils/authUtils.js";

const getPasswordStrength = (pw) => {
  if (!pw) return { pct: 0, color: "#334155", label: "" };
  let score = 0;
  if (pw.length >= 6) score++;
  if (pw.length >= 10) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 1) return { pct: 20, color: "#ef4444", label: "Weak" };
  if (score <= 2) return { pct: 40, color: "#f97316", label: "Fair" };
  if (score <= 3) return { pct: 65, color: "#eab308", label: "Good" };
  if (score <= 4) return { pct: 85, color: "#22c55e", label: "Strong" };
  return { pct: 100, color: "#10b981", label: "Excellent" };
};

const Login = () => {
  const { user, login, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate(getRedirectPath(user.role), { replace: true });
    }
  }, [user, navigate]);

  const [mode, setMode] = useState("signin");
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [registering, setRegistering] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setFieldErrors((f) => ({ ...f, [name]: "" }));
  };

  const validateFields = () => {
    const errs = {};
    if (mode === "signup") {
      if (!form.name.trim()) errs.name = "Name is required";
      if (!form.phone.trim()) errs.phone = "Phone number is required";
    }
    if (!form.email.trim()) errs.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = "Invalid email format";
    if (!form.password) errs.password = "Password is required";
    else if (mode === "signup" && form.password.length < 6) errs.password = "Minimum 6 characters";
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!validateFields()) return;
    setError("");
    const result = await login({ email: form.email, password: form.password });
    if (result.ok) {
      navigate(getRedirectPath(result.user?.role));
    } else {
      setError(result.message);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!validateFields()) return;
    setRegistering(true);
    setError("");
    try {
      await api.post("/auth/register", {
        name: form.name,
        email: form.email,
        password: form.password,
        phone: form.phone,
      });
      setSuccess("✅ Account created successfully! Please sign in.");
      setMode("signin");
      setForm((f) => ({ ...f, name: "", password: "", phone: "" }));
    } catch (err) {
      const data = err?.response?.data;
      if (data?.errors && Array.isArray(data.errors)) {
        setError(data.errors.join(", "));
      } else {
        setError(data?.message || "Registration failed.");
      }
    } finally {
      setRegistering(false);
    }
  };

  const pwStrength = getPasswordStrength(form.password);

  return (
    <div className="auth-page">
      {/* Animated background */}
      <div className="auth-bg-gradient auth-bg-gradient-1" />
      <div className="auth-bg-gradient auth-bg-gradient-2" />
      <div className="auth-bg-gradient auth-bg-gradient-3" />
      <div className="auth-grid-pattern" />
      <div className="auth-particles">
        {[...Array(12)].map((_, i) => (
          <div key={i} className="auth-particle" />
        ))}
      </div>

      {/* Centered card */}
      <div className="auth-card">
        {/* Logo */}
        <div className="auth-card-logo">
          <div className="auth-logo-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
            </svg>
          </div>
          <span className="auth-logo-text">DisasterMS</span>
        </div>

        {/* Tabs */}
        <div className="auth-tabs">
          <button
            id="signin-tab"
            className={`auth-tab ${mode === "signin" ? "active" : ""}`}
            onClick={() => { setMode("signin"); setError(""); setSuccess(""); setFieldErrors({}); }}
          >
            Sign In
          </button>
          <button
            id="signup-tab"
            className={`auth-tab ${mode === "signup" ? "active" : ""}`}
            onClick={() => { setMode("signup"); setError(""); setSuccess(""); setFieldErrors({}); }}
          >
            Sign Up
          </button>
          <div className="auth-tab-indicator" style={{ transform: mode === "signup" ? "translateX(100%)" : "translateX(0)" }} />
        </div>

        {/* Heading */}
        <div className="auth-form-header">
          <h2>{mode === "signin" ? "Welcome back" : "Create your account"}</h2>
          <p>{mode === "signin" ? "Sign in to access your dashboard" : "Join the disaster management network"}</p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="auth-alert auth-alert-error">
            <span>⚠️</span> {error}
          </div>
        )}
        {success && (
          <div className="auth-alert auth-alert-success">
            <span>✅</span> {success}
          </div>
        )}

        {/* Sign In Form */}
        {mode === "signin" ? (
          <form onSubmit={handleLogin} className="auth-form">
            <div className="auth-field">
              <label htmlFor="login-email">Email Address</label>
              <div className={`auth-input-wrapper ${fieldErrors.email ? "error" : ""}`}>
                <span className="auth-input-icon">📧</span>
                <input
                  id="login-email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={handleChange}
                  autoComplete="email"
                  required
                />
              </div>
              {fieldErrors.email && <span className="auth-field-error">{fieldErrors.email}</span>}
            </div>

            <div className="auth-field">
              <label htmlFor="login-password">Password</label>
              <div className={`auth-input-wrapper ${fieldErrors.password ? "error" : ""}`}>
                <span className="auth-input-icon">🔒</span>
                <input
                  id="login-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={handleChange}
                  autoComplete="current-password"
                  required
                />
                <button type="button" className="auth-toggle-pw" onClick={() => setShowPassword(!showPassword)} tabIndex={-1}>
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
              {fieldErrors.password && <span className="auth-field-error">{fieldErrors.password}</span>}
            </div>

            <button id="login-submit" className="auth-submit-btn" type="submit" disabled={loading}>
              {loading ? (
                <><span className="auth-btn-spinner" /> Signing in...</>
              ) : (
                <>Sign In <span className="auth-btn-arrow">→</span></>
              )}
            </button>

            <p className="auth-switch-text">
              Don't have an account?{" "}
              <button type="button" className="auth-switch-link" onClick={() => { setMode("signup"); setError(""); setSuccess(""); setFieldErrors({}); }}>
                Sign Up
              </button>
            </p>
          </form>
        ) : (
          /* Sign Up Form */
          <form onSubmit={handleRegister} className="auth-form">
            <div className="auth-field">
              <label htmlFor="register-name">Full Name</label>
              <div className={`auth-input-wrapper ${fieldErrors.name ? "error" : ""}`}>
                <span className="auth-input-icon">👤</span>
                <input
                  id="register-name"
                  name="name"
                  placeholder="Enter your full name"
                  value={form.name}
                  onChange={handleChange}
                  autoComplete="name"
                  required
                />
              </div>
              {fieldErrors.name && <span className="auth-field-error">{fieldErrors.name}</span>}
            </div>

            <div className="auth-field">
              <label htmlFor="register-email">Email Address</label>
              <div className={`auth-input-wrapper ${fieldErrors.email ? "error" : ""}`}>
                <span className="auth-input-icon">📧</span>
                <input
                  id="register-email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={handleChange}
                  autoComplete="email"
                  required
                />
              </div>
              {fieldErrors.email && <span className="auth-field-error">{fieldErrors.email}</span>}
            </div>

            <div className="auth-field">
              <label htmlFor="register-phone">Phone Number</label>
              <div className={`auth-input-wrapper ${fieldErrors.phone ? "error" : ""}`}>
                <span className="auth-input-icon">📱</span>
                <input
                  id="register-phone"
                  name="phone"
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={form.phone}
                  onChange={handleChange}
                  autoComplete="tel"
                  required
                />
              </div>
              {fieldErrors.phone && <span className="auth-field-error">{fieldErrors.phone}</span>}
            </div>

            <div className="auth-field">
              <label htmlFor="register-password">Password</label>
              <div className={`auth-input-wrapper ${fieldErrors.password ? "error" : ""}`}>
                <span className="auth-input-icon">🔒</span>
                <input
                  id="register-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Min. 6 characters"
                  value={form.password}
                  onChange={handleChange}
                  autoComplete="new-password"
                  required
                  minLength={6}
                />
                <button type="button" className="auth-toggle-pw" onClick={() => setShowPassword(!showPassword)} tabIndex={-1}>
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
              {fieldErrors.password && <span className="auth-field-error">{fieldErrors.password}</span>}
              {form.password && (
                <div className="auth-pw-strength">
                  <div className="auth-pw-bar">
                    <div className="auth-pw-fill" style={{ width: `${pwStrength.pct}%`, background: pwStrength.color }} />
                  </div>
                  <span style={{ color: pwStrength.color }}>{pwStrength.label}</span>
                </div>
              )}
            </div>

            <button id="register-submit" className="auth-submit-btn" type="submit" disabled={registering}>
              {registering ? (
                <><span className="auth-btn-spinner" /> Creating account...</>
              ) : (
                <>Create Account <span className="auth-btn-arrow">→</span></>
              )}
            </button>

            <p className="auth-switch-text">
              Already have an account?{" "}
              <button type="button" className="auth-switch-link" onClick={() => { setMode("signin"); setError(""); setSuccess(""); setFieldErrors({}); }}>
                Sign In
              </button>
            </p>
          </form>
        )}
      </div>
    </div>
  );
};

export default Login;
