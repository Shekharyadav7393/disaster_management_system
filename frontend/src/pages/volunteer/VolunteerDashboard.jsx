import { useState, useEffect, useCallback } from "react";
import PublicLayout from "../../modules/public/PublicLayout.jsx";
import api from "../../api/axios.js";

const VolunteerDashboard = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [missions, setMissions] = useState([]);
  const [tasks, setTasks] = useState([]);
  
  // Registration form state
  const [regForm, setRegForm] = useState({
    skills: "",
    availability: "on-call",
    bio: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    emergencyContactRelation: "",
  });

  const loadProfile = useCallback(async () => {
    try {
      const { data } = await api.get("/volunteers/me");
      setProfile(data);
      if (data.status === "approved" || data.status === "active") {
        loadMissions();
        loadTasks();
      }
    } catch (err) {
      if (err.response?.status === 404) {
        setProfile(null); // Needs to register
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMissions = async () => {
    try {
      const { data } = await api.get("/missions");
      setMissions(data || []);
    } catch (err) {
      console.error("Failed to load missions", err);
    }
  };

  const loadTasks = async () => {
    try {
      const { data } = await api.get("/tasks");
      setTasks(data || []);
    } catch (err) {
      console.error("Failed to load tasks", err);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await api.post("/volunteers/register", {
        skills: regForm.skills,
        availability: regForm.availability,
        bio: regForm.bio,
        emergencyContact: {
          name: regForm.emergencyContactName,
          phone: regForm.emergencyContactPhone,
          relation: regForm.emergencyContactRelation,
        }
      });
      alert("Registration submitted successfully! Waiting for admin approval.");
      loadProfile();
    } catch (err) {
      alert(err.response?.data?.message || err.message || "Failed to register");
    }
  };

  const handleAction = async (missionId, status) => {
    if (!window.confirm(`Update mission status to ${status}?`)) return;
    try {
      await api.put(`/missions/${missionId}`, { status });
      loadMissions();
    } catch (err) {
      alert(err.response?.data?.message || err.message || "Failed to update mission status");
    }
  };

  const handleTaskUpdate = async (taskId, status) => {
    try {
      await api.patch(`/tasks/${taskId}`, { status });
      loadTasks();
    } catch (err) {
      alert(err.response?.data?.message || err.message || "Failed to update task status");
    }
  };

  if (loading) return <PublicLayout><div className="loading-page"><div className="spinner"></div></div></PublicLayout>;

  return (
    <PublicLayout>
      <div className="card" style={{ marginBottom: 20 }}>
        <h2 style={{ marginTop: 0 }}>Volunteer Dashboard</h2>
        
        {!profile ? (
          <div>
            <div className="alert alert-info">You are not registered as a volunteer yet. Fill out the form below to apply.</div>
            <form onSubmit={handleRegister} style={{ marginTop: 20 }}>
              <div className="form-group">
                <label className="form-label">Skills (comma separated)</label>
                <input className="input" required value={regForm.skills} onChange={e => setRegForm({...regForm, skills: e.target.value})} placeholder="e.g. First Aid, Driving, Search & Rescue" />
              </div>
              <div className="form-group">
                <label className="form-label">Availability</label>
                <select className="select" value={regForm.availability} onChange={e => setRegForm({...regForm, availability: e.target.value})}>
                  <option value="full-time">Full-Time</option>
                  <option value="part-time">Part-Time</option>
                  <option value="weekends">Weekends</option>
                  <option value="on-call">On-Call</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Bio / Experience</label>
                <textarea className="textarea" value={regForm.bio} onChange={e => setRegForm({...regForm, bio: e.target.value})} placeholder="Tell us about any relevant experience..." />
              </div>
              <h4 style={{ marginBottom: 10 }}>Emergency Contact</h4>
              <div className="grid grid-3">
                <input className="input" required value={regForm.emergencyContactName} onChange={e => setRegForm({...regForm, emergencyContactName: e.target.value})} placeholder="Name" />
                <input className="input" required value={regForm.emergencyContactPhone} onChange={e => setRegForm({...regForm, emergencyContactPhone: e.target.value})} placeholder="Phone" />
                <input className="input" value={regForm.emergencyContactRelation} onChange={e => setRegForm({...regForm, emergencyContactRelation: e.target.value})} placeholder="Relation" />
              </div>
              <button type="submit" className="btn btn-primary" style={{ marginTop: 20 }}>Submit Application</button>
            </form>
          </div>
        ) : (
          <div>
            <div style={{ display: "flex", gap: 20, marginBottom: 20, padding: 15, background: "var(--panel-2)", borderRadius: 8 }}>
              <div><strong>Status:</strong> <span className={`badge badge-${profile.status === "approved" || profile.status === "active" ? "success" : profile.status === "pending" ? "warning" : "muted"}`}>{profile.status.toUpperCase()}</span></div>
              <div><strong>Total Hours:</strong> {profile.totalHours || 0}</div>
              <div><strong>Skills:</strong> {profile.skills?.join(", ") || "None"}</div>
            </div>

            {profile.status === "pending" && (
              <div className="alert alert-warning">Your application is currently pending admin approval. You will receive tasks once approved.</div>
            )}

            {(profile.status === "approved" || profile.status === "active") && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 15 }}>
                  <h3 style={{ margin: 0 }}>Assigned Tasks</h3>
                  <span className="badge badge-primary">{tasks.filter(t => t.status !== "completed").length} Active</span>
                </div>
                {tasks.length === 0 ? (
                  <p className="muted">You have no assigned tasks currently. Use this dashboard to track your rescue support, food distribution, or medical assistance tasks.</p>
                ) : (
                  <div className="grid grid-2" style={{ marginBottom: 30 }}>
                    {tasks.map(t => (
                      <div key={t._id} className="card" style={{ borderLeft: `4px solid ${t.status === 'completed' ? '#10b981' : t.priority === 'critical' ? '#ef4444' : '#f59e0b'}`}}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                          <h4>{t.title}</h4>
                          <span className={`badge badge-${t.priority === 'critical' || t.priority === 'high' ? 'danger' : 'warning'}`}>{t.priority.toUpperCase()}</span>
                        </div>
                        <p className="muted" style={{ fontSize: 13, minHeight: 40 }}>{t.description}</p>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
                           <span className={`badge badge-${t.status === 'completed' ? 'success' : 'warning'}`}>{t.status.toUpperCase()}</span>
                           {t.deadline && <span style={{ fontSize: 11, color: "var(--danger)" }}>📅 Due: {new Date(t.deadline).toLocaleDateString()}</span>}
                        </div>
                        <div style={{ display: "flex", gap: 8, marginTop: 15 }}>
                          {t.status === "pending" && (
                            <button className="btn btn-primary btn-sm" onClick={() => handleTaskUpdate(t._id, "in-progress")}>Start Task</button>
                          )}
                          {t.status === "in-progress" && (
                            <button className="btn btn-success btn-sm" onClick={() => handleTaskUpdate(t._id, "completed")}>Mark Completed</button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <h3>Assigned Missions</h3>
                {missions.length === 0 ? (
                  <p className="muted">You have no assigned missions currently. Stay tuned.</p>
                ) : (
                  <div className="grid grid-2">
                    {missions.map(m => (
                      <div key={m._id} className="card" style={{ borderLeft: `4px solid ${m.status === 'ACTIVE' ? '#10b981' : '#f59e0b'}`}}>
                        <h4>{m.title}</h4>
                        <div style={{ fontSize: 13, marginBottom: 10 }}>
                           <span className={`badge badge-${m.status === 'ACTIVE' ? 'success' : 'warning'}`}>{m.status}</span>
                           <span style={{ marginLeft: 10 }}>📍 {m.location?.coordinates ? `${m.location.coordinates[1].toFixed(4)}, ${m.location.coordinates[0].toFixed(4)}` : "No location"}</span>
                        </div>
                        <p className="muted" style={{ fontSize: 13 }}>{m.description}</p>
                        {m.status === "ACTIVE" && (
                          <button className="btn btn-sm" style={{ marginTop: 10 }} onClick={() => handleAction(m._id, "COMPLETED")}>
                            Mark Completed
                          </button>
                        )}
                        {m.status === "PENDING" && (
                          <button className="btn btn-primary btn-sm" style={{ marginTop: 10 }} onClick={() => handleAction(m._id, "ACTIVE")}>
                            Start Mission
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </PublicLayout>
  );
};

export default VolunteerDashboard;
