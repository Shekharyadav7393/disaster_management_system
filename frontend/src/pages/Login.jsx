import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../api/axios.js";
import { getRedirectPath } from "../utils/authUtils.js";
import { useGoogleLogin } from "@react-oauth/google";
import "./Login.css";

const GITHUB_CLIENT_ID = import.meta.env.VITE_GITHUB_CLIENT_ID || "dummy";
const GITHUB_AUTH_URL = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&scope=user:email`;

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
  const [form, setForm] = useState({ org: "", name: "", email: "", password: "", phone: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [registering, setRegistering] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

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
      setSuccess("Account created successfully! Please log in.");
      setMode("signin");
      setForm((f) => ({ ...f, name: "", password: "", phone: "" }));
    } catch (err) {
      setError(getRequestErrorMessage(err, "Registration failed."));
    } finally {
      setRegistering(false);
    }
  };

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      // In our setup, externalLogin might expect credential or access_token. 
      // We pass the token directly as access_token.
      const result = await externalLogin('google', { access_token: tokenResponse.access_token });
      if (result.ok) navigate(getRedirectPath(result.user?.role));
      else setError(result.message || "Google Login Failed");
    },
    onError: () => setError("Google Login Failed"),
  });

  return (
    <div className="modern-auth-container">
      <div className="modern-auth-card">
        
        {/* WAVY HEADER */}
        <div className="modern-auth-header-wave">
          <div className="modern-auth-header-bubble"></div>
          <div className="modern-auth-logo-box">
            DisasterMS
          </div>
          <div className="modern-auth-welcome-small">NICE TO SEE YOU AGAIN</div>
          <h1 className="modern-auth-welcome-large">
            {mode === "signin" ? "WELCOME BACK" : "JOIN THE NETWORK"}
          </h1>
        </div>

        {/* FORM CONTAINER */}
        <div className="modern-auth-form-container">
          <h2 className="modern-auth-section-title">
            {mode === "signin" ? "USER LOGIN" : "USER REGISTRATION"}
          </h2>

          {error && <div className="modern-auth-alert modern-auth-alert-error">⚠️ {error}</div>}
          {success && <div className="modern-auth-alert modern-auth-alert-success">✅ {success}</div>}

          <form onSubmit={mode === "signin" ? handleLogin : handleRegister}>
            
            {mode === "signin" && (
              <div className="modern-auth-field">
                <div className={`modern-auth-input-wrapper ${fieldErrors.org ? "error" : ""}`}>
                  <span className="modern-auth-icon">🏢</span>
                  <select className="modern-auth-input" name="org" value={form.org} onChange={handleChange}>
                    <option value="" disabled>Select organization to log into</option>
                    <option value="dms_global">DisasterMS Global</option>
                    <option value="volunteer_force">Volunteer Force</option>
                  </select>
                  <span style={{color: '#94a3b8', fontSize: '10px'}}>▼</span>
                </div>
              </div>
            )}

            {mode === "signup" && (
              <>
                <div className="modern-auth-field">
                  <div className={`modern-auth-input-wrapper ${fieldErrors.name ? "error" : ""}`}>
                    <span className="modern-auth-icon">👤</span>
                    <input className="modern-auth-input" name="name" placeholder="Full Name" value={form.name} onChange={handleChange} required />
                  </div>
                </div>
                <div className="modern-auth-field">
                  <div className={`modern-auth-input-wrapper ${fieldErrors.phone ? "error" : ""}`}>
                    <span className="modern-auth-icon">📱</span>
                    <input className="modern-auth-input" name="phone" placeholder="Phone Number" value={form.phone} onChange={handleChange} required />
                  </div>
                </div>
              </>
            )}

            <div className="modern-auth-field">
              <div className={`modern-auth-input-wrapper ${fieldErrors.email ? "error" : ""}`}>
                <span className="modern-auth-icon">👤</span>
                <input className="modern-auth-input" name="email" type="email" placeholder="Username (Email)" value={form.email} onChange={handleChange} required />
              </div>
            </div>

            <div className="modern-auth-field">
              <div className={`modern-auth-input-wrapper ${fieldErrors.password ? "error" : ""}`}>
                <span className="modern-auth-icon">🔑</span>
                <input className="modern-auth-input" name="password" type="password" placeholder="Password" value={form.password} onChange={handleChange} required />
              </div>
            </div>

            {mode === "signin" && (
              <div className="modern-auth-options">
                <label className="modern-auth-remember">
                  <input type="checkbox" style={{accentColor: '#1e3a8a'}} /> Remember me
                </label>
                <a href="/forgot-password" className="modern-auth-forgot">Forgot password?</a>
              </div>
            )}

            <button type="submit" className="modern-auth-btn-primary" disabled={loading || registering} style={{marginTop: mode === "signup" ? '20px' : '0'}}>
              {loading || registering ? "PROCESSING..." : (mode === "signin" ? "LOGIN" : "REGISTER")}
            </button>
          </form>

          {mode === "signin" && (
            <>
              <div className="modern-auth-divider">Or login with</div>

              <div className="modern-auth-social-row">
                <button type="button" className="modern-auth-btn-social" onClick={() => googleLogin()}>
                  GOOGLE
                </button>
                <button type="button" className="modern-auth-btn-social" onClick={() => window.location.href = GITHUB_AUTH_URL}>
                  GITHUB
                </button>
              </div>

              <button type="button" className="modern-auth-btn-provider" onClick={() => setMode("signup")}>
                CREATE NEW ACCOUNT
              </button>
            </>
          )}

          {mode === "signup" && (
            <div className="modern-auth-switch">
              Already have an account? 
              <button type="button" className="modern-auth-switch-btn" onClick={() => { setMode("signin"); setError(""); setSuccess(""); setFieldErrors({}); }}>
                Sign In
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default Login;
