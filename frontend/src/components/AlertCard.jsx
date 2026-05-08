import { Link } from "react-router-dom";

const severityColors = {
  low: {
    bg: "rgba(16,185,129,0.08)",
    border: "rgba(16,185,129,0.25)",
    text: "var(--success)",
    badge: "badge-success",
  },
  medium: {
    bg: "rgba(245,158,11,0.08)",
    border: "rgba(245,158,11,0.25)",
    text: "var(--warning)",
    badge: "badge-warning",
  },
  high: {
    bg: "rgba(239,68,68,0.08)",
    border: "rgba(239,68,68,0.25)",
    text: "var(--danger)",
    badge: "badge-danger",
  },
  critical: {
    bg: "rgba(239,68,68,0.15)",
    border: "rgba(239,68,68,0.4)",
    text: "var(--danger)",
    badge: "badge-danger",
  },
};

const typeIcons = {
  flood: "Flood",
  earthquake: "Quake",
  fire: "Fire",
  cyclone: "Storm",
  landslide: "Slide",
  gas: "Gas",
  drought: "Heat",
  other: "Alert",
};

const AlertCard = ({ alert, actions }) => {
  const sev = (alert.severity || "low").toLowerCase();
  const colors = severityColors[sev] || severityColors.low;
  const title = alert.title || alert.zoneName || "Alert";
  const details = alert.description || alert.message || "No description";
  const typeIcon = typeIcons[alert.type] || "Alert";
  const isActive = alert.status === "active";
  const safetyLines = Array.isArray(alert.instructions)
    ? alert.instructions
    : String(alert.safetyInstructions || "")
        .split(".")
        .map((item) => item.trim())
        .filter(Boolean);

  return (
    <div
      className="card alert-card"
      style={{
        marginBottom: 16,
        flex: 1,
        display: "flex",
        flexDirection: "column",
        borderLeft: `5px solid ${colors.text}`,
        background: colors.bg,
        borderColor: colors.border,
        boxShadow: isActive ? `0 0 15px ${colors.border}` : "none",
        transition: "all 0.3s ease",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {isActive && (
        <div
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            padding: "4px 12px",
            background: colors.text,
            color: "white",
            fontSize: "10px",
            fontWeight: "bold",
            letterSpacing: "1px",
            borderBottomLeftRadius: "8px",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <span className="pulse-dot"></span>
          LIVE RESPONSE
        </div>
      )}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "stretch",
          gap: 16,
          padding: "4px 0",
          flex: 1,
        }}
      >
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 8,
            }}
          >
            <span style={{ fontSize: "20px", fontWeight: 700 }}>{typeIcon}</span>
            <div>
              <div
                style={{
                  fontWeight: 800,
                  fontSize: "16px",
                  color: "var(--text)",
                }}
              >
                {title}
              </div>
              <div className="muted" style={{ fontSize: "12px" }}>
                {new Date(alert.createdAt).toLocaleString()}
              </div>
            </div>
          </div>

          <div
            style={{
              fontSize: "14px",
              lineHeight: 1.6,
              color: "var(--text-secondary)",
              background: "rgba(255,255,255,0.05)",
              padding: "10px",
              borderRadius: "8px",
              border: "1px solid rgba(0,0,0,0.05)",
            }}
          >
            {details}
          </div>

          <div style={{ display: "flex", gap: 12, marginTop: 12, flexWrap: "wrap" }}>
            {alert.location?.city && (
              <span className="badge badge-muted" style={{ fontSize: "11px" }}>
                {alert.location.city}
              </span>
            )}
            <span
              className={`badge ${colors.badge}`}
              style={{ fontSize: "11px", fontWeight: "bold" }}
            >
              {sev.toUpperCase()}
            </span>
            <span className="badge badge-outline" style={{ fontSize: "11px" }}>
              {(alert.type || "alert").toUpperCase()}
            </span>
          </div>

          {safetyLines.length > 0 && (
            <div style={{ marginTop: "auto", paddingTop: 12 }}>
              <div
                style={{
                  fontSize: "11px",
                  fontWeight: "bold",
                  marginBottom: 4,
                  opacity: 0.7,
                }}
              >
                SAFETY PROTOCOLS:
              </div>
              <ul className="muted" style={{ fontSize: "12px", paddingLeft: 18 }}>
                {safetyLines.slice(0, 3).map((item, index) => (
                  <li key={index} style={{ marginBottom: 2 }}>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
            alignItems: "flex-end",
            marginTop: 4,
            justifyContent: "flex-end",
          }}
        >
          <Link
            to={`/timeline/${alert._id || alert.id}`}
            className="btn btn-sm btn-outline"
            style={{ fontSize: "11px", width: "100%" }}
          >
            System Timeline
          </Link>
          {actions}
        </div>
      </div>

      <style>{`
        .pulse-dot {
          width: 6px;
          height: 6px;
          background: white;
          border-radius: 50%;
          display: inline-block;
          animation: pulse 1.5s infinite;
        }
        @keyframes pulse {
          0% { transform: scale(0.95); opacity: 0.9; }
          70% { transform: scale(1.5); opacity: 0; }
          100% { transform: scale(0.95); opacity: 0; }
        }
        .alert-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        }
      `}</style>
    </div>
  );
};

export default AlertCard;
