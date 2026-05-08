import { useCallback, useEffect, useState } from "react";
import PublicLayout from "../../modules/public/PublicLayout.jsx";
import api from "../../api/axios.js";
import { useSocket } from "../../hooks/useSocket.js";

const SEVERITY_COLORS = {
  low: { bg: "var(--success-subtle)", color: "var(--success)", label: "LOW RISK" },
  medium: { bg: "var(--warning-subtle)", color: "var(--warning)", label: "MEDIUM RISK" },
  high: { bg: "var(--danger-subtle)", color: "var(--danger)", label: "HIGH RISK" },
  safe: { bg: "rgba(100,116,139,0.1)", color: "var(--muted)", label: "SAFE" },
};

const PublicRisk = () => {
  const [zones, setZones] = useState([]);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useSocket({
    risk_updated: (data) => {
      if (Array.isArray(data)) {
        setZones(data);
      }
    },
  });

  const load = useCallback(async () => {
    setError("");
    setLoading(true);
    try {
      const { data } = await api.get("/zones");
      setZones(data || []);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Failed to load risk zone data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = zones.filter(a => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      (a.name || "").toLowerCase().includes(q) ||
      (a.zoneName || "").toLowerCase().includes(q) ||
      (a.type || "").toLowerCase().includes(q)
    );
  });

  return (
    <PublicLayout>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800 }}>⚠️ Area Risk Zones</h1>
        <p style={{ color: "var(--text-2)", marginTop: 6 }}>
          Check the current risk level of zones in your area. Data is updated in real-time from our sensor network.
        </p>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <input
          className="input"
          placeholder="🔍 Search by zone name or type..."
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="loading-page"><div className="spinner" /></div>
      ) : filtered.length === 0 ? (
        <div className="card empty-state">
          <div className="empty-icon">🗺</div>
          <p>{query ? `No zones found for "${query}"` : "No risk zones available."}</p>
        </div>
      ) : (
        <div className="grid grid-3">
          {filtered.map(a => {
            const sev = (a.riskLevel || a.status || "safe").toLowerCase();
            const c = SEVERITY_COLORS[sev] || SEVERITY_COLORS.safe;
            return (
              <div key={a._id} className="card" style={{
                borderLeft: `4px solid ${c.color}`,
                background: c.bg,
              }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{a.name || a.zoneName}</div>
                {a.type && <div className="muted">{a.type}</div>}
                <div style={{
                  marginTop: 8,
                  display: "inline-block",
                  background: c.bg,
                  color: c.color,
                  fontWeight: 700,
                  fontSize: 11,
                  padding: "2px 8px",
                  borderRadius: 999,
                  border: `1px solid ${c.color}`,
                }}>
                  {c.label}
                </div>
                {a.riskScore !== undefined && (
                  <div className="muted mt-8">Risk Score: {a.riskScore}</div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="card" style={{ marginTop: 24, textAlign: "center" }}>
        <p style={{ fontSize: 13, color: "var(--muted)" }}>
          Risk levels are computed from sensor readings, weather data, and historical patterns.
          For real-time alerts, visit the <a href="/alerts" style={{ color: "var(--primary)" }}>Alerts page →</a>
        </p>
      </div>
    </PublicLayout>
  );
};

export default PublicRisk;
