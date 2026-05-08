import { useState, useEffect } from "react";
import AdminLayout from "../../modules/admin/AdminLayout.jsx";
import api from "../../api/axios.js";

const AdminVolunteers = () => {
    const [volunteers, setVolunteers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("pending");
    const [selected, setSelected] = useState(null);
    const [assignedZone, setAssignedZone] = useState("");
    const [updating, setUpdating] = useState(false);
    const [activityModal, setActivityModal] = useState(null);
    const [taskModal, setTaskModal] = useState(null);
    const [actForm, setActForm] = useState({ action: "", location: "", hours: "" });
    const [taskForm, setTaskForm] = useState({ title: "", description: "", priority: "medium", deadline: "" });
    const [alerts, setAlerts] = useState([]);
    const [error, setError] = useState("");

    const load = () => {
        setLoading(true);
        api.get(`/volunteers?status=${filter}`)
            .then(r => setVolunteers(r.data || []))
            .catch(err => setError(err?.response?.data?.message || err.message || "Failed to load volunteers."))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        load();
        api.get("/alerts").then(r => setAlerts(r.data?.alerts || r.data || []));
    }, [filter]);

    const updateStatus = async (id, status) => {
        setUpdating(true);
        try {
            await api.patch(`/volunteers/${id}/status`, { status, assignedZone });
            setSelected(null);
            setError("");
            load();
        } catch (e) {
            const msg = e?.response?.data?.message || e.message || "Failed to update status";
            setError(msg);
            alert(msg);
        } finally {
            setUpdating(false);
        }
    };

    const logActivity = async () => {
        setUpdating(true);
        try {
            await api.patch(`/volunteers/${activityModal._id}/activity`, actForm);
            setActivityModal(null);
            setActForm({ action: "", location: "", hours: "" });
            load();
        } catch (e) {
            alert(e?.response?.data?.message || e.message || "Failed to log activity");
        } finally {
            setUpdating(false);
        }
    };

    const assignTask = async () => {
        setUpdating(true);
        try {
            await api.post("/tasks", { ...taskForm, assignedTo: taskModal._id });
            setTaskModal(null);
            setTaskForm({ title: "", description: "", priority: "medium", deadline: "" });
            alert("Task assigned successfully");
        } catch (e) {
            alert(e?.response?.data?.message || e.message || "Failed to assign task");
        } finally {
            setUpdating(false);
        }
    };

    const statusColor = { pending: "warning", approved: "success", active: "primary", rejected: "danger", inactive: "muted" };

    return (
        <AdminLayout title="Volunteer Management" action={
            <div style={{ display: "flex", gap: 6 }}>
                {["pending", "approved", "active", "rejected"].map(s => (
                    <button key={s} className={`btn btn-sm ${filter === s ? "btn-primary" : ""}`} onClick={() => { setFilter(s); setError(""); }}>
                        {s}
                    </button>
                ))}
            </div>
        }>
            {error && (
                <div className="alert alert-error" style={{ marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span>⚠️ {error}</span>
                    <button className="btn-icon" onClick={() => setError("")} style={{ color: "inherit" }}>✕</button>
                </div>
            )}
            <div className="grid grid-4" style={{ gap: 12, marginBottom: 20 }}>
                {[
                    { label: "Pending", val: volunteers.filter(v => v.status === "pending").length, color: "warning" },
                    { label: "Approved", val: volunteers.filter(v => v.status === "approved").length, color: "success" },
                    { label: "Active", val: volunteers.filter(v => v.status === "active").length, color: "primary" },
                    { label: "Total", val: volunteers.length, color: "muted" },
                ].map(s => (
                    <div key={s.label} className="card" style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 22, fontWeight: 800, color: `var(--${s.color})` }}>{s.val}</div>
                        <div className="muted">{s.label}</div>
                    </div>
                ))}
            </div>

            <div className="card">
                {loading ? (
                    <div className="loading-page"><div className="spinner" /></div>
                ) : volunteers.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">🤝</div>
                        <p>No {filter} volunteers.</p>
                    </div>
                ) : (
                    <div className="table-wrapper">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Volunteer</th>
                                    <th>Skills</th>
                                    <th>Availability</th>
                                    <th>Zone</th>
                                    <th>Hours</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {volunteers.map(v => (
                                    <tr key={v._id}>
                                        <td>
                                            <div style={{ fontWeight: 600 }}>{v.user?.name}</div>
                                            <div className="muted">{v.user?.email}</div>
                                        </td>
                                        <td>
                                            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                                                {v.skills?.slice(0, 3).map(s => (
                                                    <span key={s} className="badge badge-muted" style={{ fontSize: 10 }}>{s}</span>
                                                ))}
                                                {v.skills?.length > 3 && <span className="muted">+{v.skills.length - 3}</span>}
                                            </div>
                                        </td>
                                        <td className="muted">{v.availability}</td>
                                        <td className="muted">{v.assignedZone || "—"}</td>
                                        <td>{v.totalHours || 0} hrs</td>
                                        <td>
                                            <span className={`badge badge-${statusColor[v.status]}`}>{v.status}</span>
                                        </td>
                                        <td>
                                            <div style={{ display: "flex", gap: 4 }}>
                                                {v.status === "pending" && (
                                                    <button className="btn btn-success btn-sm" onClick={() => setSelected(v)}>
                                                        Review
                                                    </button>
                                                )}
                                                {(v.status === "approved" || v.status === "active") && (
                                                    <>
                                                        <button className="btn btn-primary btn-sm" onClick={() => setActivityModal(v)}>
                                                            Log Activity
                                                        </button>
                                                        <button className="btn btn-warning btn-sm" onClick={() => setTaskModal(v)}>
                                                            Assign Task
                                                        </button>
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

            {/* Approve Modal */}
            {selected && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
                    <div className="card" style={{ width: "100%", maxWidth: 480 }}>
                        <div className="card-header" style={{ marginBottom: 16 }}>
                            <h3>Review Volunteer</h3>
                            <button className="btn-icon" onClick={() => setSelected(null)}>✕</button>
                        </div>
                        <p style={{ fontWeight: 700 }}>{selected.user?.name}</p>
                        <p className="muted" style={{ marginBottom: 12 }}>{selected.user?.email} · {selected.user?.phone}</p>
                        {selected.bio && <p style={{ fontSize: 13, color: "var(--text-2)", marginBottom: 12 }}>{selected.bio}</p>}
                        {selected.skills?.length > 0 && (
                            <div style={{ marginBottom: 12 }}>
                                <div className="muted" style={{ marginBottom: 6 }}>Skills:</div>
                                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                                    {selected.skills.map(s => <span key={s} className="badge badge-primary">{s}</span>)}
                                </div>
                            </div>
                        )}
                        <div className="form-group">
                            <label className="form-label">Assign Zone (optional)</label>
                            <input className="input" value={assignedZone} onChange={e => setAssignedZone(e.target.value)}
                                placeholder="e.g. North Delhi, Zone A" />
                        </div>
                        <div style={{ display: "flex", gap: 8 }}>
                            <button className="btn btn-success" onClick={() => updateStatus(selected._id, "approved")} disabled={updating}>
                                Approve
                            </button>
                            <button className="btn btn-danger" onClick={() => updateStatus(selected._id, "rejected")} disabled={updating}>
                                Reject
                            </button>
                            <button className="btn" onClick={() => setSelected(null)}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Log Activity Modal */}
            {activityModal && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
                    <div className="card" style={{ width: "100%", maxWidth: 420 }}>
                        <div className="card-header" style={{ marginBottom: 16 }}>
                            <h3>Log Activity for {activityModal.user?.name}</h3>
                            <button className="btn-icon" onClick={() => setActivityModal(null)}>✕</button>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Activity Description</label>
                            <input className="input" value={actForm.action} onChange={e => setActForm(f => ({ ...f, action: e.target.value }))}
                                placeholder="e.g. Assisted in flood evacuation" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Location</label>
                            <input className="input" value={actForm.location} onChange={e => setActForm(f => ({ ...f, location: e.target.value }))}
                                placeholder="e.g. Block A, Sector 5" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Hours</label>
                            <input className="input" type="number" value={actForm.hours} onChange={e => setActForm(f => ({ ...f, hours: e.target.value }))}
                                placeholder="Number of hours" min="0.5" step="0.5" />
                        </div>
                        <div style={{ display: "flex", gap: 8 }}>
                            <button className="btn btn-primary" onClick={logActivity} disabled={updating}>Log Activity</button>
                            <button className="btn" onClick={() => setActivityModal(null)}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Task Assignment Modal */}
            {taskModal && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
                    <div className="card" style={{ width: "100%", maxWidth: 450 }}>
                        <div className="card-header" style={{ marginBottom: 16 }}>
                            <h3>Assign Task to {taskModal.user?.name}</h3>
                            <button className="btn-icon" onClick={() => setTaskModal(null)}>✕</button>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Task Title</label>
                            <input className="input" value={taskForm.title} onChange={e => setTaskForm(f => ({ ...f, title: e.target.value }))}
                                placeholder="e.g. Food Distribution at Ground Zero" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Description</label>
                            <textarea className="input" value={taskForm.description} onChange={e => setTaskForm(f => ({ ...f, description: e.target.value }))}
                                placeholder="Describe the task in detail..." style={{ minHeight: 80 }} />
                        </div>
                        <div className="grid grid-2" style={{ gap: 10 }}>
                            <div className="form-group">
                                <label className="form-label">Priority</label>
                                <select className="input" value={taskForm.priority} onChange={e => setTaskForm(f => ({ ...f, priority: e.target.value }))}>
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                    <option value="critical">Critical</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Deadline</label>
                                <input className="input" type="date" value={taskForm.deadline} onChange={e => setTaskForm(f => ({ ...f, deadline: e.target.value }))} />
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Link to Disaster (Optional)</label>
                            <select className="input" value={taskForm.disasterId} onChange={e => setTaskForm(f => ({ ...f, disasterId: e.target.value }))}>
                                <option value="">None</option>
                                {alerts.map(a => <option key={a._id} value={a._id}>{a.title}</option>)}
                            </select>
                        </div>
                        <div style={{ display: "flex", gap: 8 }}>
                            <button className="btn btn-warning" onClick={assignTask} disabled={updating}>Assign Task</button>
                            <button className="btn" onClick={() => setTaskModal(null)}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
};

export default AdminVolunteers;
