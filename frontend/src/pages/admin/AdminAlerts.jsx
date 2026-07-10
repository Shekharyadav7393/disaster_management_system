import { useCallback, useEffect, useState } from "react";
import AdminLayout from "../../modules/admin/AdminLayout.jsx";
import AlertCard from "../../components/AlertCard.jsx";
import { fetchActiveAlerts } from "../../api/alert.api.js";
import { useSocket } from "../../hooks/useSocket.js";
import LeafletMap from "../../components/LeafletMap.jsx";
import api from "../../api/axios.js";

const AdminAlerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [timelineModal, setTimelineModal] = useState(null);
  const [timelineForm, setTimelineForm] = useState({ title: "", description: "", type: "alert" });
  
  // SOP State
  const [sopModal, setSopModal] = useState(null);
  const [sopContent, setSopContent] = useState("");
  const [generatingSop, setGeneratingSop] = useState(false);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchSearching, setSearchSearching] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "flood",
    severity: "high",
    message: "",
  });
  const [selectedLocation, setSelectedLocation] = useState(null);

  const load = useCallback(async () => {
    setError("");
    try {
      const data = await fetchActiveAlerts();
      // fetchActiveAlerts fetches all active ones, or we can fetch all alerts via GET /alerts
      const res = await api.get("/alerts");
      setAlerts(res.data || []);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Failed to load alerts.");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useSocket({
    new_alert: load,
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleMapClick = ({ lat, lng }) => {
    setSelectedLocation([lat, lng]);
  };

  const handleSearchLocation = async () => {
    if (!searchQuery.trim()) return;
    setSearchSearching(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      if (data && data.length > 0) {
        setSelectedLocation([parseFloat(data[0].lat), parseFloat(data[0].lon)]);
      } else {
        alert("Location not found.");
      }
    } catch(err) {
      alert("Search failed.");
    } finally {
      setSearchSearching(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedLocation) {
      setError("Please select a location on the map.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const payload = {
        ...formData,
        location: {
          coordinates: { lat: selectedLocation[0], lng: selectedLocation[1] },
        },
      };

      await api.post("/alerts", payload);
      setShowModal(false);
      setFormData({ title: "", description: "", message: "", type: "flood", severity: "high" });
      setSelectedLocation(null);
      setSearchQuery("");
      load();
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Failed to create alert.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddTimeline = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/timeline", { ...timelineForm, disasterId: timelineModal._id });
      setTimelineModal(null);
      setTimelineForm({ title: "", description: "", type: "alert" });
      alert("Timeline event added.");
    } catch (err) {
      alert(err?.response?.data?.message || err.message || "Failed to add event.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this alert?")) return;
    try {
      await api.delete(`/alerts/${id}`);
      load();
    } catch (err) {
      alert(err?.response?.data?.message || err.message || "Failed to delete alert.");
    }
  };

  const handleGenerateSOP = async (alertData) => {
    setSopModal(alertData);
    setGeneratingSop(true);
    setSopContent("");
    try {
      const payload = {
        title: alertData.title,
        disasterType: alertData.type,
        severity: alertData.severity,
        location: alertData.location?.address || alertData.location?.coordinates?.lat ? `${alertData.location?.coordinates?.lat}, ${alertData.location?.coordinates?.lng}` : "Unknown",
      };
      const { data } = await api.post("/ai/generate-sop", payload);
      setSopContent(data.sop);
    } catch (err) {
      setSopContent("Error generating SOP: " + (err?.response?.data?.message || err.message));
    } finally {
      setGeneratingSop(false);
    }
  };

  return (
    <AdminLayout
      title="Live Alerts"
      action={<button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Generate Alert</button>}
    >
      {error && !showModal && <div className="alert alert-error">{error}</div>}
      
      {alerts.length === 0 ? (
        <div className="card">No alerts found.</div>
      ) : (
        <div className="grid grid-2">
          {alerts.map((a) => (
            <div key={a._id} style={{ position: "relative", height: "100%", display: "flex", flexDirection: "column" }}>
              <AlertCard 
                alert={a} 
                actions={
                  <div style={{ display: "flex", gap: 6 }}>
                    <button 
                      onClick={() => setTimelineModal(a)}
                      className="btn btn-sm btn-secondary"
                      style={{ fontSize: 10, padding: "4px 8px" }}
                    >
                      + Log Event
                    </button>
                    <button 
                      onClick={() => handleGenerateSOP(a)}
                      className="btn btn-sm"
                      style={{ fontSize: 10, padding: "4px 8px", background: "linear-gradient(45deg, #a855f7, #6366f1)", color: "white", border: "none" }}
                    >
                      ✨ AI SOP
                    </button>
                  </div>
                }
              />
              <button 
                onClick={() => handleDelete(a._id)}
                className="btn-icon"
                style={{ position: "absolute", top: 10, right: 10, background: "rgba(239, 68, 68, 0.1)", color: "#ef4444", width: 24, height: 24, padding: 0 }}
                title="Delete Alert"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="modal-content" style={{ maxWidth: 800 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ fontWeight: 700, fontSize: 18 }}>🚨 Generate Live Alert</h3>
              <button className="btn-icon" onClick={() => setShowModal(false)}>✕</button>
            </div>

            {error && <div className="alert alert-error">{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="grid grid-2" style={{ marginBottom: 12 }}>
                <div className="form-group">
                  <label className="form-label">Title *</label>
                  <input className="input" name="title" value={formData.title} onChange={handleInputChange} placeholder="e.g. Severe Flood Warning" required />
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
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-2" style={{ marginBottom: 12 }}>
                <div className="form-group">
                  <label className="form-label">Severity Level</label>
                  <select className="select" name="severity" value={formData.severity} onChange={handleInputChange}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Public Message (Notification text)</label>
                  <input className="input" name="message" value={formData.message} onChange={handleInputChange} placeholder="Urgent message for users..." required />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 16 }}>
                <label className="form-label">Detailed Description</label>
                <textarea className="textarea" name="description" value={formData.description} onChange={handleInputChange} placeholder="Detailed instructions..." style={{ minHeight: 60 }}></textarea>
              </div>

              {/* Map Selection with Search */}
              <div className="form-group">
                <label className="form-label">Alert Location (Click map to pin) *</label>
                
                <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
                  <input 
                    type="text" 
                    className="input" 
                    placeholder="Search city or area..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleSearchLocation())}
                  />
                  <button type="button" className="btn btn-secondary" onClick={handleSearchLocation} disabled={searchSearching}>
                    {searchSearching ? "..." : "Search"}
                  </button>
                  {selectedLocation && (
                    <button type="button" className="btn" onClick={() => setSelectedLocation(null)}>Clear Pin</button>
                  )}
                </div>

                <LeafletMap
                  height={300}
                  onClick={handleMapClick}
                  selectedPosition={selectedLocation}
                  zoom={5}
                />
              </div>

              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 24 }}>
                <button type="button" className="btn" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={loading || !selectedLocation}>
                  {loading ? "Simulating..." : "🚨 Broadcast Alert"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Timeline Event Modal */}
      {timelineModal && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setTimelineModal(null); }}>
          <div className="modal-content" style={{ maxWidth: 450 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3>Log Timeline Event</h3>
              <button className="btn-icon" onClick={() => setTimelineModal(null)}>✕</button>
            </div>
            <p className="muted" style={{ marginBottom: 15 }}>Adding update for: <strong>{timelineModal.title}</strong></p>
            <form onSubmit={handleAddTimeline}>
              <div className="form-group">
                <label className="form-label">Event Title</label>
                <input className="input" value={timelineForm.title} onChange={e => setTimelineForm({...timelineForm, title: e.target.value})} placeholder="e.g. Rescue Teams Deployed" required />
              </div>
              <div className="form-group">
                <label className="form-label">Type</label>
                <select className="select" value={timelineForm.type} onChange={e => setTimelineForm({...timelineForm, type: e.target.value})}>
                  <option value="alert">Alert/Warning</option>
                  <option value="rescue_deployed">Rescue Deployed</option>
                  <option value="rescue_completed">Rescue Completed</option>
                  <option value="relief_camp_opened">Relief Camp Opened</option>
                  <option value="casualty_update">Casualty Update</option>
                  <option value="other">Other Update</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="textarea" value={timelineForm.description} onChange={e => setTimelineForm({...timelineForm, description: e.target.value})} placeholder="Describe the update..." required style={{ minHeight: 80 }} />
              </div>
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 20 }}>
                <button type="button" className="btn" onClick={() => setTimelineModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>Log Event</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SOP Modal */}
      {sopModal && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setSopModal(null); }}>
          <div className="modal-content" style={{ maxWidth: 700 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ fontWeight: 700 }}>✨ AI Generated SOP</h3>
              <button className="btn-icon" onClick={() => setSopModal(null)}>✕</button>
            </div>
            <p className="muted" style={{ marginBottom: 15 }}>
              Standard Operating Procedure for <strong>{sopModal.title}</strong>
            </p>
            
            <div style={{ background: "var(--panel-2)", padding: 20, borderRadius: 12, minHeight: 200, maxHeight: 400, overflowY: "auto", whiteSpace: "pre-wrap", border: "1px solid var(--border)", lineHeight: 1.6 }}>
              {generatingSop ? (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", flexDirection: "column", gap: 10 }}>
                  <span style={{ fontSize: 24 }}>✨</span>
                  <span>Generating specialized emergency protocols...</span>
                </div>
              ) : (
                sopContent
              )}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
              <button type="button" className="btn btn-primary" onClick={() => {
                if(sopContent && !generatingSop) {
                  navigator.clipboard.writeText(sopContent);
                  alert("SOP copied to clipboard!");
                }
              }}>📋 Copy SOP</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminAlerts;
