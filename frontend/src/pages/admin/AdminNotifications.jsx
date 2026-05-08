import { useState, useEffect } from "react";
import AdminLayout from "../../modules/admin/AdminLayout.jsx";
import api from "../../api/axios.js";

const TYPES = ["alert", "broadcast", "warning", "info"];
const SEVERITIES = ["low", "medium", "high", "critical"];

const AdminNotifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({
        title: "",
        message: "",
        type: "info",
        severity: "medium",
        targetAreas: "",
        channels: ["socket"],
    });
    const [sending, setSending] = useState(false);
    const [success, setSuccess] = useState("");

    const load = () => {
        setLoading(true);
        api.get("/notifications")
            .then(r => setNotifications(r.data || []))
            .catch(() => { })
            .finally(() => setLoading(false));
    };

    useEffect(load, []);

    const handleSend = async e => {
        e.preventDefault();
        setSending(true);
        setSuccess("");
        try {
            await api.post("/notifications", {
                ...form,
                targetAreas: form.targetAreas ? form.targetAreas.split(",").map(s => s.trim()) : [],
            });
            setShowForm(false);
            setForm({ title: "", message: "", type: "info", severity: "medium", targetAreas: "", channels: ["socket"] });
            setSuccess("Notification sent successfully!");
            load();
        } catch (e) {
            alert(e?.response?.data?.message || e.message || "Failed to send");
        } finally {
            setSending(false);
        }
    };

    const deleteNotif = async id => {
        if (!confirm("Delete this notification?")) return;
        try {
            await api.delete(`/notifications/${id}`);
            load();
        } catch (e) {
            alert(e?.response?.data?.message || e.message || "Failed to delete");
        }
    };

    const typeIcon = { alert: "🚨", broadcast: "📢", warning: "⚠", info: "ℹ" };
    const typeColor = { alert: "danger", broadcast: "primary", warning: "warning", info: "muted" };

    const handleChannelChange = (channel) => {
        setForm(f => ({
            ...f,
            channels: f.channels.includes(channel) 
                ? f.channels.filter(c => c !== channel) 
                : [...f.channels, channel]
        }));
    };

    return (
        <AdminLayout
            title="Notification Center"
            action={
                <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
                    {showForm ? "Cancel" : "📢 Send Notification"}
                </button>
            }
        >
            {success && <div className="alert alert-success" style={{ marginBottom: 16 }}>{success}</div>}

            {/* Send Form */}
            {showForm && (
                <div className="card" style={{ marginBottom: 20, border: "1px solid var(--primary)" }}>
                    <div className="card-title" style={{ marginBottom: 16 }}>📢 Send Notification</div>
                    <form onSubmit={handleSend}>
                        <div className="grid grid-2">
                            <div className="form-group">
                                <label className="form-label">Type</label>
                                <select className="select" value={form.type}
                                    onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                                    {TYPES.map(t => <option key={t} value={t}>{typeIcon[t]} {t}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Severity</label>
                                <select className="select" value={form.severity}
                                    onChange={e => setForm(f => ({ ...f, severity: e.target.value }))}>
                                    {SEVERITIES.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Title *</label>
                            <input className="input" required value={form.title}
                                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                                placeholder="Notification title" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Message *</label>
                            <textarea className="textarea" required value={form.message}
                                onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                                placeholder="Detailed notification message..." />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Target Areas (comma-separated, or leave empty for all)</label>
                            <input className="input" value={form.targetAreas}
                                onChange={e => setForm(f => ({ ...f, targetAreas: e.target.value }))}
                                placeholder="e.g. Delhi, Mumbai, Chennai" />
                        </div>
                        
                        <div className="form-group">
                            <label className="form-label">Broadcast Channels</label>
                            <div style={{ display: "flex", gap: "15px", flexWrap: "wrap", marginTop: "8px" }}>
                                {["socket", "email", "sms", "push"].map(ch => (
                                    <label key={ch} style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
                                        <input 
                                            type="checkbox" 
                                            checked={form.channels.includes(ch)}
                                            onChange={() => handleChannelChange(ch)}
                                        />
                                        <span style={{ textTransform: "capitalize" }}>
                                            {ch === "socket" ? "In-App Update" : ch}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <button type="submit" className="btn btn-primary" disabled={sending}>
                            {sending ? "Sending..." : "📢 Broadcast Now"}
                        </button>
                    </form>
                </div>
            )}

            {/* Notifications List */}
            <div className="card">
                <div className="card-header" style={{ marginBottom: 12 }}>
                    <span className="card-title">All Notifications ({notifications.length})</span>
                </div>

                {loading ? (
                    <div className="loading-page"><div className="spinner" /></div>
                ) : notifications.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">🔔</div>
                        <p>No notifications sent yet.</p>
                    </div>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {notifications.map(n => (
                            <div key={n._id} style={{
                                padding: "14px 16px",
                                borderRadius: 10,
                                background: "var(--panel-2)",
                                border: "1px solid var(--border)",
                                borderLeft: `4px solid var(--${typeColor[n.type]})`
                            }}>
                                <div className="flex-between">
                                    <div className="flex-center" style={{ gap: 8 }}>
                                        <span style={{ fontSize: 18 }}>{typeIcon[n.type]}</span>
                                        <div>
                                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                <div style={{ fontWeight: 700 }}>{n.title}</div>
                                                {n.isAutoGenerated && (
                                                    <span className="badge badge-primary" style={{ fontSize: 9 }}>Auto-Generated</span>
                                                )}
                                            </div>
                                            <div className="muted">{new Date(n.createdAt).toLocaleString()} · by {n.sentBy?.name || "Admin"}</div>
                                        </div>
                                    </div>
                                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                                        <span className={`badge badge-${n.severity}`}>{n.severity}</span>
                                        <button className="btn-icon btn-sm" onClick={() => deleteNotif(n._id)}>🗑</button>
                                    </div>
                                </div>
                                <p style={{ color: "var(--text-2)", fontSize: 13, marginTop: 8 }}>{n.message}</p>
                                {n.targetAreas?.length > 0 && (
                                    <div className="muted mt-8">
                                        📍 Areas: {n.targetAreas.join(", ")}
                                    </div>
                                )}
                                <div className="muted mt-4">
                                    Read by {n.readBy?.length || 0} users
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </AdminLayout>
    );
};

export default AdminNotifications;
