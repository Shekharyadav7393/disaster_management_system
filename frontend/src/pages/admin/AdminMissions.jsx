import { useState, useEffect } from "react";
import AdminLayout from "../../modules/admin/AdminLayout.jsx";
import api from "../../api/axios.js";

const AdminMissions = () => {
  const [missions, setMissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    title: "", description: "", priority: "MEDIUM", lat: "", lng: "", address: "", assignedTeam: ""
  });
  const [teams, setTeams] = useState([]);

  const loadMissions = async () => {
    try {
      setLoading(true);
      const res = await api.get("/missions");
      setMissions(res.data);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Failed to load missions");
    } finally {
      setLoading(false);
    }
  };

  const loadTeams = async () => {
    try {
      const res = await api.get("/teams");
      setTeams(res.data);
    } catch (err) {
      console.error("Failed to load teams", err);
    }
  };

  useEffect(() => {
    loadMissions();
    loadTeams();
  }, []);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleEdit = (mission) => {
    setEditingId(mission._id);
    setFormData({
      title: mission.title,
      description: mission.description,
      priority: mission.priority,
      lat: mission.location?.lat || "",
      lng: mission.location?.lng || "",
      address: mission.location?.address || "",
      assignedTeam: mission.assignedTeam?._id || "",
    });
    setShowForm(true);
  };

  const handleCreateNew = () => {
    setEditingId(null);
    setFormData({ title: "", description: "", priority: "MEDIUM", lat: "", lng: "", address: "", assignedTeam: "" });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this mission?")) return;
    try {
      await api.delete(`/missions/${id}`);
      loadMissions();
    } catch (err) {
      alert(err.response?.data?.message || err.message || "Failed to delete mission");
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
        location: {
          lat: parseFloat(formData.lat),
          lng: parseFloat(formData.lng),
          address: formData.address,
        },
        assignedTeam: formData.assignedTeam || undefined,
      };

      if (editingId) {
        await api.put(`/missions/${editingId}`, payload);
      } else {
        await api.post("/missions", payload);
      }
      
      setShowForm(false);
      loadMissions();
    } catch (err) {
      alert(err.response?.data?.message || err.message || "Failed to save mission");
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await api.put(`/missions/${id}`, { status });
      loadMissions();
    } catch (err) {
      alert(err.response?.data?.message || err.message || "Failed to update status");
    }
  };

  return (
    <AdminLayout title="Rescue Missions" action={<button className="btn btn-primary" onClick={handleCreateNew}>+ New Mission</button>}>
      {error && <div className="alert alert-error">{error}</div>}

      {showForm && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h3 className="card-title" style={{ marginBottom: 15 }}>{editingId ? "✏️ Edit Mission" : "🆕 Create New Mission"}</h3>
          <form className="form" onSubmit={handleCreate}>
            <div className="grid grid-2">
              <div className="form-group">
                <label className="form-label">Title</label>
                <input type="text" name="title" className="input" value={formData.title} onChange={handleInputChange} required />
              </div>
              <div className="form-group">
                <label className="form-label">Priority</label>
                <select name="priority" className="select" value={formData.priority} onChange={handleInputChange} required>
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea name="description" className="textarea" rows="2" value={formData.description} onChange={handleInputChange} required></textarea>
            </div>
            
            <div className="grid grid-3">
              <div className="form-group">
                <label className="form-label">Latitude</label>
                <input type="number" step="any" name="lat" className="input" value={formData.lat} onChange={handleInputChange} required />
              </div>
              <div className="form-group">
                <label className="form-label">Longitude</label>
                <input type="number" step="any" name="lng" className="input" value={formData.lng} onChange={handleInputChange} required />
              </div>
              <div className="form-group">
                <label className="form-label">Address</label>
                <input type="text" name="address" className="input" value={formData.address} onChange={handleInputChange} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Assign Team (Optional)</label>
              <select name="assignedTeam" className="select" value={formData.assignedTeam} onChange={handleInputChange}>
                <option value="">-- None --</option>
                {teams.filter(t => t.status === "AVAILABLE" || t._id === formData.assignedTeam).map(t => (
                  <option key={t._id} value={t._id}>{t.name} ({t.status})</option>
                ))}
              </select>
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 15 }}>
              <button type="submit" className="btn btn-primary">{editingId ? "💾 Save Changes" : "Create Mission"}</button>
              <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <p>Loading...</p>
      ) : missions.length === 0 ? (
        <p className="muted">No missions found.</p>
      ) : (
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Assigned Team</th>
                <th>Location</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {missions.map(m => (
                <tr key={m._id}>
                  <td><strong>{m.title}</strong><br/><small className="muted">{m.description}</small></td>
                  <td>
                    <span className={`badge ${
                      m.priority === 'CRITICAL' ? 'badge-danger' : 
                      m.priority === 'HIGH' ? 'badge-warning' : 'badge-primary'
                    }`}>{m.priority}</span>
                  </td>
                  <td>
                    <select 
                      className="form-input" 
                      style={{ padding: '4px 8px', width: 'auto' }}
                      value={m.status} 
                      onChange={(e) => handleUpdateStatus(m._id, e.target.value)}
                    >
                      <option value="PENDING">Pending</option>
                      <option value="ACTIVE">Active</option>
                      <option value="COMPLETED">Completed</option>
                      <option value="CANCELLED">Cancelled</option>
                    </select>
                  </td>
                  <td>{m.assignedTeam ? m.assignedTeam.name : <span className="muted">Unassigned</span>}</td>
                  <td>{m.location?.address || `${m.location?.lat}, ${m.location?.lng}`}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn btn-sm btn-outline" onClick={() => handleEdit(m)}>Edit</button>
                      <button className="btn btn-sm btn-danger" onClick={() => handleDelete(m._id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminMissions;
