import { useCallback, useEffect, useState } from "react";
import PublicLayout from "../../modules/public/PublicLayout.jsx";
import { fetchPublicActiveAlerts } from "../../api/alert.api.js";
import AlertCard from "../../components/AlertCard.jsx";
import { useSocket } from "../../hooks/useSocket.js";

const PublicAlerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const normalizeAlert = (alert) => ({
    ...alert,
    _id: alert._id || alert.id,
    type: alert.type || alert.disasterType,
  });

  const load = useCallback(async () => {
    setError("");
    setLoading(true);
    try {
      const data = await fetchPublicActiveAlerts();
      setAlerts(data || []);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Failed to load alerts.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useSocket({
    new_alert: (alert) => {
      const normalized = normalizeAlert(alert);
      setAlerts((prev) => {
        if (prev.some((item) => item._id === normalized._id)) return prev;
        return [normalized, ...prev];
      });
    },
  });

  const disasterTypes = ["all", ...new Set(alerts.map(a => a.type).filter(Boolean))];
  const filtered = filter === "all" ? alerts : alerts.filter(a => a.type === filter);
  const criticals = alerts.filter(a => a.severity === "critical" || a.severity === "high").length;

  return (
    <PublicLayout>
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, flexWrap: "wrap", gap: 8 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800 }}>🚨 Live Disaster Alerts</h1>
            <p style={{ color: "var(--text-2)", marginTop: 4 }}>
              {alerts.length} active alert{alerts.length !== 1 ? "s" : ""}
              {criticals > 0 && <span style={{ color: "var(--danger)", marginLeft: 8 }}>· {criticals} critical</span>}
            </p>
          </div>
          <button className="btn" onClick={load}>🔄 Refresh</button>
        </div>

        {/* Type filter */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {disasterTypes.map(t => (
            <button
              key={t}
              className={`btn btn-sm ${filter === t ? "btn-primary" : ""}`}
              onClick={() => setFilter(t)}
            >
              {t === "all" ? "All Types" : t}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="loading-page"><div className="spinner" /></div>
      ) : filtered.length === 0 ? (
        <div className="card empty-state">
          <div className="empty-icon">✅</div>
          <p>No active alerts{filter !== "all" ? ` for "${filter}"` : ""}. Stay safe!</p>
        </div>
      ) : (
        <div>
          {filtered.map((a) => <AlertCard key={a._id || a.id} alert={a} />)}
        </div>
      )}
    </PublicLayout>
  );
};

export default PublicAlerts;
