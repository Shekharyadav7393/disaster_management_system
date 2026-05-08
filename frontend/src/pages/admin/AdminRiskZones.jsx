import { useState, useEffect, useCallback, useRef } from "react";
import AdminLayout from "../../modules/admin/AdminLayout.jsx";
import LeafletMap from "../../components/LeafletMap.jsx";
import api from "../../api/axios.js";
import { useSocket } from "../../hooks/useSocket.js";

const AdminRiskZones = () => {
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [clickedPoints, setClickedPoints] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    type: "flood",
    riskLevel: "low",
  });

  useSocket({
    risk_updated: (data) => {
      if (Array.isArray(data)) {
        setZones(data);
      }
    },
  });

  const loadZones = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/zones");
      setZones(data || []);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Failed to load risk zones.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadZones();
  }, [loadZones]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleMapClick = ({ lat, lng }) => {
    setClickedPoints(prev => [...prev, [lng, lat]]);
  };

  const removeLastPoint = () => {
    setClickedPoints(prev => prev.slice(0, -1));
  };

  const handleEdit = (zone) => {
    setEditingId(zone._id);
    setFormData({
      name: zone.name,
      type: zone.type,
      riskLevel: zone.riskLevel,
    });
    if (zone.boundary?.coordinates?.[0]) {
      const coords = zone.boundary.coordinates[0];
      setClickedPoints(coords.slice(0, -1)); // remove the duplicate closing point
    } else {
      setClickedPoints([]);
    }
    setShowModal(true);
  };

  const handleCreateNew = () => {
    setEditingId(null);
    setFormData({ name: "", type: "flood", riskLevel: "low" });
    setClickedPoints([]);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      if (clickedPoints.length < 3) {
        throw new Error("Please click at least 3 points on the map to define the zone boundary.");
      }

      // Close the polygon by duplicating the first point
      const closedCoords = [...clickedPoints, clickedPoints[0]];

      const payload = {
        name: formData.name,
        type: formData.type,
        riskLevel: formData.riskLevel,
        boundary: {
          type: "Polygon",
          coordinates: [closedCoords],
        },
      };

      if (editingId) {
        await api.put(`/zones/${editingId}`, payload);
      } else {
        await api.post("/zones", payload);
      }
      
      setShowModal(false);
      setFormData({ name: "", type: "flood", riskLevel: "low" });
      setClickedPoints([]);
      setEditingId(null);
      loadZones();
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Failed to save risk zone.");
    }
  };

  const deleteZone = async (id) => {
    if (!window.confirm("Are you sure you want to delete this risk zone?")) return;
    try {
      await api.delete(`/zones/${id}`);
      loadZones();
    } catch (err) {
      alert(err?.response?.data?.message || err.message || "Failed to delete zone.");
    }
  };

  const getRiskBadge = (level) => {
    const colors = {
      low: "var(--success)",
      medium: "var(--warning)",
      high: "var(--danger)",
      critical: "var(--danger)",
    };
    return (
      <span style={{
        padding: "3px 10px",
        borderRadius: "12px",
        fontSize: "11px",
        fontWeight: "bold",
        backgroundColor: colors[level] || "var(--muted)",
        color: "white"
      }}>
        {level.toUpperCase()}
      </span>
    );
  };

  // Build zone markers for the overview map
  const zoneMarkers = zones.map(z => {
    const coords = z.boundary?.coordinates?.[0];
    const lat = coords ? coords.reduce((s, c) => s + c[1], 0) / coords.length : null;
    const lng = coords ? coords.reduce((s, c) => s + c[0], 0) / coords.length : null;
    return { lat, lng, type: "zone", title: z.name, severity: z.riskLevel };
  }).filter(m => m.lat && m.lng);

  // Build boundary preview markers for modal
  const previewMarkers = clickedPoints.map((p, i) => ({
    lat: p[1], lng: p[0], type: "zone", title: `Point ${i + 1}`,
  }));

  return (
    <AdminLayout
      title="Risk Zone Management"
      action={<button className="btn btn-primary" onClick={handleCreateNew}>+ Add Risk Zone</button>}
    >
      {error && <div className="alert alert-error">{error}</div>}

      {/* Map Overview */}
      <div className="card" style={{ marginBottom: 20, padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)" }}>
          <span style={{ fontWeight: 600, fontSize: 14 }}>🗺 All Risk Zones on Map</span>
        </div>
        <LeafletMap
          height={300}
          markers={zoneMarkers}
          zoom={5}
        />
      </div>

      {/* Table */}
      <div className="card">
        {loading ? (
          <div className="spinner" />
        ) : zones.length === 0 ? (
          <p className="muted">No risk zones defined. Add one to monitor areas.</p>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Risk Level</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {zones.map((zone) => (
                  <tr key={zone._id}>
                    <td style={{ fontWeight: 600 }}>{zone.name}</td>
                    <td><span className="badge badge-muted">{zone.type}</span></td>
                    <td>{getRiskBadge(zone.riskLevel)}</td>
                    <td>{zone.status || "active"}</td>
                    <td>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button className="btn btn-sm btn-outline" onClick={() => handleEdit(zone)}>Edit</button>
                        <button className="btn btn-sm btn-danger" onClick={() => deleteZone(zone._id)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Modal with Map */}
      {showModal && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="modal-content" style={{ maxWidth: 700 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ fontWeight: 700, fontSize: 16 }}>{editingId ? "✏️ Edit Risk Zone" : "📍 Create New Risk Zone"}</h3>
              <button className="btn-icon" onClick={() => { setShowModal(false); setClickedPoints([]); }}>✕</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="grid grid-2" style={{ marginBottom: 12 }}>
                <div className="form-group">
                  <label className="form-label">Zone Name *</label>
                  <input 
                    className="input" 
                    name="name" 
                    value={formData.name} 
                    onChange={handleInputChange} 
                    onBlur={async (e) => {
                      const q = e.target.value;
                      if (!q.trim()) return;
                      try {
                        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&polygon_geojson=1&q=${encodeURIComponent(q)}`);
                        const data = await res.json();
                        if (data && data.length > 0) {
                          const result = data[0];
                          if (result.geojson && (result.geojson.type === "Polygon" || result.geojson.type === "MultiPolygon")) {
                            // Extract coordinates from GeoJSON. Polygons are [[lng, lat], ...]
                            let rawCoords = result.geojson.type === "Polygon" 
                              ? result.geojson.coordinates[0] 
                              : result.geojson.coordinates[0][0];
                            
                            // Simplify if too many points (> 20) to avoid lag, just take every Nth point
                            if (rawCoords.length > 20) {
                              const step = Math.ceil(rawCoords.length / 15);
                              rawCoords = rawCoords.filter((_, i) => i % step === 0);
                            }
                            
                            setClickedPoints(rawCoords.map(c => [parseFloat(c[0]), parseFloat(c[1])]));
                          } else {
                            // Fallback to center point if no polygon
                            setClickedPoints(prev => [...prev, [parseFloat(result.lon), parseFloat(result.lat)]]);
                          }
                        }
                      } catch (err) {
                        console.error("Search failed:", err);
                      }
                    }}
                    placeholder="e.g. Mumbai" 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Disaster Type</label>
                  <select className="select" name="type" value={formData.type} onChange={handleInputChange}>
                    <option value="flood">Flood</option>
                    <option value="earthquake">Earthquake</option>
                    <option value="fire">Fire</option>
                    <option value="cyclone">Cyclone</option>
                    <option value="landslide">Landslide</option>
                    <option value="gas">Gas Leak</option>
                    <option value="tsunami">Tsunami</option>
                    <option value="industrial">Industrial</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Risk Level</label>
                <select className="select" name="riskLevel" value={formData.riskLevel} onChange={handleInputChange}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>

              {/* Map for boundary selection */}
              <div className="form-group">
                <label className="form-label">Click on the map to define zone boundary (minimum 3 points)</label>
                
                {/* Search Bar */}
                <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
                  <input 
                    type="text" 
                    className="input" 
                    id="zoneSearchInput"
                    placeholder="Search city or area..." 
                    onKeyDown={async (e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        const q = e.target.value;
                        if (!q.trim()) return;
                        try {
                          const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&polygon_geojson=1&q=${encodeURIComponent(q)}`);
                          const data = await res.json();
                          if (data && data.length > 0) {
                            const result = data[0];
                            if (result.geojson && (result.geojson.type === "Polygon" || result.geojson.type === "MultiPolygon")) {
                              let rawCoords = result.geojson.type === "Polygon" ? result.geojson.coordinates[0] : result.geojson.coordinates[0][0];
                              if (rawCoords.length > 20) {
                                const step = Math.ceil(rawCoords.length / 15);
                                rawCoords = rawCoords.filter((_, i) => i % step === 0);
                              }
                              setClickedPoints(rawCoords.map(c => [parseFloat(c[0]), parseFloat(c[1])]));
                            } else {
                              setClickedPoints(prev => [...prev, [parseFloat(result.lon), parseFloat(result.lat)]]);
                            }
                          } else {
                            alert("Location not found.");
                          }
                        } catch(err) {
                          alert("Search failed.");
                        }
                      }
                    }}
                  />
                  <button type="button" className="btn btn-secondary" onClick={() => {
                    const el = document.getElementById("zoneSearchInput");
                    const e = new KeyboardEvent("keydown", { key: "Enter" });
                    el.dispatchEvent(e);
                  }}>
                    Search
                  </button>
                </div>

                <LeafletMap
                  height={300}
                  onClick={handleMapClick}
                  markers={previewMarkers}
                  zoom={5}
                />
                <div style={{ display: "flex", gap: 8, marginTop: 8, alignItems: "center", flexWrap: "wrap" }}>
                  <span className={`badge ${clickedPoints.length >= 3 ? "badge-success" : "badge-muted"}`} style={{ fontSize: 12 }}>
                    {clickedPoints.length} point{clickedPoints.length !== 1 ? "s" : ""} selected {clickedPoints.length < 3 ? "(Need 3+)" : "(Ready)"}
                  </span>
                  {clickedPoints.length > 0 && (
                    <button type="button" className="btn btn-sm" onClick={removeLastPoint}>
                      ↩ Undo Last Point
                    </button>
                  )}
                  {clickedPoints.length > 0 && (
                    <button type="button" className="btn btn-sm btn-danger" onClick={() => setClickedPoints([])}>
                      Clear All
                    </button>
                  )}
                </div>
              </div>

              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 20 }}>
                <button type="button" className="btn" onClick={() => { setShowModal(false); setClickedPoints([]); }}>Cancel</button>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  disabled={clickedPoints.length < 3}
                  title={clickedPoints.length < 3 ? "Click at least 3 points on the map to define the zone area" : "Save this Risk Zone"}
                  style={{ cursor: clickedPoints.length < 3 ? "not-allowed" : "pointer", opacity: clickedPoints.length < 3 ? 0.6 : 1 }}
                >
                  {editingId ? "💾 Save Changes" : "Create Zone"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminRiskZones;
