import { useState, useEffect, useCallback } from "react";
import PublicLayout from "../../modules/public/PublicLayout.jsx";
import LeafletMap from "../../components/LeafletMap.jsx";
import api from "../../api/axios.js";
import { extractLatLng } from "../../utils/location.js";

const DisasterMap = () => {
    const [mapData, setMapData] = useState({ alerts: [], camps: [], reports: [], zones: [] });
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("all");
    const [selected, setSelected] = useState(null);
    const [userLoc, setUserLoc] = useState(null);

    const load = useCallback(async () => {
        try {
            const [alerts, camps, reports, zones] = await Promise.all([
                api.get("/alerts").catch(() => ({ data: [] })),
                api.get("/relief-camps").catch(() => ({ data: [] })),
                api.get("/reports/verified").catch(() => ({ data: [] })),
                api.get("/zones").catch(() => ({ data: [] })),
            ]);
            setMapData({
                alerts: alerts.data?.alerts || alerts.data || [],
                camps: camps.data || [],
                reports: reports.data || [],
                zones: zones.data || [],
            });
        } catch (err) {
            console.error("Map load error:", err);
        }
        setLoading(false);
    }, []);

    useEffect(() => { load(); }, [load]);

    // Auto-detect user location
    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                pos => setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
                () => {}
            );
        }
    }, []);

    // Build markers array with lat/lng from various structures
    const getLatLng = (item, type) => {
        const extracted = extractLatLng(item.location || item);
        let lat = extracted.lat || item.location?.lat || item.latitude || item.lat;
        let lng = extracted.lng || item.location?.lng || item.longitude || item.lng;

        // GeoJSON [lng, lat] for camps
        if ((type === "camp" || type === "alert") && Array.isArray(item.location?.coordinates)) {
            lng = item.location.coordinates[0];
            lat = item.location.coordinates[1];
        }

        // Risk zones — use center of boundary polygon
        if (type === "zone" && item.boundary?.coordinates?.[0]) {
            const coords = item.boundary.coordinates[0];
            lat = coords.reduce((s, c) => s + c[1], 0) / coords.length;
            lng = coords.reduce((s, c) => s + c[0], 0) / coords.length;
        }

        return { lat: parseFloat(lat), lng: parseFloat(lng) };
    };

    const allMarkers = [
        ...mapData.alerts.map(a => {
            const { lat, lng } = getLatLng(a, "alert");
            return { ...a, lat, lng, type: "alert", title: a.title || a.message || "Alert" };
        }),
        ...mapData.camps.map(c => {
            const { lat, lng } = getLatLng(c, "camp");
            return { ...c, lat, lng, type: "camp", title: c.name || "Relief Camp" };
        }),
        ...mapData.reports.map(r => {
            const { lat, lng } = getLatLng(r, "report");
            return { ...r, lat, lng, type: "report", title: r.title || "User Report" };
        }),
        ...mapData.zones.map(z => {
            const { lat, lng } = getLatLng(z, "zone");
            return { ...z, lat, lng, type: "zone", title: z.name || "Risk Zone", severity: z.riskLevel };
        }),
    ].filter(m => !isNaN(m.lat) && !isNaN(m.lng) && m.lat !== null && m.lng !== null);

    const filtered = filter === "all" ? allMarkers : allMarkers.filter(m => m.type === filter);

    const filterBtns = [
        { key: "all", label: "All Layers", icon: "🌐" },
        { key: "alert", label: "Live Alerts", icon: "🚨" },
        { key: "zone", label: "Risk Zones", icon: "⚠️" },
        { key: "camp", label: "Relief Camps", icon: "🏕" },
        { key: "report", label: "User Reports", icon: "📋" },
    ];

    const severityColor = {
        low: "var(--success)",
        medium: "var(--warning)",
        high: "var(--danger)",
        critical: "var(--danger)",
    };

    return (
        <PublicLayout>
            {/* Header */}
            <div style={{ marginBottom: 20 }}>
                <h1 style={{ fontSize: 28, fontWeight: 800 }}>
                    🗺 Live Disaster Map
                </h1>
                <p style={{ color: "var(--text-2)", marginTop: 6, fontSize: 15 }}>
                    Real-time interactive map showing disaster zones, rescue teams, and relief camps.
                </p>
            </div>

            {/* Filter Buttons */}
            <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
                {filterBtns.map(f => (
                    <button
                        key={f.key}
                        className={`btn ${filter === f.key ? "btn-primary" : ""}`}
                        onClick={() => setFilter(f.key)}
                    >
                        {f.icon} {f.label}
                    </button>
                ))}
                <button className="btn" onClick={load} style={{ marginLeft: "auto" }}>🔄 Refresh</button>
            </div>

            {/* Real Leaflet Map */}
            {loading ? (
                <div className="card" style={{ height: 500, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div className="spinner" />
                </div>
            ) : (
                <LeafletMap
                    height={500}
                    markers={filtered}
                    userLocation={userLoc}
                    onMarkerClick={setSelected}
                    zoom={5}
                />
            )}

            {/* Legend */}
            <div className="card" style={{ marginTop: 16, display: "flex", gap: 20, flexWrap: "wrap", padding: "14px 20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#ef4444" }} />
                    Live Alerts ({mapData.alerts.length})
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#f97316" }} />
                    Risk Zones ({mapData.zones.length})
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#10b981" }} />
                    Relief Camps ({mapData.camps.length})
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#06b6d4" }} />
                    User Reports ({mapData.reports.length})
                </div>
                {userLoc && (
                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, marginLeft: "auto" }}>
                        <div className="pulse-dot" /> Your Location
                    </div>
                )}
            </div>

            {/* Detail Panel */}
            {selected && (
                <div className="card" style={{ marginTop: 16, border: "1px solid var(--border-2)", background: "var(--panel-2)", position: "relative", animation: "fadeInUp 0.3s ease" }}>
                    <button className="btn-icon" onClick={() => setSelected(null)} style={{ position: "absolute", right: 16, top: 16, fontSize: 12 }}>✕</button>
                    <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 6 }}>
                        {selected.type === "alert" ? "🚨 Active Alert" : selected.type === "camp" ? "🏕 Relief Camp" : selected.type === "zone" ? "⚠️ Risk Zone" : "📋 User Report"}
                    </div>
                    <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>{selected.title || selected.name}</h3>
                    {selected.description && <p style={{ color: "var(--text-2)", fontSize: 13, lineHeight: 1.6 }}>{selected.description}</p>}
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
                        {selected.severity && (
                            <span style={{
                                padding: "3px 10px", borderRadius: 999, fontSize: 11, fontWeight: 600,
                                background: `${severityColor[selected.severity]}22`,
                                color: severityColor[selected.severity]
                            }}>{selected.severity.toUpperCase()}</span>
                        )}
                        {selected.disasterType && <span className="badge badge-muted">{selected.disasterType}</span>}
                        {selected.location?.city && <span className="muted">📍 {selected.location.city}, {selected.location.state}</span>}
                    </div>
                </div>
            )}

            {/* Stats Row */}
            <div className="grid grid-4" style={{ marginTop: 20 }}>
                <div className="card" style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 26, fontWeight: 800, color: "var(--danger)" }}>{mapData.alerts.length}</div>
                    <div className="muted">Active Alerts</div>
                </div>
                <div className="card" style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 26, fontWeight: 800, color: "var(--success)" }}>{mapData.camps.length}</div>
                    <div className="muted">Relief Camps</div>
                </div>
                <div className="card" style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 26, fontWeight: 800, color: "var(--warning)" }}>{mapData.zones.length}</div>
                    <div className="muted">Risk Zones</div>
                </div>
                <div className="card" style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 26, fontWeight: 800, color: "var(--cyan)" }}>{mapData.reports.length}</div>
                    <div className="muted">Verified Reports</div>
                </div>
            </div>
        </PublicLayout>
    );
};

export default DisasterMap;
