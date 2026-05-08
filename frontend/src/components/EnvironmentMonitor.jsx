import { useEffect, useState } from "react";
import api from "../api/axios.js";

const EnvironmentMonitor = () => {
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const { data } = await api.get("/external/summary");
        if (!cancelled) {
          setSummary(data);
          setError("");
        }
      } catch (err) {
        if (!cancelled) {
          setError(err?.response?.data?.message || "External feed unavailable.");
        }
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const weather = summary?.weather || {};
  const threats = summary?.threats || [];

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">Environment Monitor</span>
        <span className="badge badge-primary">Live</span>
      </div>

      {error ? (
        <p className="muted">{error}</p>
      ) : (
        <>
          <div className="grid grid-2" style={{ gap: 12, marginBottom: 16 }}>
            <div style={{ padding: 14, borderRadius: 12, background: "var(--panel-2)" }}>
              <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>
                Weather
              </div>
              <div style={{ fontSize: 28, fontWeight: 800 }}>{weather.temp ?? "--"}C</div>
              <div style={{ color: "var(--text-2)", fontSize: 13, textTransform: "capitalize" }}>
                {weather.condition || "No live data"}
              </div>
            </div>
            <div style={{ padding: 14, borderRadius: 12, background: "var(--panel-2)" }}>
              <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>
                Humidity / Wind
              </div>
              <div style={{ fontSize: 24, fontWeight: 800 }}>{weather.humidity ?? 0}%</div>
              <div style={{ color: "var(--text-2)", fontSize: 13 }}>
                Wind {weather.windSpeed ?? 0} km/h
              </div>
            </div>
          </div>

          {weather.warning && (
            <div className="alert alert-warning" style={{ marginBottom: 16 }}>
              {weather.warning}
            </div>
          )}

          <div>
            <div className="muted" style={{ fontSize: 12, marginBottom: 10 }}>
              Active threat signals
            </div>
            {threats.length ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {threats.slice(0, 4).map((item, index) => (
                  <div
                    key={`${item.type}-${index}`}
                    style={{
                      padding: "10px 12px",
                      borderRadius: 10,
                      background: "var(--panel-2)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                      <strong style={{ textTransform: "capitalize" }}>{item.type || "Threat"}</strong>
                      <span className={`badge badge-${item.severity === "critical" ? "danger" : "warning"}`}>
                        {item.severity || "watch"}
                      </span>
                    </div>
                    <div style={{ fontSize: 13, color: "var(--text-2)", marginTop: 6 }}>
                      {item.detail || "Monitoring elevated environmental activity."}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="muted">No significant external threats detected right now.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default EnvironmentMonitor;
