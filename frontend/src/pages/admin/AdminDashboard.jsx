import { useCallback, useEffect, useMemo, useState } from "react";
import AdminLayout from "../../modules/admin/AdminLayout.jsx";
import LeafletMap from "../../components/LeafletMap.jsx";
import EnvironmentMonitor from "../../components/EnvironmentMonitor.jsx";
import PredictionPanel from "../../components/PredictionPanel.jsx";
import api from "../../api/axios.js";
import { socket } from "../../socket/socket.js";
import { extractLatLng } from "../../utils/location.js";

const RESOURCE_KEYS = ["FOOD", "WATER", "MEDICINE", "CLOTHING", "OTHER"];
const RESOURCE_LABELS = {
  FOOD: "Food packets",
  WATER: "Water bottles",
  MEDICINE: "Medicine kits",
  CLOTHING: "Clothing",
  OTHER: "Other supplies",
};

const asList = (value) =>
  Array.isArray(value) ? value : Array.isArray(value?.alerts) ? value.alerts : [];

const zoneCenter = (zone) => {
  const points = zone?.boundary?.coordinates?.[0];
  if (!Array.isArray(points) || !points.length) return { lat: null, lng: null };
  const total = points.reduce((acc, item) => ({ lat: acc.lat + item[1], lng: acc.lng + item[0] }), {
    lat: 0,
    lng: 0,
  });
  return { lat: total.lat / points.length, lng: total.lng / points.length };
};

const volunteerBuckets = (items = []) =>
  items.reduce(
    (acc, item) => {
      const status = String(item?.status || "").toLowerCase();
      acc.total += 1;
      if (status === "pending") acc.pending += 1;
      else if (["active", "deployed", "on_mission"].includes(status)) acc.deployed += 1;
      else acc.available += 1;
      return acc;
    },
    { total: 0, deployed: 0, available: 0, pending: 0 }
  );

const severityBuckets = (items = []) =>
  items.reduce(
    (acc, item) => {
      const key = String(item?.severity || "medium").toLowerCase();
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    },
    { critical: 0, high: 0, medium: 0, low: 0 }
  );

