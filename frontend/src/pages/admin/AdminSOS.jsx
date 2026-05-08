import { useState, useEffect } from "react";
import AdminLayout from "../../modules/admin/AdminLayout.jsx";
import api from "../../api/axios.js";
import { useSocket } from "../../hooks/useSocket.js";

const AdminSOS = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("active");
    const [updating, setUpdating] = useState(null);

    useSocket({
        sos_alert: (newSOS) => {
            setRequests(prev => [newSOS, ...prev]);
        }
    });

    const load = () => {
        setLoading(true);
        const query = filter !== "all" ? `?status=${filter}` : "";
        api.get(`/sos${query}`)
            .then(r => setRequests(r.data || []))
            .catch(() => { })
            .finally(() => setLoading(false));
    };

    useEffect(load, [filter]);

    const updateStatus = async (id, status) => {
        setUpdating(id);
        try {
            await api.patch(`/sos/${id}/status`, { status });
            load();
        } catch (err) {
            alert(err?.response?.data?.message || err.message || "Failed to update SOS");
        } finally {
            setUpdating(null);
        }
    };

    const deleteMedia = async (id) => {
        if (!window.confirm("Are you sure you want to delete the media from this SOS request? This cannot be undone.")) return;
        setUpdating(id);
        try {
            await api.delete(`/sos/${id}/media`);
            setRequests(requests.map(r => r._id === id ? { ...r, imageUrl: null, videoUrl: null } : r));
        } catch (err) {
            alert(err?.response?.data?.message || err.message || "Failed to delete media");
        } finally {
            setUpdating(null);
        }
    };

    const statusColor = {
        active: "var(--danger)",
        acknowledged: "var(--warning)",
        dispatched: "var(--primary)",
        resolved: "var(--success)",
    };

    const timeSince = date => {
        const secs = Math.floor((new Date() - new Date(date)) / 1000);
        if (secs < 60) return `${secs}s ago`;
        if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
        return `${Math.floor(secs / 3600)}h ago`;
    };

    return (
        <AdminLayout title="SOS Emergency Requests" action={
            <div style={{ display: "flex", gap: 6 }}>
                {["active", "acknowledged", "dispatched", "resolved", "all"].map(s => (
                    <button key={s} className={`btn btn-sm ${filter === s ? "btn-primary" : ""}`} onClick={() => setFilter(s)}>
                        {s === "active" ? "🆘 " : ""}{s}
                    </button>
                ))}
                <button className="btn btn-sm" onClick={load}>🔄</button>
            </div>
        }>
            {/* Stats */}
            <div className="grid grid-4" style={{ gap: 12, marginBottom: 20 }}>
                {[
                    { label: "Active SOS", color: "danger", status: "active" },
                    { label: "Acknowledged", color: "warning", status: "acknowledged" },
                    { label: "Dispatched", color: "primary", status: "dispatched" },
                    { label: "Resolved", color: "success", status: "resolved" },
                ].map(s => (
                    <div key={s.label} className="card" style={{ textAlign: "center", borderTop: `3px solid var(--${s.color})` }}>
                        <div style={{ fontSize: 22, fontWeight: 800, color: `var(--${s.color})` }}>
                            {requests.filter(r => r.status === s.status).length}
                        </div>
                        <div className="muted">{s.label}</div>
                    </div>
                ))}
            </div>

            {/* SOS Cards */}
            {loading ? (
                <div className="loading-page"><div className="spinner" /></div>
            ) : requests.length === 0 ? (
                <div className="card empty-state"><div className="empty-icon">🆘</div><p>No {filter} SOS requests.</p></div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {requests.map(req => (
                        <div key={req._id} className="card" style={{
                            borderLeft: `4px solid ${statusColor[req.status]}`,
                            position: "relative"
                        }}>
                            {req.status === "active" && (
                                <div style={{
                                    position: "absolute",
                                    top: 12,
                                    right: 12,
                                    background: "var(--danger)",
                                    color: "white",
                                    fontSize: 11,
                                    fontWeight: 700,
                                    padding: "3px 8px",
                                    borderRadius: 999,
                                    animation: "sosPulse 1s infinite"
                                }}>
                                    🆘 ACTIVE
                                </div>
                            )}

                            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>
                                        🚨 {req.user?.name || "Unknown User"}
                                    </div>
                                    <div style={{ color: "var(--text-2)", fontSize: 13, marginBottom: 4 }}>
                                        📧 {req.user?.email} · 📱 {req.user?.phone || "N/A"}
                                    </div>
                                    <div style={{ color: "var(--cyan)", fontSize: 13, marginBottom: 4 }}>
                                        📍 Lat: {req.location?.lat?.toFixed(5)}, Lng: {req.location?.lng?.toFixed(5)}
                                    </div>
                                    {req.location?.address && (
                                        <div className="muted">{req.location.address}</div>
                                    )}
                                    {req.message && (
                                        <div style={{ marginTop: 8, padding: "8px 12px", background: "var(--panel-2)", borderRadius: 8, fontSize: 13, color: "var(--text-2)" }}>
                                            "{req.message}"
                                        </div>
                                    )}
                                    <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
                                        {req.imageUrl && (
                                            <a href={req.imageUrl} target="_blank" rel="noreferrer">
                                                <img src={req.imageUrl} alt="SOS Proof" className="img-preview" style={{ maxWidth: 120, height: 80, objectFit: "cover" }} />
                                            </a>
                                        )}
                                        {req.videoUrl && (
                                            <a href={req.videoUrl} target="_blank" rel="noreferrer" style={{ position: "relative", display: "block", width: 120, height: 80, background: "#000", borderRadius: 8, overflow: "hidden" }}>
                                                <video src={req.videoUrl} style={{ width: "100%", height: "100%", objectFit: "cover" }} muted />
                                                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 20 }}>▶</div>
                                            </a>
                                        )}
                                        {(req.imageUrl || req.videoUrl) && (
                                            <div style={{ display: "flex", alignItems: "flex-end", marginLeft: "auto" }}>
                                                <button className="btn btn-sm btn-danger" onClick={() => deleteMedia(req._id)} disabled={updating === req._id}>
                                                    🗑️ Delete Media
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
                                    <span className="muted">{timeSince(req.createdAt)}</span>
                                    <span className="badge" style={{ background: `${statusColor[req.status]}22`, color: statusColor[req.status] }}>
                                        {req.status}
                                    </span>
                                    <div style={{ display: "flex", gap: 6 }}>
                                        {req.status === "active" && (
                                            <button className="btn btn-warning btn-sm"
                                                onClick={() => updateStatus(req._id, "acknowledged")}
                                                disabled={updating === req._id}>
                                                Acknowledge
                                            </button>
                                        )}
                                        {req.status === "acknowledged" && (
                                            <button className="btn btn-primary btn-sm"
                                                onClick={() => updateStatus(req._id, "dispatched")}
                                                disabled={updating === req._id}>
                                                Dispatch Team
                                            </button>
                                        )}
                                        {(req.status === "dispatched" || req.status === "acknowledged") && (
                                            <button className="btn btn-success btn-sm"
                                                onClick={() => updateStatus(req._id, "resolved")}
                                                disabled={updating === req._id}>
                                                Resolved
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </AdminLayout>
    );
};

export default AdminSOS;
