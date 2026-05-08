import { useState, useEffect } from "react";
import PublicNavbar from "../../components/PublicNavbar.jsx";
import { socket } from "../../socket/socket.js";

const PublicLayout = ({ children }) => {
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    if (!socket.connected) {
      socket.connect();
    }

    const handleAlert = (alert) => {
      console.log("Real-time alert received:", alert);
      setNotification(alert);
      setTimeout(() => setNotification(null), 12000);
    };

    socket.on("new_alert", handleAlert);

    return () => {
      socket.off("new_alert", handleAlert);
    };
  }, []);

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", position: "relative" }}>
      {notification && (
        <div className="global-notification">
          <div className="notification-content">
            <span className="notification-icon">🚨</span>
            <div className="notification-text">
              <strong>{notification.zone?.name || "IDMEWS"} ALERT</strong>
              <p>{notification.message}</p>
            </div>
            <button className="notification-close" onClick={() => setNotification(null)}>✕</button>
          </div>
        </div>
      )}
      <PublicNavbar />
      <main className="public-page fade-in" style={{ flex: 1 }}>
        {children}
      </main>

      {/* Premium Footer */}
      <footer style={{
        background: "linear-gradient(180deg, var(--panel) 0%, var(--bg) 100%)",
        borderTop: "1px solid var(--border)",
        padding: "48px 24px 32px",
        color: "var(--text-2)",
        marginTop: "auto",
      }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
          {/* Brand & Links */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 32, marginBottom: 32 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <div style={{
                  width: 36, height: 36, background: "linear-gradient(135deg, var(--primary), var(--cyan))",
                  borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18
                }}>⚡</div>
                <span style={{ fontSize: 16, fontWeight: 700, background: "linear-gradient(135deg, var(--primary), var(--cyan))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                  DisasterMS
                </span>
              </div>
              <p style={{ fontSize: 13, color: "var(--muted)", maxWidth: 280, lineHeight: 1.6 }}>
                India's unified disaster management platform connecting citizens, rescue teams, and relief organizations.
              </p>
            </div>

            <div style={{ display: "flex", gap: 48, flexWrap: "wrap" }}>
              <div>
                <p style={{ fontWeight: 600, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--muted)", marginBottom: 12 }}>Quick Links</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <a href="/" style={{ fontSize: 13, fontWeight: 500, transition: "color 0.2s" }}>Home</a>
                  <a href="/alerts" style={{ fontSize: 13, fontWeight: 500 }}>Live Alerts</a>
                  <a href="/map" style={{ fontSize: 13, fontWeight: 500 }}>Live Map</a>
                  <a href="/camps" style={{ fontSize: 13, fontWeight: 500 }}>Relief Camps</a>
                </div>
              </div>
              <div>
                <p style={{ fontWeight: 600, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--muted)", marginBottom: 12 }}>Get Involved</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <a href="/donate" style={{ fontSize: 13, fontWeight: 500 }}>Donate</a>
                  <a href="/volunteer" style={{ fontSize: 13, fontWeight: 500 }}>Volunteer</a>
                  <a href="/transparency" style={{ fontSize: 13, fontWeight: 500 }}>Transparency</a>
                  <a href="/report-disaster" style={{ fontSize: 13, fontWeight: 500 }}>Report Disaster</a>
                </div>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div style={{ borderTop: "1px solid var(--border)", paddingTop: 20, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
            <p style={{ fontSize: 12, color: "var(--muted)" }}>
              © 2025 DisasterMS — Unified Emergency Response Platform
            </p>
            <div style={{
              padding: "8px 16px",
              background: "var(--danger-subtle)",
              borderRadius: 8,
              border: "1px solid rgba(239,68,68,0.2)",
            }}>
              <p style={{ fontSize: 13, color: "var(--danger)", margin: 0, fontWeight: 700 }}>
                🚨 Emergency: <a href="tel:112" style={{ color: "var(--danger)", textDecoration: "underline" }}>112</a>
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicLayout;