const AdminDashboard = () => {
  const [overview, setOverview] = useState({});
  const [donationStats, setDonationStats] = useState([]);
  const [rescueStatus, setRescueStatus] = useState({});
  const [resources, setResources] = useState({});
  const [severity, setSeverity] = useState({ critical: 0, high: 0, medium: 0, low: 0 });
  const [volunteers, setVolunteers] = useState({ total: 0, deployed: 0, available: 0, pending: 0 });
  const [missions, setMissions] = useState([]);
  const [recentMedia, setRecentMedia] = useState([]);
  const [externalData, setExternalData] = useState(null);
  const [mapMarkers, setMapMarkers] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [
        overviewRes,
        donationRes,
        rescueRes,
        alertsRes,
        zonesRes,
        reportsRes,
        campsRes,
        analyticsRes,
        externalRes,
        mediaRes,
        missionsRes,
        volunteersRes,
      ] = await Promise.all([
        api.get("/dashboard/overview"),
        api.get("/dashboard/donation-stats"),
        api.get("/dashboard/rescue-status"),
        api.get("/alerts").catch(() => ({ data: [] })),
        api.get("/zones").catch(() => ({ data: [] })),
        api.get("/reports/verified").catch(() => ({ data: [] })),
        api.get("/relief-camps").catch(() => ({ data: [] })),
        api.get("/analytics/summary").catch(() => ({ data: {} })),
        api.get("/external/summary").catch(() => ({ data: null })),
        api.get("/dashboard/recent-media").catch(() => ({ data: [] })),
        api.get("/missions").catch(() => ({ data: [] })),
        api.get("/volunteers").catch(() => ({ data: [] })),
      ]);

      const alerts = asList(alertsRes.data);
      const zones = asList(zonesRes.data);
      const reports = asList(reportsRes.data);
      const camps = asList(campsRes.data);
      const resourceMap = {};

      RESOURCE_KEYS.forEach((key) => {
        const match = (analyticsRes.data?.resourceDistribution || []).find(
          (item) => String(item?._id || "").toUpperCase() === key
        );
        resourceMap[key] = Number(match?.total || 0);
      });

      setOverview(overviewRes.data || {});
      setDonationStats(Array.isArray(donationRes.data) ? donationRes.data : []);
      setRescueStatus(rescueRes.data || {});
      setResources(resourceMap);
      setSeverity(severityBuckets(alerts));
      setVolunteers(volunteerBuckets(asList(volunteersRes.data)));
      setMissions(asList(missionsRes.data).slice(0, 5));
      setRecentMedia(Array.isArray(mediaRes.data) ? mediaRes.data : []);
      setExternalData(externalRes.data || null);
      setMapMarkers(
        [
          ...alerts.map((item) => ({ ...extractLatLng(item.location), type: "alert", title: item.title, severity: item.severity })),
          ...zones.map((item) => ({ ...zoneCenter(item), type: "zone", title: item.name, severity: item.riskLevel })),
          ...reports.map((item) => ({ ...extractLatLng(item.location), type: "report", title: item.title, severity: item.severity })),
          ...camps.map((item) => ({ ...extractLatLng(item.location), type: "camp", title: item.name, severity: item.status === "FULL" ? "high" : "low" })),
        ].filter((item) => Number.isFinite(item.lat) && Number.isFinite(item.lng) && (item.lat || item.lng))
      );
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Failed to load dashboard.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const events = ["sos_alert", "new_alert", "new_disaster_report", "mission_created", "mission_updated", "stats.updated"];
    events.forEach((event) => socket.on(event, load));
    return () => events.forEach((event) => socket.off(event, load));
  }, [load]);

  const maxDonation = useMemo(
    () => Math.max(...donationStats.map((item) => Number(item?.totalAmount || 0)), 1),
    [donationStats]
  );
  const maxResource = useMemo(() => Math.max(...Object.values(resources), 1), [resources]);
  const rescueTotal = useMemo(() => Object.values(rescueStatus).reduce((sum, value) => sum + Number(value || 0), 0), [rescueStatus]);

  const simulate = async () => {
    if (!window.confirm("Trigger a simulated high-risk alert?")) return;
    try {
      await api.post("/sensors/simulate");
      load();
    } catch (err) {
      window.alert(err?.response?.data?.message || "Simulation failed");
    }
  };

  return (
    <AdminLayout
      title="Intelligence Command Center"
      action={
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <span className="badge badge-success">Auto pilot</span>
          <span className="badge badge-danger">{severity.critical} critical</span>
          <span className="badge badge-warning">{severity.high} high</span>
          <button className="btn btn-danger" onClick={simulate}>Test detection</button>
          <button className="btn" onClick={load}>Sync</button>
        </div>
      }
    >
      {error && <div className="alert alert-error">{error}</div>}

      <div className="stats-grid" style={{ marginBottom: 24 }}>
        {[
          ["Active alerts", overview.activeAlerts || 0],
          ["Active SOS", overview.activeSOS || 0],
          ["Rescue teams", overview.activeRescueTeams || 0],
          ["Volunteers", overview.totalVolunteers || 0],
          ["Camp capacity", `${overview.totalReliefCamps || 0} / ${overview.totalCampCapacity || 0} beds`],
          ["Verified donations", `INR ${(overview.totalDonationsAmount || 0).toLocaleString()}`],
        ].map(([label, value]) => (
          <div key={label} className="stat-card">
            <div className="stat-value">{loading ? "--" : value}</div>
            <div className="stat-label">{label}</div>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginBottom: 24, padding: 0, overflow: "hidden" }}>
        <div className="card-header" style={{ padding: "14px 20px" }}>
          <span className="card-title">Regional live overview</span>
        </div>
        <LeafletMap height={360} markers={mapMarkers} zoom={5} />
      </div>

      <div className="grid grid-2" style={{ marginBottom: 24, gap: 16 }}>
        <div className="card">
          <div className="card-title" style={{ marginBottom: 12 }}>Resource inventory</div>
          <div style={{ display: "grid", gap: 12 }}>
            {RESOURCE_KEYS.map((key) => (
              <div key={key}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span>{RESOURCE_LABELS[key]}</span>
                  <span className="muted">{(resources[key] || 0).toLocaleString()}</span>
                </div>
                <div style={{ height: 8, borderRadius: 999, background: "var(--panel-3)" }}>
                  <div style={{ height: "100%", width: `${Math.round(((resources[key] || 0) / maxResource) * 100)}%`, borderRadius: 999, background: "var(--primary)" }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-title" style={{ marginBottom: 12 }}>Volunteer deployment</div>
          <div className="grid grid-4" style={{ gap: 12 }}>
            {[
              ["Total", volunteers.total],
              ["Deployed", volunteers.deployed],
              ["Available", volunteers.available],
              ["Pending", volunteers.pending],
            ].map(([label, value]) => (
              <div key={label} className="card" style={{ background: "var(--panel-2)", textAlign: "center" }}>
                <div style={{ fontSize: 22, fontWeight: 800 }}>{value}</div>
                <div className="muted">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <span className="card-title">Active missions</span>
          <a href="/admin/missions" className="btn btn-sm">View all</a>
        </div>
        {missions.length ? (
          <div className="table-wrapper">
            <table className="table">
              <thead><tr><th>Mission</th><th>Status</th><th>Team</th><th>Created</th></tr></thead>
              <tbody>
                {missions.map((item) => (
                  <tr key={item._id}>
                    <td>{item.title || item.name || "Untitled mission"}</td>
                    <td>{item.status || "--"}</td>
                    <td>{item.assignedTeam?.name || "--"}</td>
                    <td>{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "--"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p className="muted">No active missions yet.</p>}
      </div>

      <div className="grid grid-2" style={{ marginBottom: 24, gap: 16 }}>
        <EnvironmentMonitor />
        <PredictionPanel />
      </div>

      <div className="grid grid-2" style={{ marginBottom: 24, gap: 16 }}>
        <div className="card">
          <div className="card-title" style={{ marginBottom: 12 }}>Donation trend</div>
          {donationStats.length ? (
            <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 110 }}>
              {donationStats.map((item) => (
                <div key={item.date} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", height: "100%" }}>
                  <div style={{ width: "100%", height: `${Math.max(((item.totalAmount || 0) / maxDonation) * 100, 2)}%`, background: "linear-gradient(180deg, var(--success), var(--primary))", borderRadius: "4px 4px 0 0" }} />
                  <div style={{ fontSize: 9, color: "var(--muted)", marginTop: 4 }}>{item.date?.slice(-5)}</div>
                </div>
              ))}
            </div>
          ) : <p className="muted">No donation data available.</p>}
        </div>

        <div className="card">
          <div className="card-title" style={{ marginBottom: 12 }}>Rescue team status</div>
          {Object.keys(rescueStatus).length ? Object.entries(rescueStatus).map(([label, value]) => (
            <div key={label} style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span>{label}</span>
                <span>{value}</span>
              </div>
              <div style={{ height: 8, background: "var(--panel-3)", borderRadius: 999 }}>
                <div style={{ height: "100%", width: `${rescueTotal ? (value / rescueTotal) * 100 : 0}%`, background: "var(--warning)", borderRadius: 999 }} />
              </div>
            </div>
          )) : <p className="muted">No rescue status data available.</p>}
        </div>
      </div>

      {externalData?.threats?.length ? (
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-title" style={{ marginBottom: 12 }}>Auto-detected threats</div>
          <div style={{ display: "grid", gap: 8 }}>
            {externalData.threats.slice(0, 4).map((item, index) => (
              <div key={`${item.type}-${index}`} style={{ padding: 12, background: "var(--panel-2)", borderRadius: 10 }}>
                <strong>{item.type}</strong>
                <div className="muted" style={{ marginTop: 4 }}>{item.detail}</div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <span className="card-title">Ground media feed</span>
          <span className="muted">{recentMedia.length} items</span>
        </div>
        {recentMedia.length ? (
          <div style={{ display: "flex", gap: 12, overflowX: "auto" }}>
            {recentMedia.map((item, index) => (
              <div key={`${item.type}-${index}`} style={{ minWidth: 220, background: "var(--panel-2)", borderRadius: 10, overflow: "hidden" }}>
                <div style={{ height: 120, background: "#111827" }}>
                  {item.imageUrl ? <img src={item.imageUrl} alt={item.title || "media"} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <video src={item.videoUrl} style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                </div>
                <div style={{ padding: 10 }}>
                  <div style={{ fontWeight: 700 }}>{item.title || "Field media"}</div>
                  <div className="muted" style={{ fontSize: 12 }}>{item.user || "Citizen"}</div>
                </div>
              </div>
            ))}
          </div>
        ) : <p className="muted">No media available yet.</p>}
      </div>

      <div className="grid grid-4">
        {[
          ["/admin/reports", "Review reports"],
          ["/admin/volunteers", "Manage volunteers"],
          ["/admin/sos", "SOS requests"],
          ["/admin/settings", "API settings"],
        ].map(([path, label]) => (
          <a key={path} href={path} className="card" style={{ textDecoration: "none", fontWeight: 700 }}>
            {label}
          </a>
        ))}
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
