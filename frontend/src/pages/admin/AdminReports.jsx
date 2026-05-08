import { useState, useEffect } from "react";
import AdminLayout from "../../modules/admin/AdminLayout.jsx";
import api from "../../api/axios.js";
import { useSocket } from "../../hooks/useSocket.js";

const AdminReports = () => {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [filter, setFilter] = useState("pending");
    const [selected, setSelected] = useState(null);
    const [note, setNote] = useState("");
    const [updating, setUpdating] = useState(false);

    useSocket({
        new_disaster_report: (newReport) => {
            if (filter === "pending" || filter === "all") {
                setReports(prev => [newReport, ...prev]);
            }
        }
    });

    const load = () => {
        setLoading(true);
        setError("");
        api.get(`/reports?status=${filter}`)
            .then(r => setReports(Array.isArray(r.data) ? r.data : (r.data.reports || [])))
            .catch(err => setError(err?.response?.data?.message || err.message || "Failed to load reports."))
            .finally(() => setLoading(false));
    };

    useEffect(load, [filter]);

    const updateStatus = async (id, status) => {
        setUpdating(true);
        try {
            await api.patch(`/reports/${id}/status`, { status, adminNote: note });
            setSelected(null);
            setNote("");
            load();
        } catch (e) {
            alert(e?.response?.data?.message || e.message || "Failed to update");
        } finally {
            setUpdating(false);
        }
    };

    const deleteMedia = async (id) => {
        if (!window.confirm("Are you sure you want to delete the media from this report? This cannot be undone.")) return;
        setUpdating(true);
        try {
            await api.delete(`/reports/${id}/media`);
            setReports(reports.map(r => r._id === id ? { ...r, imageUrl: null, videoUrl: null } : r));
            if (selected && selected._id === id) {
                setSelected({ ...selected, imageUrl: null, videoUrl: null });
            }
        } catch (e) {
            alert(e?.response?.data?.message || e.message || "Failed to delete media");
        } finally {
            setUpdating(false);
        }
    };

    const severityColor = { low: "success", medium: "warning", high: "danger", critical: "danger" };

    return (
        <AdminLayout title="Disaster Reports" action={
            <div style={{ display: "flex", gap: 8 }}>
                {["pending", "verified", "rejected"].map(s => (
                    <button key={s} className={`btn btn-sm ${filter === s ? "btn-primary" : ""}`} onClick={() => setFilter(s)}>
                        {s}
                    </button>
                ))}
            </div>
        }>
            <div className="grid grid-2" style={{ gap: 12, marginBottom: 20 }}>
                <div className="stat-card" style={{ "--accent-color": "var(--warning)" }}>
                    <div className="stat-icon">⏳</div>
                    <div className="stat-value">{reports.filter(r => r.status === "pending").length}</div>
                    <div className="stat-label">Pending Review</div>
                </div>
                <div className="stat-card" style={{ "--accent-color": "var(--success)" }}>
                    <div className="stat-icon">✅</div>
                    <div className="stat-value">{reports.filter(r => r.status === "verified").length}</div>
                    <div className="stat-label">Verified Reports</div>
                </div>
            </div>

            <div className="card">
                {error && <div className="alert alert-error">{error}</div>}
                {loading ? (
                    <div className="loading-page"><div className="spinner" /></div>
                ) : reports.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">📋</div>
                        <p>No {filter} reports.</p>
                    </div>
                ) : (
                    <div className="table-wrapper">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Title</th>
                                    <th>Type</th>
                                    <th>Severity</th>
                                    <th>Reporter</th>
                                    <th>Evidence</th>
                                    <th>Location</th>
                                    <th>Date</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reports.map(r => (
                                    <tr key={r._id} style={{ borderLeft: (r.imageUrl || r.videoUrl) ? "4px solid var(--primary)" : "none" }}>
                                        <td>
                                            <div style={{ fontWeight: 600 }}>{r.title}</div>
                                            <div className="muted">{r.description?.slice(0, 50)}...</div>
                                        </td>
                                        <td><span className="badge badge-muted">{r.disasterType}</span></td>
                                        <td><span className={`badge badge-${severityColor[r.severity]}`}>{r.severity}</span></td>
                                        <td>
                                            <div>{r.reportedBy?.name}</div>
                                            <div className="muted">{r.reportedBy?.phone}</div>
                                        </td>
                                        <td>
                                            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                                                {r.imageUrl && (
                                                    <div className="media-preview-mini" onClick={() => setSelected(r)} style={{ cursor: "pointer", width: 44, height: 44, borderRadius: 6, overflow: "hidden", border: "1px solid var(--border)" }}>
                                                        <img src={r.imageUrl} alt="img" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                                    </div>
                                                )}
                                                {r.videoUrl && (
                                                    <div className="media-preview-mini" onClick={() => setSelected(r)} style={{ cursor: "pointer", width: 44, height: 44, borderRadius: 6, overflow: "hidden", border: "1px solid var(--border)", background: "#000", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                                                        <video src={r.videoUrl} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                                        <span style={{ position: "absolute", color: "#fff", fontSize: 12 }}>▶</span>
                                                    </div>
                                                )}
                                                {!r.imageUrl && !r.videoUrl && <span className="muted" style={{ fontSize: 11 }}>—</span>}
                                            </div>
                                        </td>
                                        <td className="muted">{r.location?.city}, {r.location?.state}</td>
                                        <td className="muted">{new Date(r.createdAt).toLocaleDateString()}</td>
                                        <td>
                                            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                                                {r.status === "pending" ? (
                                                    <button className="btn btn-success btn-sm" onClick={() => { setSelected(r); }}>
                                                        Review
                                                    </button>
                                                ) : (
                                                    <>
                                                        <span className={`badge status-${r.status}`}>{r.status}</span>
                                                        <button className="btn btn-sm" onClick={() => setSelected(r)}>View</button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Review Modal */}
            {selected && (
                <div style={{
                    position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 200,
                    display: "flex", alignItems: "center", justifyContent: "center", padding: 16
                }}>
                    <div className="card" style={{ width: "100%", maxWidth: 560, maxHeight: "90vh", overflowY: "auto" }}>
                        <div className="card-header" style={{ marginBottom: 16 }}>
                            <h3 style={{ fontSize: 16, fontWeight: 700 }}>Review Report</h3>
                            <button className="btn-icon" onClick={() => setSelected(null)}>✕</button>
                        </div>
                        <p style={{ fontWeight: 700, marginBottom: 8 }}>{selected.title}</p>
                        <p style={{ color: "var(--text-2)", fontSize: 13, marginBottom: 12 }}>{selected.description}</p>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
                            <span className="badge badge-muted">{selected.disasterType}</span>
                            <span className={`badge badge-${severityColor[selected.severity]}`}>{selected.severity}</span>
                            <span className="muted">📍 {selected.location?.city}, {selected.location?.state}</span>
                        </div>
                        {selected.imageUrl && (
                            <div className="form-group">
                                <label className="form-label">Image Evidence</label>
                                <img
                                    src={selected.imageUrl}
                                    alt="Evidence"
                                    className="img-preview"
                                    style={{ marginBottom: 12, borderRadius: 8 }}
                                />
                            </div>
                        )}
                        {selected.videoUrl && (
                            <div className="form-group">
                                <label className="form-label">Video Evidence</label>
                                <video
                                    src={selected.videoUrl}
                                    controls
                                    className="img-preview"
                                    style={{ marginBottom: 12, borderRadius: 8, width: "100%" }}
                                />
                            </div>
                        )}
                        {(selected.imageUrl || selected.videoUrl) && (
                            <div style={{ marginBottom: 16 }}>
                                <button className="btn btn-sm btn-danger" onClick={() => deleteMedia(selected._id)} disabled={updating}>
                                    🗑️ Delete Media
                                </button>
                            </div>
                        )}
                        <div className="form-group">
                            <label className="form-label">Admin Note (optional)</label>
                            <textarea className="textarea" value={note} onChange={e => setNote(e.target.value)}
                                placeholder="Add a note for verification..." style={{ minHeight: 70 }} />
                        </div>
                        <div style={{ display: "flex", gap: 8 }}>
                            {selected.status === "pending" && (
                                <>
                                    <button className="btn btn-success" onClick={() => updateStatus(selected._id, "verified")} disabled={updating}>
                                        ✅ Verify
                                    </button>
                                    <button className="btn btn-danger" onClick={() => updateStatus(selected._id, "rejected")} disabled={updating}>
                                        ❌ Reject
                                    </button>
                                </>
                            )}
                            <button className="btn" onClick={() => setSelected(null)}>Close</button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
};

export default AdminReports;
