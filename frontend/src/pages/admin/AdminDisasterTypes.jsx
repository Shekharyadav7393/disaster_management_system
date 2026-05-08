import { useState, useEffect, useCallback } from "react";
import AdminLayout from "../../modules/admin/AdminLayout.jsx";
import api from "../../api/axios.js";

const AdminDisasterTypes = () => {
    const [types, setTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        name: "",
        label: "",
        icon: "⚠",
        description: "",
    });

    const loadTypes = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await api.get("/disaster-types");
            setTypes(data || []);
        } catch (err) {
            setError(err?.response?.data?.message || err.message || "Failed to load disaster types.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadTypes();
    }, [loadTypes]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleEdit = (t) => {
        setEditingId(t._id);
        setFormData({
            name: t.name,
            label: t.label,
            icon: t.icon,
            description: t.description || ""
        });
        setShowModal(true);
    };

    const handleCreateNew = () => {
        setEditingId(null);
        setFormData({ name: "", label: "", icon: "⚠", description: "" });
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        try {
            const payload = {
                name: formData.name.toLowerCase().replace(/\s+/g, "_"),
                label: formData.label,
                icon: formData.icon,
                description: formData.description,
            };

            if (editingId) {
                await api.put(`/disaster-types/${editingId}`, payload);
            } else {
                await api.post("/disaster-types", payload);
            }
            
            setShowModal(false);
            setFormData({ name: "", label: "", icon: "⚠", description: "" });
            setEditingId(null);
            loadTypes();
        } catch (err) {
            setError(err?.response?.data?.message || err.message || "Failed to save disaster type.");
        }
    };

    const deleteType = async (id) => {
        if (!window.confirm("Are you sure? This may affect existing reports.")) return;
        try {
            await api.delete(`/disaster-types/${id}`);
            loadTypes();
        } catch (err) {
            alert(err?.response?.data?.message || err.message || "Failed to delete type.");
        }
    };

    return (
        <AdminLayout 
            title="Disaster Type Management"
            action={<button className="btn btn-primary" onClick={handleCreateNew}>+ Add Type</button>}
        >
            <p className="muted mb-16">
                Manage disaster categories that appear in the public reporting form. 
                All changes here reflect instantly on the frontend.
            </p>

            {error && <div className="alert alert-error">{error}</div>}

            <div className="card">
                {loading ? (
                    <div className="spinner" />
                ) : types.length === 0 ? (
                    <p className="muted">No custom disaster types defined.</p>
                ) : (
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Icon</th>
                                <th>Name</th>
                                <th>Label (Frontend)</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {types.map((t) => (
                                <tr key={t._id}>
                                    <td style={{ fontSize: 24 }}>{t.icon}</td>
                                    <td style={{ fontWeight: 600 }}>{t.name}</td>
                                    <td>{t.label}</td>
                                    <td>
                                        <div style={{ display: 'flex', gap: 8 }}>
                                            <button className="btn btn-sm btn-outline" onClick={() => handleEdit(t)}>Edit</button>
                                            <button className="btn btn-sm btn-danger" onClick={() => deleteType(t._id)}>Delete</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: "450px" }}>
                        <h3>{editingId ? "✏️ Edit Disaster Category" : "Add New Disaster Category"}</h3>
                        <form onSubmit={handleSubmit} style={{ marginTop: "16px" }}>
                            <div className="form-group">
                                <label className="form-label">Internal Name (no spaces)</label>
                                <input className="input" name="name" value={formData.name} onChange={handleInputChange} placeholder="e.g. flash_flood" required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Display Label (Frontend)</label>
                                <input className="input" name="label" value={formData.label} onChange={handleInputChange} placeholder="e.g. Flash Flood" required />
                            </div>
                            <div className="grid grid-2">
                                <div className="form-group">
                                    <label className="form-label">Icon/Emoji</label>
                                    <input className="input" name="icon" value={formData.icon} onChange={handleInputChange} placeholder="e.g. 🌊" />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Description</label>
                                <textarea className="textarea" name="description" value={formData.description} onChange={handleInputChange} rows="3" />
                            </div>
                            <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", marginTop: "20px" }}>
                                <button type="button" className="btn" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">{editingId ? "💾 Save Changes" : "Create Category"}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
};

export default AdminDisasterTypes;
