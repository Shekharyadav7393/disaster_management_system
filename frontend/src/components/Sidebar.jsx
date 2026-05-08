import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const adminNavItems = [
  { path: "/admin", label: "Dashboard", icon: "📊", end: true },
  { path: "/admin/alerts", label: "Live Alerts", icon: "⚡" },
  { path: "/admin/missions", label: "Missions", icon: "🎯" },
  { path: "/admin/risk-zones", label: "Risk Zones", icon: "⚠️" },
  { path: "/admin/disaster-types", label: "Disaster Types", icon: "📋" },
  { path: "/admin/rescue", label: "Rescue Teams", icon: "🚑" },
  { path: "/admin/camps", label: "Relief Camps", icon: "🏕️" },
  { path: "/admin/donations", label: "Donations", icon: "💰" },
  { path: "/admin/reports", label: "Disaster Reports", icon: "📢" },
  { path: "/admin/volunteers", label: "Volunteers", icon: "🤝" },
  { path: "/admin/sos", label: "SOS Requests", icon: "🆘" },
  { path: "/admin/notifications", label: "Notifications", icon: "🔔" },
  { path: "/admin/analytics", label: "Analytics", icon: "📈" },
  { path: "/admin/settings", label: "Settings", icon: "⚙️" },
];

const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const initials = user?.name
    ? user.name.split(" ").map((word) => word[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  return (
    <>
      <div className={`sidebar-overlay ${isOpen ? "open" : ""}`} onClick={onClose} />
      <aside className={`sidebar ${isOpen ? "open" : ""}`}>
        <div className="sidebar-brand">
          <h2>DisasterMS</h2>
          <p>Emergency Management System</p>
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-section">
            <div className="sidebar-section-label">Navigation</div>
            {adminNavItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.end}
                className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
                onClick={onClose}
              >
                <span className="nav-icon">{item.icon}</span>
                {item.label}
              </NavLink>
            ))}
          </div>

          <div className="sidebar-section" style={{ marginTop: "8px" }}>
            <div className="sidebar-section-label">Public Portal</div>
            <NavLink to="/" className="nav-link" onClick={onClose}>
              <span className="nav-icon">Web</span>
              Public Portal
            </NavLink>
          </div>
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar">{initials}</div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{user?.name || "Admin"}</div>
              <div className="sidebar-user-role">{user?.role}</div>
            </div>
            <button
              className="btn-icon"
              onClick={handleLogout}
              title="Logout"
              style={{ padding: "6px", marginLeft: "auto" }}
            >
              Out
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
