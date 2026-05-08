import { useCallback, useEffect, useState } from "react";
import AdminLayout from "../../modules/admin/AdminLayout.jsx";
import api from "../../api/axios.js";

const AdminReliefCamps = () => {
  const [camps, setCamps] = useState([]);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    name: "",
    lat: "",
    lng: "",
    capacity: "",
    currentOccupancy: "",
    bedsAvailable: "",
    foodSupply: "ADEQUATE",
    medicalSupport: false,
    status: "ACTIVE",
  });
  const [resourceModal, setResourceModal] = useState(null);
  const [resources, setResources] = useState([]);
  const [resForm, setResForm] = useState({ name: "", category: "food", quantity: "", unit: "kg" });
  const [loadingRes, setLoadingRes] = useState(false);

  const load = useCallback(async () => {
    setError("");
    try {
      const { data } = await api.get("/relief-camps");
      setCamps(data || []);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Failed to load relief camps.");
    } finally { }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  };

  const handleEdit = (camp) => {
    setEditingId(camp._id);
    setForm({
      name: camp.name,
      lat: camp.location?.coordinates?.[1] || "",
      lng: camp.location?.coordinates?.[0] || "",
      capacity: camp.capacity || "",
      currentOccupancy: camp.currentOccupancy || "",
      bedsAvailable: camp.bedsAvailable || "",
      foodSupply: camp.foodSupply || "ADEQUATE",
      medicalSupport: camp.medicalSupport || false,
      status: camp.status || "ACTIVE",
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setForm({ name: "", lat: "", lng: "", capacity: "", currentOccupancy: "", bedsAvailable: "", foodSupply: "ADEQUATE", medicalSupport: false, status: "ACTIVE" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const payload = {
        name: form.name.trim(),
        location: {
          type: "Point",
          coordinates: [Number(form.lng), Number(form.lat)],
        },
        capacity: Number(form.capacity || 0),
        currentOccupancy: Number(form.currentOccupancy || 0),
        bedsAvailable: Number(form.bedsAvailable || 0),
        foodSupply: form.foodSupply,
        medicalSupport: form.medicalSupport,
        status: form.status,
      };

      if (editingId) {
        await api.put(`/relief-camps/${editingId}`, payload);
      } else {
        await api.post("/relief-camps", payload);
      }
      
      handleCancelEdit();
      load();
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Failed to save camp.");
    } finally {
      // setLoading(false);
    }
  };

  const loadResources = async (campId) => {
    setLoadingRes(true);
    try {
      const { data } = await api.get(`/resources/${campId}`);
      setResources(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingRes(false);
    }
  };

  const handleResourceSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post("/resources", { ...resForm, reliefCampId: resourceModal._id });
      setResForm({ name: "", category: "food", quantity: "", unit: "kg" });
      loadResources(resourceModal._id);
    } catch (err) {
      alert(err?.response?.data?.message || err.message);
    }
  };

  const handleResourceDelete = async (id) => {
    try {
      await api.delete(`/resources/${id}`);
      loadResources(resourceModal._id);
    } catch (err) {
      alert(err?.response?.data?.message || err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this relief camp?")) return;
    try {
      await api.delete(`/relief-camps/${id}`);
      load();
    } catch (err) {
      alert(err?.response?.data?.message || err.message || "Failed to delete camp.");
    }
  };

  return (
    <AdminLayout
      title="Relief Camp Management"
      action={<button className="btn" onClick={load}>Refresh</button>}
    >
      {error && <div className="card">{error}</div>}
      <div className="grid grid-2">
        <form className="card" onSubmit={handleSubmit}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h4 style={{ margin: 0 }}>{editingId ? "✏️ Edit Relief Camp" : "🏕️ Create Relief Camp"}</h4>
            {editingId && <button type="button" className="btn-icon" onClick={handleCancelEdit}>✕</button>}
          </div>
          <input className="input" name="name" placeholder="Camp name" value={form.name} onChange={handleChange} required />
          <div className="grid grid-2" style={{ marginTop: "8px" }}>
            <input className="input" name="lat" placeholder="Latitude" value={form.lat} onChange={handleChange} required />
            <input className="input" name="lng" placeholder="Longitude" value={form.lng} onChange={handleChange} required />
          </div>
          <div className="grid grid-3" style={{ marginTop: "8px" }}>
            <input className="input" name="capacity" type="number" placeholder="Total Capacity" value={form.capacity} onChange={handleChange} />
            <input className="input" name="currentOccupancy" type="number" placeholder="Occupancy" value={form.currentOccupancy} onChange={handleChange} />
            <input className="input" name="bedsAvailable" type="number" placeholder="Beds Available" value={form.bedsAvailable} onChange={handleChange} />
          </div>
          <div className="grid grid-3" style={{ marginTop: "8px" }}>
            <select className="select" name="foodSupply" value={form.foodSupply} onChange={handleChange}>
              <option value="ADEQUATE">Food: Adequate</option>
              <option value="LOW">Food: Low</option>
              <option value="CRITICAL">Food: Critical</option>
            </select>
            <select className="select" name="status" value={form.status} onChange={handleChange}>
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
              <option value="FULL">FULL</option>
            </select>
            <label style={{ display: "flex", alignItems: "center", gap: 8, paddingLeft: 8 }}>
              <input type="checkbox" name="medicalSupport" checked={form.medicalSupport} onChange={handleChange} />
              Medical Support
            </label>
          </div>
          <button className="btn btn-primary" type="submit" style={{ marginTop: "15px" }}>
            {editingId ? "💾 Save Changes" : "Create Camp"}
          </button>
        </form>

        <div className="card">
          <h4 style={{ marginTop: 0 }}>Existing Camps</h4>
          <ul className="muted" style={{ listStyle: "none", padding: 0 }}>
            {camps.map((c) => (
              <li key={c._id} style={{ marginBottom: "12px", padding: "10px", border: "1px solid var(--border)", borderRadius: "8px", position: "relative" }}>
                <div style={{ fontWeight: "bold", fontSize: 15 }}>{c.name}</div>
                <div style={{ fontSize: 13, marginTop: 4 }}>
                  Status: <span className={`badge badge-${c.status === "ACTIVE" ? "success" : c.status === "FULL" ? "warning" : "muted"}`}>{c.status}</span>
                  <span style={{ marginLeft: 10 }}>🛏 Beds: {c.bedsAvailable}/{c.capacity}</span>
                  <span style={{ marginLeft: 10 }}>🍲 Food: {c.foodSupply}</span>
                  <span style={{ marginLeft: 10 }}>⚕️ Medical: {c.medicalSupport ? "Yes" : "No"}</span>
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                  <button 
                    className="btn btn-sm btn-secondary" 
                    onClick={() => { setResourceModal(c); loadResources(c._id); }}
                  >
                    📦 Manage Resources
                  </button>
                  <button className="btn btn-sm btn-outline" onClick={() => handleEdit(c)}>
                    Edit
                  </button>
                </div>
                <button 
                  className="btn-icon btn-sm" 
                  style={{ position: "absolute", top: "10px", right: "10px", color: "var(--danger)" }} 
                  onClick={() => handleDelete(c._id)}
                  title="Delete Camp"
                >
                  🗑
                </button>
              </li>
            ))}
            {!camps.length && <li>No camps available.</li>}
          </ul>
        </div>
      </div>

      {resourceModal && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setResourceModal(null); }}>
          <div className="modal-content" style={{ maxWidth: 600 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3>Inventory: {resourceModal.name}</h3>
              <button className="btn-icon" onClick={() => setResourceModal(null)}>✕</button>
            </div>
            
            <form className="grid grid-4" style={{ gap: 8, marginBottom: 20 }} onSubmit={handleResourceSubmit}>
               <input className="input" placeholder="Supply Name" value={resForm.name} onChange={e => setResForm({...resForm, name: e.target.value})} required />
               <select className="select" value={resForm.category} onChange={e => setResForm({...resForm, category: e.target.value})}>
                 {["food", "water", "medical", "clothing", "equipment", "energy", "other"].map(cat => <option key={cat} value={cat}>{cat.toUpperCase()}</option>)}
               </select>
               <input className="input" type="number" placeholder="Qty" value={resForm.quantity} onChange={e => setResForm({...resForm, quantity: e.target.value})} required />
               <button className="btn btn-primary" type="submit">Add</button>
            </form>

            <div className="table-wrapper" style={{ maxHeight: 300, overflowY: "auto" }}>
              {loadingRes ? <div className="spinner" /> : (
                <table className="table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Category</th>
                      <th>Quantity</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resources.map(r => (
                      <tr key={r._id}>
                        <td>{r.name}</td>
                        <td><span className="badge badge-muted">{r.category}</span></td>
                        <td>{r.quantity} {r.unit}</td>
                        <td><span className={`badge badge-${r.status === 'available' ? 'success' : 'danger'}`}>{r.status}</span></td>
                        <td><button className="btn btn-sm btn-danger" onClick={() => handleResourceDelete(r._id)}>🗑</button></td>
                      </tr>
                    ))}
                    {!resources.length && <tr><td colSpan="5" style={{ textAlign: "center" }} className="muted">No resources logged.</td></tr>}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminReliefCamps;
