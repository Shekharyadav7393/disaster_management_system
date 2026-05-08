import { useState, useEffect } from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { getRedirectPath } from "../utils/authUtils.js";

const publicNavLinks = [
  { path: "/", label: "Home", icon: "🏠", end: true },
  { path: "/alerts", label: "Alerts", icon: "🚨" },
  { path: "/map", label: "Live Map", icon: "🗺" },
  { path: "/risk", label: "Risk Zones", icon: "⚠️" },
  { path: "/camps", label: "Relief Camps", icon: "🏕" },
  { path: "/donate", label: "Donate", icon: "💙" },
  { path: "/transparency", label: "Transparency", icon: "🔍" },
  { path: "/gallery", label: "Gallery", icon: "🎬" },
  { path: "/request-help", label: "Get Help", icon: "📞" },
];

const PublicNavbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className={`public-header ${scrolled ? "scrolled" : ""}`}>
      <div className="public-header-inner">
        <Link to="/" className="public-brand">
          <div className="public-brand-logo">⚡</div>
          <span className="public-brand-text">DisasterMS</span>
        </Link>

        <nav className="public-nav">
          {publicNavLinks.map(link => (
            <NavLink
              key={link.path}
              to={link.path}
              end={link.end}
              className={({ isActive }) =>
                `public-nav-link ${isActive ? "active" : ""}`
              }
            >
              <span className="nav-icon">{link.icon}</span>
              <span className="nav-label">{link.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="public-nav-actions">
          {user ? (
            <div className="user-nav-group">
              <Link to={getRedirectPath(user.role)} className="btn btn-sm btn-glass">
                👤 {user.name?.split(" ")[0]}
              </Link>
              <button
                className="btn btn-sm btn-ghost"
                onClick={() => { logout(); navigate("/login"); }}
              >
                Logout
              </button>
            </div>
          ) : (
            <Link to="/login" className="btn btn-primary btn-sm btn-glow">
              🔐 Sign In
            </Link>
          )}
          <button className="mobile-toggle" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? "✕" : "☰"}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div className={`mobile-menu ${menuOpen ? "open" : ""}`}>
          {publicNavLinks.map(link => (
            <NavLink
              key={link.path}
              to={link.path}
              end={link.end}
              className={({ isActive }) =>
                `mobile-nav-link ${isActive ? "active" : ""}`
              }
              onClick={() => setMenuOpen(false)}
            >
              {link.icon} {link.label}
            </NavLink>
          ))}
          {!user && (
             <Link to="/login" className="btn btn-primary" style={{ marginTop: 12 }} onClick={() => setMenuOpen(false)}>
               🔐 Sign In
             </Link>
          )}
      </div>
    </header>
  );
};

export default PublicNavbar;
