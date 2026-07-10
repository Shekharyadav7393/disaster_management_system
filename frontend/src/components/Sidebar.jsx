import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const adminNavItems = [
  { path: "/admin", label: "Dashboard", icon: "📊", end: true, allowedRoles: ["super_admin", "admin", "emergency_admin"] },
  { path: "/admin/alerts", label: "Live Alerts", icon: "⚡", allowedRoles: ["super_admin", "emergency_admin"] },
  { path: "/admin/missions", label: "Missions", icon: "🎯", allowedRoles: ["super_admin", "emergency_admin"] },
  { path: "/admin/risk-zones", label: "Risk Zones", icon: "⚠️", allowedRoles: ["super_admin", "emergency_admin"] },
  { path: "/admin/rescue", label: "Rescue Teams", icon: "🚑", allowedRoles: ["super_admin", "emergency_admin"] },
  { path: "/admin/sos", label: "SOS Requests", icon: "🆘", allowedRoles: ["super_admin", "emergency_admin"] },
  
  { path: "/admin/disaster-types", label: "Disaster Types", icon: "📋", allowedRoles: ["super_admin"] },
  { path: "/admin/settings", label: "Settings", icon: "⚙️", allowedRoles: ["super_admin"] },

  { path: "/admin/camps", label: "Relief Camps", icon: "🏕️", allowedRoles: ["super_admin", "admin"] },
  { path: "/admin/donations", label: "Donations", icon: "💰", allowedRoles: ["super_admin", "admin"] },
  { path: "/admin/reports", label: "Disaster Reports", icon: "📢", allowedRoles: ["super_admin", "admin"] },
  { path: "/admin/volunteers", label: "Volunteers", icon: "🤝", allowedRoles: ["super_admin", "admin"] },
  { path: "/admin/notifications", label: "Notifications", icon: "🔔", allowedRoles: ["super_admin", "admin", "emergency_admin"] },
  { path: "/admin/analytics", label: "Analytics", icon: "📈", allowedRoles: ["super_admin", "admin", "emergency_admin"] },
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
            {adminNavItems
              .filter(item => !item.allowedRoles || (user && item.allowedRoles.includes(user.role)))
              .map((item) => (
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
