import { useState } from "react";
import Sidebar from "../../components/Sidebar.jsx";
import { useNavigate } from "react-router-dom";

const AdminLayout = ({ title, action, children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // In a real app, you might route to a global search results page.
      // For now, we will simply alert or console log.
      alert(`Global search: ${searchQuery}`);
      setSearchQuery("");
    }
  };

  return (
    <>
      <div className="layout">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="content">
        <div className="topbar">
          <div className="topbar-left">
            <button
              className="hamburger"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
            >
              <span />
              <span />
              <span />
            </button>
            <h1 className="topbar-title" style={{ display: "none" }}>{title}</h1>
            <h1 className="topbar-title desktop-only" style={{ marginLeft: 16 }}>{title}</h1>
          </div>
          <div className="topbar-center" style={{ flex: 1, padding: "0 20px" }}>
            <form onSubmit={handleSearch} style={{ display: "flex", width: "100%", maxWidth: "400px", margin: "0 auto" }}>
              <input 
                type="text" 
                className="input" 
                placeholder="Search anything (alerts, users, reports)..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ borderRadius: "20px", padding: "8px 16px", background: "var(--panel-2)", border: "1px solid var(--border)", color: "var(--text-1)", width: "100%" }}
              />
            </form>
          </div>
          <div className="topbar-right">
            {action}
          </div>
        </div>
        <div className="page fade-in">{children}</div>
      </div>
    </div>
    </>
  );
};

export default AdminLayout;
