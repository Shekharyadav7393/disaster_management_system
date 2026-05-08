import { useState } from "react";
import Sidebar from "../../components/Sidebar.jsx";

const AdminLayout = ({ title, action, children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
            <h1 className="topbar-title">{title}</h1>
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
