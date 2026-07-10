import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../api/axios.js";
import { getRedirectPath } from "../utils/authUtils.js";
import { useGoogleLogin } from "@react-oauth/google";
import "./Login.css";

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
      setSuccess("Account created successfully! Please sign in.");
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
      const result = await externalLogin('google', { access_token: tokenResponse.access_token });
      if (result.ok) navigate(getRedirectPath(result.user?.role));
      else setError(result.message || "Google Login Failed");
    },
    onError: () => setError("Google Login Failed"),
  });

  return (
    <div className="modern-auth-container">
      <div className="modern-auth-card">
        
        {/* HEADER */}
        <div className="modern-auth-header">
          <h1 className="modern-auth-title">
            {mode === "signin" ? "WELCOME BACK" : "CREATE ACCOUNT"}
          </h1>
          <p className="modern-auth-subtitle">
            {mode === "signin" 
              ? "Welcome back! Please enter your details." 
              : "Register details to join DisasterMS."}
          </p>
        </div>

        {/* ALERTS */}
        {error && <div className="modern-auth-alert modern-auth-alert-error">{error}</div>}
        {success && <div className="modern-auth-alert modern-auth-alert-success">{success}</div>}

        {/* FORM CONTAINER */}
        <div className="modern-auth-form-container">
          <form onSubmit={mode === "signin" ? handleLogin : handleRegister}>
            
            {mode === "signup" && (
              <>
                <div className="modern-auth-field">
                  <label className="modern-auth-label">Name</label>
                  <div className={`modern-auth-input-wrapper ${fieldErrors.name ? "error" : ""}`}>
                    <input 
                      className="modern-auth-input" 
                      name="name" 
                      placeholder="Enter your name" 
                      value={form.name} 
                      onChange={handleChange} 
                      required 
                    />
                  </div>
                </div>

                <div className="modern-auth-field">
                  <label className="modern-auth-label">Phone</label>
                  <div className={`modern-auth-input-wrapper ${fieldErrors.phone ? "error" : ""}`}>
                    <input 
                      className="modern-auth-input" 
                      name="phone" 
                      type="tel"
                      placeholder="Enter your phone number" 
                      value={form.phone} 
                      onChange={handleChange} 
                      required 
                    />
                  </div>
                </div>
              </>
            )}

            <div className="modern-auth-field">
              <label className="modern-auth-label">Email</label>
              <div className={`modern-auth-input-wrapper ${fieldErrors.email ? "error" : ""}`}>
                <input 
                  className="modern-auth-input" 
                  name="email" 
                  type="email" 
                  placeholder="Enter your email" 
                  value={form.email} 
                  onChange={handleChange} 
                  required 
                />
              </div>
            </div>

            <div className="modern-auth-field">
              <label className="modern-auth-label">Password</label>
              <div className={`modern-auth-input-wrapper ${fieldErrors.password ? "error" : ""}`}>
                <input 
                  className="modern-auth-input" 
                  name="password" 
                  type="password" 
                  placeholder="*********" 
                  value={form.password} 
                  onChange={handleChange} 
                  required 
                />
              </div>
            </div>

            {mode === "signin" && (
              <div className="modern-auth-options">
                <label className="modern-auth-remember">
                  <input type="checkbox" /> Remember me
                </label>
                <a href="/forgot-password" className="modern-auth-forgot">Forgot password</a>
              </div>
            )}

            <button type="submit" className="modern-auth-btn-primary" disabled={loading || registering}>
              {loading || registering ? "Please wait..." : (mode === "signin" ? "Sign in" : "Sign up")}
            </button>
          </form>

          {mode === "signin" && (
            <div className="modern-auth-social-area">
              <button type="button" className="modern-auth-btn-social-google" onClick={() => googleLogin()}>
                <svg className="google-icon-svg" viewBox="0 0 24 24">
                  <path fill="#EA4335" d="M12 5.04c1.62 0 3.08.56 4.22 1.65l3.16-3.16C17.47 1.7 14.96 1 12 1 7.37 1 3.4 3.65 1.5 7.5l3.65 2.83C6.01 7.16 8.78 5.04 12 5.04z" />
                  <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.34H12v4.45h6.45c-.28 1.47-1.1 2.71-2.35 3.55l3.64 2.82c2.13-1.97 3.75-4.87 3.75-8.52z" />
                  <path fill="#FBBC05" d="M5.15 14.67c-.24-.71-.38-1.47-.38-2.27s.14-1.56.38-2.27L1.5 7.3C.54 9.22 0 11.35 0 13.6c0 2.25.54 4.38 1.5 6.3l3.65-2.83c-.24-.71-.38-1.47-.38-2.27z" />
                  <path fill="#34A853" d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.64-2.82c-1.01.68-2.3 1.09-3.95 1.09-3.22 0-5.99-2.12-6.96-5.29L1.5 16.9C3.4 20.75 7.37 23 12 23z" />
                </svg>
                Sign in with Google
              </button>
            </div>
          )}

          <div className="modern-auth-switch">
            {mode === "signin" ? (
              <>
                Don't have an account?{" "}
                <button type="button" className="modern-auth-switch-btn" onClick={() => { setMode("signup"); setError(""); setSuccess(""); setFieldErrors({}); }}>
                  Sign up to free!
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button type="button" className="modern-auth-switch-btn" onClick={() => { setMode("signin"); setError(""); setSuccess(""); setFieldErrors({}); }}>
                  Sign in!
                </button>
              </>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default Login;
