import { useCallback, useEffect, useState } from "react";
import AdminLayout from "../../modules/admin/AdminLayout.jsx";
import StatsCard from "../../components/StatsCard.jsx";
import { fetchOverview, fetchDonorRanking, fetchDonationStats } from "../../api/donation.api.js";

// Inline mini bar chart — DisasterCharts.jsx delete ho gaya, yahan inline banaya
const MiniBarChart = ({ data, valueKey, labelKey, color = "var(--success)" }) => {
  if (!data?.length) return <p className="muted">No data available.</p>;
  const max = Math.max(...data.map(d => d[valueKey] || 0), 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 100, paddingTop: 16 }}>
      {data.map((d, i) => {
        const pct = ((d[valueKey] || 0) / max) * 100;
        return (
          <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", height: "100%" }}>
            <div style={{ fontSize: 9, color: "var(--muted)", marginBottom: 3 }}>
              {d[valueKey] > 0 ? `₹${Math.round((d[valueKey]) / 1000)}k` : ""}
            </div>
            <div style={{
              width: "100%", borderRadius: "3px 3px 0 0",
              background: color, height: `${Math.max(pct, 2)}%`, opacity: 0.85,
            }} />
            <div style={{ fontSize: 9, color: "var(--muted)", marginTop: 3 }}>
              {String(d[labelKey] || "").slice(-5)}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const AdminDonations = () => {
  const [overview, setOverview] = useState(null);
  const [donors, setDonors] = useState([]);
  const [donationStats, setDonationStats] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setError("");
    setLoading(true);
    try {
      const [overviewData, donorData, statsData] = await Promise.all([
        fetchOverview(),
        fetchDonorRanking(10),
        fetchDonationStats(),
      ]);
      setOverview(overviewData);
      setDonors(donorData || []);
      setDonationStats(statsData || []);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Failed to load donations.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <AdminLayout
      title="Donation Analytics"
      action={<button className="btn" onClick={load}>🔄 Refresh</button>}
    >
      {error && <div className="alert alert-error">{error}</div>}

      {/* Stats cards */}
      <div className="stats-grid" style={{ marginBottom: 20 }}>
        <div className="stat-card" style={{ "--accent-color": "var(--success)" }}>
          <div className="stat-icon">💰</div>
          <div className="stat-value" style={{ color: "var(--success)" }}>
            ₹{((overview?.totalDonationsAmount) || 0).toLocaleString()}
          </div>
          <div className="stat-label">Total Money Donated</div>
        </div>
        <div className="stat-card" style={{ "--accent-color": "var(--primary)" }}>
          <div className="stat-icon">👥</div>
          <div className="stat-value" style={{ color: "var(--primary)" }}>{overview?.totalDonors ?? "—"}</div>
          <div className="stat-label">Total Donors</div>
        </div>
        <div className="stat-card" style={{ "--accent-color": "var(--warning)" }}>
          <div className="stat-icon">🏕</div>
          <div className="stat-value" style={{ color: "var(--warning)" }}>{overview?.totalReliefCamps ?? "—"}</div>
          <div className="stat-label">Relief Camps</div>
        </div>
      </div>

      {/* Chart */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-title" style={{ marginBottom: 8 }}>💰 Donation Trend (Last 7 Days)</div>
        {loading ? (
          <div style={{ height: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div className="spinner" />
          </div>
        ) : (
          <MiniBarChart data={donationStats} valueKey="totalAmount" labelKey="date" />
        )}
      </div>

      {/* Top Donors Table */}
      <div className="card">
        <div className="card-title" style={{ marginBottom: 12 }}>🏆 Top Donors</div>
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Name</th>
                <th>Type</th>
                <th>Total Donated (₹)</th>
              </tr>
            </thead>
            <tbody>
              {donors.map((d, i) => (
                <tr key={d._id}>
                  <td>
                    <span style={{ fontWeight: 700, color: i < 3 ? "var(--warning)" : "var(--muted)" }}>
                      {i < 3 ? ["🥇", "🥈", "🥉"][i] : `#${i + 1}`}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600 }}>{d.name}</td>
                  <td><span className="badge badge-muted">{d.type}</span></td>
                  <td style={{ color: "var(--success)", fontWeight: 600 }}>
                    ₹{(d.totalDonatedAmount || 0).toLocaleString()}
                  </td>
                </tr>
              ))}
              {!donors.length && (
                <tr>
                  <td colSpan="4" className="muted" style={{ textAlign: "center", padding: 24 }}>
                    No donors yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDonations;
