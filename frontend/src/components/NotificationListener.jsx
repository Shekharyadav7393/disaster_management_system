import { useEffect, useState } from "react";
import { socket } from "../socket/socket.js";

const getNoticeFromEvent = (type, payload) => {
  if (type === "new_alert") {
    return {
      id: payload?._id || `${Date.now()}-alert`,
      tone: "danger",
      title: payload?.title || "Emergency alert",
      message: payload?.message || payload?.description || "A new public alert has been issued.",
    };
  }

  if (type === "notification_created") {
    return {
      id: payload?._id || `${Date.now()}-notification`,
      tone: "primary",
      title: payload?.title || "Notification",
      message: payload?.message || "A new system notification is available.",
    };
  }

  if (type === "sos_alert") {
    return {
      id: payload?._id || `${Date.now()}-sos`,
      tone: "warning",
      title: "SOS escalation",
      message: payload?.message || "A new SOS request needs immediate attention.",
    };
  }

  return null;
};

const NotificationListener = () => {
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    const show = (type) => (payload) => {
      const next = getNoticeFromEvent(type, payload);
      if (next) {
        setNotice(next);
      }
    };

    const handleAlert = show("new_alert");
    const handleNotification = show("notification_created");
    const handleSOS = show("sos_alert");

    socket.on("new_alert", handleAlert);
    socket.on("notification_created", handleNotification);
    socket.on("sos_alert", handleSOS);

    return () => {
      socket.off("new_alert", handleAlert);
      socket.off("notification_created", handleNotification);
      socket.off("sos_alert", handleSOS);
    };
  }, []);

  useEffect(() => {
    if (!notice) return undefined;
    const timer = window.setTimeout(() => setNotice(null), 5000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  if (!notice) return null;

  return (
    <div
      style={{
        position: "fixed",
        right: 20,
        bottom: 20,
        zIndex: 1000,
        width: "min(360px, calc(100vw - 32px))",
        padding: 16,
        borderRadius: 14,
        border: "1px solid var(--border)",
        background: "rgba(10, 17, 31, 0.94)",
        backdropFilter: "blur(12px)",
        boxShadow: "0 20px 40px rgba(0,0,0,0.28)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
        <div>
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: `var(--${notice.tone})`,
              marginBottom: 6,
            }}
          >
            Live update
          </div>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>{notice.title}</div>
          <div style={{ color: "var(--text-2)", fontSize: 13, lineHeight: 1.5 }}>{notice.message}</div>
        </div>
        <button className="btn-icon" onClick={() => setNotice(null)} aria-label="Dismiss notification">
          x
        </button>
      </div>
    </div>
  );
};

export default NotificationListener;
