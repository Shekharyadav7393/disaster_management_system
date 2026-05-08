import { useEffect, useState } from "react";
import api from "../api/axios.js";

const PredictionPanel = () => {
  const [zones, setZones] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const { data } = await api.get("/dashboard/zone-risk");
        if (!cancelled) {
          setZones(Array.isArray(data) ? data : []);
          setError("");
        }
      } catch (err) {
        if (!cancelled) {
          setError(err?.response?.data?.message || "Prediction data unavailable.");
        }
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">Risk Forecast</span>
        <span className="badge badge-warning">AI assisted</span>
      </div>

      {error ? (
        <p className="muted">{error}</p>
      ) : zones.length ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {zones.slice(0, 5).map((zone) => {
            const score = Math.max(0, Math.min(100, Number(zone.score ?? zone.riskScore ?? 0)));
            return (
              <div
                key={zone._id || zone.name}
                style={{
                  padding: 12,
                  borderRadius: 12,
                  background: "var(--panel-2)",
                  border: "1px solid var(--border)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 8 }}>
                  <strong>{zone.name || "Risk zone"}</strong>
                  <span className={`badge badge-${score >= 75 ? "danger" : score >= 50 ? "warning" : "success"}`}>
                    {score}%
                  </span>
                </div>
                <div style={{ height: 8, background: "var(--border)", borderRadius: 999, overflow: "hidden" }}>
                  <div
                    style={{
                      width: `${score}%`,
                      height: "100%",
                      background:
                        score >= 75
                          ? "linear-gradient(90deg, #dc2626, #ef4444)"
                          : score >= 50
                            ? "linear-gradient(90deg, #d97706, #f59e0b)"
                            : "linear-gradient(90deg, #059669, #10b981)",
                    }}
                  />
                </div>
                <div style={{ fontSize: 12, color: "var(--text-2)", marginTop: 8 }}>
                  {zone.summary || `Current level: ${(zone.riskLevel || "low").toString().toUpperCase()}`}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="muted">No risk predictions available yet.</p>
      )}
    </div>
  );
};

export default PredictionPanel;
