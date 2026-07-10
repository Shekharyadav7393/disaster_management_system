import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../api/axios.js";
import { getRedirectPath } from "../utils/authUtils.js";
import { GoogleLogin } from "@react-oauth/google";
import "./Login.css";

const GITHUB_CLIENT_ID = import.meta.env.VITE_GITHUB_CLIENT_ID || "dummy";
const GITHUB_AUTH_URL = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&scope=user:email`;

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

const getRequestErrorMessage = (err, fallback) => {
  const data = err?.response?.data;
  if (data?.errors && Array.isArray(data.errors)) {
    return data.errors.join(", ");
  }
  if (data?.message) {
    return data.message;
  }
  if (!err?.response) {
    return "Unable to connect to the server. Please try again in a moment.";
  }
  return err?.message || fallback;
};

const Login = () => {
  const { user, login, externalLogin, loading } = useAuth();
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
      setError(getRequestErrorMessage(err, "Registration failed."));
    } finally {
      setRegistering(false);
    }
  };

  const pwStrength = getPasswordStrength(form.password);

  return (
    <div className="modern-auth-container">
      <div className="modern-auth-card">
        <div className="modern-auth-header">
          <div className="modern-auth-logo">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
          </div>
          <h2 className="modern-auth-title">{mode === "signin" ? "Welcome Back" : "Create Account"}</h2>
          <p className="modern-auth-subtitle">
            {mode === "signin" ? "Sign in to access your dashboard" : "Join the network to report & volunteer"}
          </p>
        </div>

        {error && (
          <div className="modern-auth-message modern-auth-error">
            <span>⚠️</span> {error}
          </div>
        )}
        {success && (
          <div className="modern-auth-message modern-auth-success">
            <span>✅</span> {success}
          </div>
        )}

        <form onSubmit={mode === "signin" ? handleLogin : handleRegister}>
          {mode === "signup" && (
            <>
              <div className="modern-auth-field">
                <label className="modern-auth-label">Full Name</label>
                <div className={`modern-auth-input-wrapper ${fieldErrors.name ? "error" : ""}`}>
                  <span className="modern-auth-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                  </span>
                  <input className="modern-auth-input" name="name" placeholder="John Doe" value={form.name} onChange={handleChange} required />
                </div>
              </div>
              <div className="modern-auth-field">
                <label className="modern-auth-label">Phone Number</label>
                <div className={`modern-auth-input-wrapper ${fieldErrors.phone ? "error" : ""}`}>
                  <span className="modern-auth-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                  </span>
                  <input className="modern-auth-input" name="phone" type="tel" placeholder="+1 234 567 890" value={form.phone} onChange={handleChange} required />
                </div>
              </div>
            </>
          )}

          <div className="modern-auth-field">
            <label className="modern-auth-label">Email Address</label>
            <div className={`modern-auth-input-wrapper ${fieldErrors.email ? "error" : ""}`}>
              <span className="modern-auth-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
              </span>
              <input className="modern-auth-input" name="email" type="email" placeholder="name@example.com" value={form.email} onChange={handleChange} required />
            </div>
          </div>

          <div className="modern-auth-field">
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <label className="modern-auth-label">Password</label>
              {mode === "signin" && (
                <a href="/forgot-password" style={{ color: '#818cf8', fontSize: '12px', textDecoration: 'none' }}>Forgot?</a>
              )}
            </div>
            <div className={`modern-auth-input-wrapper ${fieldErrors.password ? "error" : ""}`}>
              <span className="modern-auth-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
              </span>
              <input className="modern-auth-input" name="password" type={showPassword ? "text" : "password"} placeholder="Enter your password" value={form.password} onChange={handleChange} required />
              <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', padding: '0 16px' }}>
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            {mode === "signup" && form.password && (
              <div className="auth-pw-strength">
                <div className="auth-pw-bar">
                  <div className="auth-pw-fill" style={{ width: `${pwStrength.pct}%`, background: pwStrength.color }} />
                </div>
                <span style={{ color: pwStrength.color }}>{pwStrength.label}</span>
              </div>
            )}
          </div>

          <button className="modern-auth-btn-primary" type="submit" disabled={loading || registering}>
            {loading || registering ? "Processing..." : (mode === "signin" ? "Sign In" : "Create Account")}
          </button>
        </form>

        <div className="modern-auth-divider">or continue with</div>

        <div className="modern-auth-social">
          <div style={{ display: "flex", justifyContent: "center", filter: "invert(0.9)" }}>
             {/* Note: GoogleLogin has its own styling, applying inversion to make it fit dark mode nicely */}
             <GoogleLogin 
              onSuccess={async (credentialResponse) => {
                const result = await externalLogin('google', { token: credentialResponse.credential });
                if (result.ok) navigate(getRedirectPath(result.user?.role));
                else setError(result.message);
              }}
              onError={() => setError("Google Login Failed. Check configuration.")}
              shape="pill"
            />
          </div>
          
          <button className="modern-auth-btn-social" type="button" onClick={() => window.location.href = GITHUB_AUTH_URL}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
            Sign in with GitHub
          </button>
        </div>

        <div style={{ textAlign: "center", marginTop: "24px", fontSize: "14px", color: "#94a3b8" }}>
          {mode === "signin" ? (
            <>
              Don't have an account?{" "}
              <button 
                type="button" 
                onClick={() => { setMode("signup"); setError(""); setSuccess(""); setFieldErrors({}); }}
                style={{ background: "none", border: "none", color: "#818cf8", fontWeight: "600", cursor: "pointer", padding: 0 }}
              >
                Sign Up
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button 
                type="button" 
                onClick={() => { setMode("signin"); setError(""); setSuccess(""); setFieldErrors({}); }}
                style={{ background: "none", border: "none", color: "#818cf8", fontWeight: "600", cursor: "pointer", padding: 0 }}
              >
                Sign In
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
