import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";

const AdminLogin = () => {
  const { user, login, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      const role = user.role;
      if (["admin", "super_admin", "emergency_admin"].includes(role)) {
        navigate("/admin", { replace: true });
      }
      // If a non-admin visits the admin login page, we let them stay so they can log in as an admin.
    }
  }, [user, navigate]);

  const [form, setForm] = useState({ email: "admin@disasterms.local", password: "" });
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setFieldErrors((f) => ({ ...f, [name]: "" }));
  };

  const validateFields = () => {
    const errs = {};
    if (!form.email.trim()) errs.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = "Invalid email format";
    if (!form.password) errs.password = "Password is required";
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!validateFields()) return;
    setError("");
    const result = await login({ email: form.email, password: form.password });
    if (result.ok) {
      const role = result.user?.role;
      if (["admin", "super_admin", "emergency_admin"].includes(role)) {
        navigate("/admin");
      } else {
        setError("Access denied. Admin credentials required.");
        // Clear the stored user since they don't have admin access
        localStorage.removeItem("dms_user");
        localStorage.removeItem("dms_token");
        window.location.reload();
      }
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="auth-page admin-auth-page">
      {/* Animated background elements */}
      <div className="auth-bg-gradient admin-bg-gradient-1" />
      <div className="auth-bg-gradient admin-bg-gradient-2" />
      <div className="auth-bg-gradient admin-bg-gradient-3" />

      {/* Hex grid pattern */}
      <div className="admin-hex-pattern" />

      {/* Floating particles */}
      <div className="auth-particles">
        {[...Array(10)].map((_, i) => (
          <div key={i} className="auth-particle admin-particle" />
        ))}
      </div>

      <div className="admin-login-container">
        {/* Admin shield logo */}
        <div className="admin-login-header">
          <div className="admin-shield">
            <div className="admin-shield-inner">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                <path d="M9 12l2 2 4-4"/>
              </svg>
            </div>
            <div className="admin-shield-ring" />
            <div className="admin-shield-ring admin-shield-ring-2" />
          </div>
          
          <div className="admin-login-title">
            <h1>Admin Control Center</h1>
            <div className="admin-login-badge">
              <span className="admin-pulse-dot" />
              DisasterMS — Command Interface
            </div>
          </div>
        </div>

        {/* Login card */}
        <div className="admin-login-card">
          <div className="admin-card-header">
            <div className="admin-card-icon">🔐</div>
            <div>
              <h2>Administrator Access</h2>
              <p>Enter your admin credentials to continue</p>
            </div>
          </div>

          {error && (
            <div className="auth-alert auth-alert-error">
              <span>⚠️</span> {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="auth-form">
            <div className="auth-field">
              <label htmlFor="admin-email">Admin Email</label>
              <div className={`auth-input-wrapper admin-input ${fieldErrors.email ? "error" : ""}`}>
                <span className="auth-input-icon">📧</span>
                <input
                  id="admin-email"
                  name="email"
                  type="email"
                  placeholder="admin@disasterms.local"
                  value={form.email}
                  onChange={handleChange}
                  autoComplete="email"
                  required
                />
              </div>
              {fieldErrors.email && <span className="auth-field-error">{fieldErrors.email}</span>}
            </div>

            <div className="auth-field">
              <label htmlFor="admin-password">Password</label>
              <div className={`auth-input-wrapper admin-input ${fieldErrors.password ? "error" : ""}`}>
                <span className="auth-input-icon">🔑</span>
                <input
                  id="admin-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter admin password"
                  value={form.password}
                  onChange={handleChange}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="auth-toggle-pw"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
              {fieldErrors.password && <span className="auth-field-error">{fieldErrors.password}</span>}
            </div>

            <button id="admin-login-submit" className="auth-submit-btn admin-submit-btn" type="submit" disabled={loading}>
              {loading ? (
                <><span className="auth-btn-spinner" /> Authenticating...</>
              ) : (
                <>Access Control Center <span className="auth-btn-arrow">→</span></>
              )}
            </button>
          </form>

          <div className="admin-card-footer">
            <div className="admin-security-badge">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              <span>256-bit encrypted · Authorized personnel only</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
