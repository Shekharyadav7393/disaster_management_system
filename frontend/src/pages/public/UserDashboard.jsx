import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import PublicLayout from "../../modules/public/PublicLayout.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import api from "../../api/axios.js";
import { socket } from "../../socket/socket.js";
import ReviewForm from "../../components/ReviewForm.jsx";
import { fetchMyNotifications } from "../../api/review.api.js";

const EMERGENCY_CONTACTS = [
  { icon: "🚨", name: "National Emergency", number: "112" },
  { icon: "🚒", name: "Fire Brigade", number: "101" },
  { icon: "🚑", name: "Ambulance", number: "108" },
  { icon: "🏛", name: "NDRF Helpline", number: "011-26107953" },
  { icon: "👮", name: "Police Control", number: "100" },
  { icon: "🌊", name: "Flood Control", number: "1070" },
];

const SAFETY_TIPS = {
  earthquake: ["Drop, Cover, Hold On", "Stay away from windows", "Move to open space after shaking stops"],
  flood: ["Move to higher ground immediately", "Avoid walking in floodwater", "Don't drive through flooded roads"],
  fire: ["Evacuate immediately", "Stay low under smoke", "Call fire brigade (101)"],
  default: ["Keep emergency kit ready", "Know your evacuation route", "Stay informed via alerts"],
};

const UserDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [myReports, setMyReports] = useState([]);
  const [mySOS, setMySOS] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [userNotifications, setUserNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewedSosIds, setReviewedSosIds] = useState(new Set());
  const [activeTab, setActiveTab] = useState("overview");
  const [editMode, setEditMode] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: "", phone: "", location: { city: "", state: "" } });
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState("");
  const [weatherData, setWeatherData] = useState(null);
  const [nearbyCamps, setNearbyCamps] = useState([]);

  useEffect(() => {
    if (!user) { navigate("/login"); return; }

    Promise.all([
      api.get("/users/dashboard"),
      api.get("/reports/mine"),
      api.get("/sos/mine"),
      api.get("/notifications/public?limit=5"),
      api.get("/external/summary").catch(() => ({ data: null })),
      api.get("/relief-camps?limit=4").catch(() => ({ data: [] })),
      fetchMyNotifications(30).catch(() => []),
    ]).then(([dashRes, reportsRes, sosRes, notifRes, weatherRes, campsRes, userNotifs]) => {
      setData(dashRes.data);
      setMyReports(reportsRes.data || []);
      setMySOS(sosRes.data || []);
      setNotifications(notifRes.data || []);
      setUserNotifications(userNotifs || []);
      setWeatherData(weatherRes.data?.weather || null);
      setNearbyCamps(Array.isArray(campsRes.data) ? campsRes.data.slice(0, 4) : []);
      setProfileForm({
        name: dashRes.data.user?.name || "",
        phone: dashRes.data.user?.phone || "",
        location: { city: dashRes.data.user?.location?.city || "", state: dashRes.data.user?.location?.state || "" },
      });
    }).catch(() => {})
      .finally(() => setLoading(false));

    // 🔥 Real-time listeners
    const handleStatsUpdate = () => {
      console.log("Stats update received on dashboard");
      // Refresh relevant stats
      api.get("/users/dashboard").then(res => setData(res.data)).catch(()=>{});
    };

    socket.on("stats.updated", handleStatsUpdate);
    socket.on("new_alert", (alert) => {
      console.log("New alert on dashboard:", alert);
      setNotifications(prev => [alert, ...(prev || [])].slice(0, 5));
      handleStatsUpdate();
    });
    socket.on("sos_dispatched", () => {
      api.get("/sos/mine").then((res) => setMySOS(res.data || [])).catch(() => {});
    });
    socket.on("request_team_assigned", () => {
      api.get("/users/dashboard").then((res) => setData(res.data)).catch(() => {});
    });
    socket.on("request_status_updated", () => {
      api.get("/users/dashboard").then((res) => setData(res.data)).catch(() => {});
    });
    // Real-time user notifications
    socket.on("user_notification", (notif) => {
      setUserNotifications((prev) => [notif, ...prev].slice(0, 30));
    });
    socket.on("sos_status_updated", () => {
      api.get("/sos/mine").then((res) => setMySOS(res.data || [])).catch(() => {});
    });

    return () => {
      socket.off("stats.updated", handleStatsUpdate);
      socket.off("new_alert");
      socket.off("sos_dispatched");
      socket.off("request_team_assigned");
      socket.off("request_status_updated");
      socket.off("user_notification");
      socket.off("sos_status_updated");
    };
  }, [user, navigate]);

  const saveProfile = async () => {
    setSavingProfile(true);
    setProfileMsg("");
    try {
      await api.patch("/users/me", profileForm);
      setProfileMsg("✅ Profile updated!");
      setEditMode(false);
    } catch {
      setProfileMsg("❌ Failed to update profile");
    } finally {
      setSavingProfile(false);
    }
  };

  if (loading) {
    return (
      <PublicLayout>
        <div className="loading-page"><div className="spinner" /></div>
      </PublicLayout>
    );
  }

  const stats = data?.requestStats || {};
  const requests = data?.requests || [];
  const currentUser = data?.user || user;

  const statusColor = {
    pending: "var(--warning)",
    resolved: "var(--success)",
    in_progress: "var(--primary)",
    cancelled: "var(--muted)",
    assigned: "var(--cyan)",
  };

  const notifIcon = { alert: "🚨", broadcast: "📢", warning: "⚠", info: "ℹ", sos: "🆘" };
  const notifColor = { alert: "var(--danger)", broadcast: "var(--primary)", warning: "var(--warning)", info: "var(--muted)", sos: "var(--sos)" };

  // Determine safety tips based on latest alert type
  const latestAlertType = notifications[0]?.type === "alert" ? "earthquake" : "default";
  const tips = SAFETY_TIPS[latestAlertType] || SAFETY_TIPS.default;
  const activeSOS = mySOS.find((item) => ["active", "acknowledged", "dispatched"].includes(item.status));

  // Find resolved SOS with dispatched teams that need review
  const resolvedWithTeam = mySOS.filter(
    (item) => item.status === "resolved" && item.dispatch?.teamId && !reviewedSosIds.has(item._id)
  );

  return (
    <PublicLayout>
      <div>
        {/* Header */}
        <div className="flex-between" style={{ marginBottom: 28 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800 }}>
              👤 Welcome, {currentUser?.name?.split(" ")[0]}!
            </h1>
            <p style={{ color: "var(--text-2)", marginTop: 4 }}>
              {currentUser?.email} · Role: <span style={{ textTransform: "capitalize" }}>{currentUser?.role}</span>
            </p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Link to="/sos" className="btn btn-danger" style={{ animation: "sosPulse 2s infinite" }}>🆘 SOS</Link>
            <button className="btn" onClick={() => { logout(); navigate("/login"); }}>Logout</button>
          </div>
        </div>

        {/* Stats */}
        <div className="stats-grid" style={{ marginBottom: 24 }}>
          <div className="stat-card" style={{ "--accent-color": "var(--primary)" }}>
            <div className="stat-icon">📢</div>
            <div className="stat-value">{stats.total || 0}</div>
            <div className="stat-label">Emergency Requests</div>
          </div>
          <div className="stat-card" style={{ "--accent-color": "var(--warning)" }}>
            <div className="stat-icon">⏳</div>
            <div className="stat-value">{stats.pending || 0}</div>
            <div className="stat-label">Pending Requests</div>
          </div>
          <div className="stat-card" style={{ "--accent-color": "var(--success)" }}>
            <div className="stat-icon">✅</div>
            <div className="stat-value">{stats.resolved || 0}</div>
            <div className="stat-label">Resolved Requests</div>
          </div>
          <div className="stat-card" style={{ "--accent-color": "var(--danger)" }}>
            <div className="stat-icon">📋</div>
            <div className="stat-value">{myReports.length}</div>
            <div className="stat-label">Disaster Reports</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs">
          {[
            { key: "overview", label: "📊 Overview" },
            { key: "requests", label: "📢 My Requests" },
            { key: "reports", label: "📋 My Reports" },
            { key: "notifications", label: "🔔 Notifications" },
            { key: "profile", label: "👤 Profile" },
          ].map((t) => (
            <button
              key={t.key}
              className={`tab ${activeTab === t.key ? "active" : ""}`}
              onClick={() => setActiveTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div>
            {/* Live Situational Alert Panel */}
            <div className="card" style={{
              marginBottom: 24,
              borderLeft: "4px solid var(--danger)",
              background: "linear-gradient(90deg, var(--danger-subtle), var(--panel))"
            }}>
              <div className="flex-between">
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, display: "flex", alignItems: "center", gap: 8 }}>
                    🚨 Live Emergency Status
                    <span className="sos-pulse" style={{ fontSize: 9, padding: "2px 6px", background: "var(--danger)", color: "#fff", borderRadius: 4 }}>LIVE</span>
                  </h3>
                  <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--text-2)" }}>
                    {notifications.length > 0 ? (
                      `Active Alert: ${notifications[0].title}`
                    ) : (
                      "No active regional alerts at this moment. Stay Safe."
                    )}
                  </p>
                </div>
                <Link to="/alerts" className="btn btn-sm">View All Alerts</Link>
              </div>
            </div>

            {activeSOS?.dispatch?.teamName && (
              <div className="card" style={{
                marginBottom: 24,
                borderLeft: "4px solid var(--success)",
                background: "linear-gradient(90deg, rgba(16,185,129,0.08), var(--panel))"
              }}>
                <div className="card-header">
                  <span className="card-title">Active Rescue Coordination</span>
                  <span className="badge badge-success">{activeSOS.status}</span>
                </div>
                <div style={{ display: "grid", gap: 10 }}>
                  <div style={{ fontWeight: 700 }}>{activeSOS.dispatch.teamName}</div>
                  <div className="muted" style={{ fontSize: 13 }}>
                    ETA: {activeSOS.dispatch.eta || "10-15 minutes"} · Distance: {activeSOS.dispatch.distance || "Calculating"}
                  </div>
                  {activeSOS.dispatch.leadPhone && (
                    <a
                      href={`tel:${activeSOS.dispatch.leadPhone.replace(/[^+\d]/g, "")}`}
                      className="btn btn-success btn-sm"
                      style={{ width: "fit-content" }}
                    >
                      Call Team Leader: {activeSOS.dispatch.leadPhone}
                    </a>
                  )}
                  {activeSOS.dispatch.members?.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {activeSOS.dispatch.members.map((member, index) => (
                        <a
                          key={`${member}-${index}`}
                          href={
                            activeSOS.dispatch.memberPhones?.[index]
                              ? `tel:${activeSOS.dispatch.memberPhones[index].replace(/[^+\d]/g, "")}`
                              : undefined
                          }
                          className="badge badge-muted"
                          style={{ textDecoration: "none" }}
                        >
                          {member}
                          {activeSOS.dispatch.memberPhones?.[index]
                            ? ` · ${activeSOS.dispatch.memberPhones[index]}`
                            : ""}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Review Prompt for Resolved Rescues */}
            {resolvedWithTeam.length > 0 && (
              <div className="card" style={{
                marginBottom: 24,
                borderLeft: "4px solid var(--warning)",
                background: "linear-gradient(90deg, rgba(245,158,11,0.06), var(--panel))"
              }}>
                <div className="card-header">
                  <span className="card-title">⭐ Rate Your Rescue Experience</span>
                  <span className="badge badge-warning">{resolvedWithTeam.length} pending</span>
                </div>
                {resolvedWithTeam.slice(0, 1).map((sos) => (
                  <ReviewForm
                    key={sos._id}
                    teamId={sos.dispatch.teamId}
                    teamName={sos.dispatch.teamName}
                    sosId={sos._id}
                    onSubmitted={() => setReviewedSosIds((prev) => new Set([...prev, sos._id]))}
                  />
                ))}
              </div>
            )}

            <div className="grid grid-2">
              <div className="card">
                <div className="card-title" style={{ marginBottom: 16 }}>⚡ Quick Response Actions</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <Link to="/sos" className="btn btn-danger btn-lg" style={{ justifyContent: "center", fontWeight: 700 }}>🆘 Activate SOS (Real-time)</Link>
                  <Link to="/request-help" className="btn btn-lg" style={{ justifyContent: "center" }}>📞 Emergency Help Request</Link>
                  <Link to="/report-disaster" className="btn btn-lg" style={{ justifyContent: "center" }}>📋 Report Field Observation</Link>
                  <Link to="/map" className="btn btn-lg" style={{ justifyContent: "center" }}>🗺 Interactive Live Map</Link>
                </div>
              </div>

              <div className="card">
                <div className="card-title" style={{ marginBottom: 16 }}>🔔 Recent Security Broadcasts</div>
                {notifications.slice(0, 5).map((n) => (
                  <div key={n._id} style={{ padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span>{notifIcon[n.type] || "🔔"}</span>
                      <span style={{ fontWeight: 600, fontSize: 13, color: notifColor[n.type] }}>{n.title}</span>
                    </div>
                    <p style={{ fontSize: 12, color: "var(--text-2)", marginTop: 4 }}>{n.message}</p>
                  </div>
                ))}
                {notifications.length === 0 && <p className="muted">No broadcasts available.</p>}
              </div>
            </div>

            {/* Emergency Contacts */}
            <div className="card" style={{ marginTop: 20 }}>
              <div className="card-title" style={{ marginBottom: 16 }}>📞 Emergency Contacts (India)</div>
              <div className="emergency-contact-grid">
                {EMERGENCY_CONTACTS.map((c) => (
                  <a key={c.number} href={`tel:${c.number}`} className="emergency-contact-btn">
                    <div className="emergency-contact-icon">{c.icon}</div>
                    <div className="emergency-contact-info">
                      <div className="emergency-contact-name">{c.name}</div>
                      <div className="emergency-contact-number">{c.number}</div>
                    </div>
                  </a>
                ))}
              </div>
            </div>

            {/* Weather & Camps Row */}
            <div className="grid grid-2" style={{ marginTop: 20 }}>
              {/* Weather Warning Card */}
              <div className="card" style={{
                background: weatherData?.warning
                  ? "linear-gradient(135deg, #ef4444, #f97316)"
                  : "linear-gradient(135deg, #3b82f6, #60a5fa)",
                color: "#fff", border: "none"
              }}>
                <h4 style={{ margin: 0, color: "rgba(255,255,255,0.9)", fontSize: 14 }}>🌍 Weather Status</h4>
                <div style={{ fontSize: 28, fontWeight: 800, margin: "8px 0" }}>
                  {weatherData?.temp || "—"}°C
                </div>
                <div style={{ fontSize: 12, opacity: 0.9, textTransform: "capitalize" }}>
                  {weatherData?.condition || "Clear"} · 💧 {weatherData?.humidity || 0}%
                </div>
                {weatherData?.warning && (
                  <div style={{
                    marginTop: 8, padding: "6px 10px", background: "rgba(255,255,255,0.2)",
                    borderRadius: 6, fontSize: 12, fontWeight: 600
                  }}>
                    ⚠️ {weatherData.warning}
                  </div>
                )}
              </div>

              {/* Safety Tips Card */}
              <div className="card">
                <h4 style={{ margin: 0, fontSize: 14, marginBottom: 12 }}>🛡 Safety Tips</h4>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {tips.map((tip, i) => (
                    <div key={i} style={{
                      display: "flex", alignItems: "center", gap: 10,
                      padding: "8px 12px", background: "var(--panel-2)", borderRadius: 8, fontSize: 12
                    }}>
                      <span style={{ color: "var(--success)", fontWeight: 700 }}>✓</span>
                      {tip}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Nearby Relief Camps */}
            {nearbyCamps.length > 0 && (
              <div className="card" style={{ marginTop: 20 }}>
                <div className="card-header">
                  <span className="card-title">🏕 Nearby Relief Camps</span>
                  <Link to="/camps" className="btn btn-sm">View All</Link>
                </div>
                <div className="grid grid-2" style={{ gap: 10 }}>
                  {nearbyCamps.map((camp) => (
                    <div key={camp._id} style={{
                      padding: 14, background: "var(--panel-2)", borderRadius: 10,
                      border: "1px solid var(--border)"
                    }}>
                      <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>🏕 {camp.name}</div>
                      <div style={{ fontSize: 11, color: "var(--text-2)" }}>
                        📍 {camp.location?.city || camp.location?.address || "—"}
                      </div>
                      <div style={{ display: "flex", gap: 8, marginTop: 6, fontSize: 11 }}>
                        <span style={{ color: "var(--success)" }}>👥 {camp.currentOccupancy || 0}/{camp.capacity || 0}</span>
                        <span className={`badge badge-${camp.status === "active" ? "success" : "muted"}`}>{camp.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Requests Tab */}
        {activeTab === "requests" && (
          <div className="card">
            <div className="card-header">
              <span className="card-title">My Emergency Requests</span>
              <Link to="/request-help" className="btn btn-primary btn-sm">+ New Request</Link>
            </div>
            {requests.length === 0 ? (
              <div className="empty-state"><div className="empty-icon">📢</div><p>No emergency requests yet.</p></div>
            ) : (
              <div className="table-wrapper">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Description</th>
                      <th>Priority</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests.map((r) => (
                      <tr key={r._id}>
                        <td style={{ maxWidth: 280 }}>{r.description?.slice(0, 80)}</td>
                        <td><span className={`badge badge-${r.priority}`}>{r.priority}</span></td>
                        <td>
                          <div style={{ display: "grid", gap: 6 }}>
                            <span className="badge" style={{ background: `${statusColor[r.status]}22`, color: statusColor[r.status] }}>
                              {r.status}
                            </span>
                            {r.dispatch?.teamName && (
                              <div style={{ fontSize: 11 }}>
                                <strong>{r.dispatch.teamName}</strong>
                                {r.dispatch.leadPhone ? (
                                  <>
                                    {" "}
                                    ·{" "}
                                    <a href={`tel:${r.dispatch.leadPhone.replace(/[^+\d]/g, "")}`} style={{ color: "var(--success)" }}>
                                      {r.dispatch.leadPhone}
                                    </a>
                                  </>
                                ) : null}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="muted">{new Date(r.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Reports Tab */}
        {activeTab === "reports" && (
          <div className="card">
            <div className="card-header">
              <span className="card-title">My Disaster Reports</span>
              <Link to="/report-disaster" className="btn btn-primary btn-sm">+ New Report</Link>
            </div>
            {myReports.length === 0 ? (
              <div className="empty-state"><div className="empty-icon">📋</div><p>No disaster reports submitted.</p></div>
            ) : (
              <div className="table-wrapper">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Type</th>
                      <th>Media</th>
                      <th>Severity</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myReports.map((r) => (
                      <tr key={r._id}>
                        <td style={{ fontWeight: 500 }}>{r.title}</td>
                        <td className="muted">{r.disasterType}</td>
                        <td>
                          <div style={{ display: "flex", gap: 6 }}>
                            {r.imageUrl && (
                              <div style={{ width: 32, height: 32, borderRadius: 4, overflow: "hidden", background: "var(--panel-2)" }}>
                                <img src={r.imageUrl} alt="img" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                              </div>
                            )}
                            {r.videoUrl && (
                              <div style={{ width: 32, height: 32, borderRadius: 4, overflow: "hidden", background: "#000", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                                <video src={r.videoUrl} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                <span style={{ position: "absolute", fontSize: 8 }}>▶</span>
                              </div>
                            )}
                            {!r.imageUrl && !r.videoUrl && <span className="muted">—</span>}
                          </div>
                        </td>
                        <td><span className={`badge badge-${r.severity}`}>{r.severity}</span></td>
                        <td><span className={`badge status-${r.status}`}>{r.status}</span></td>
                        <td className="muted">{new Date(r.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === "notifications" && (
          <div>
            {/* Auto-generated user notifications */}
            {userNotifications.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                  🤖 System Notifications
                  <span className="badge badge-primary" style={{ fontSize: 10 }}>{userNotifications.length}</span>
                </h4>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {userNotifications.map((n) => (
                    <div key={n._id} className="card" style={{
                      borderLeft: `4px solid ${n.isAutoGenerated ? "var(--cyan)" : (notifColor[n.type] || "var(--primary)")}`,
                      padding: "14px 18px"
                    }}>
                      <div className="flex-between">
                        <div className="flex-center" style={{ gap: 8 }}>
                          <span style={{ fontSize: 16 }}>{n.isAutoGenerated ? "🤖" : (notifIcon[n.type] || "🔔")}</span>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: 13 }}>{n.title}</div>
                            <div style={{ fontSize: 11, color: "var(--muted)" }}>
                              {new Date(n.createdAt).toLocaleString()}
                              {n.isAutoGenerated && <span style={{ marginLeft: 6, color: "var(--cyan)" }}>· Auto</span>}
                            </div>
                          </div>
                        </div>
                        <span className={`badge badge-${n.severity || "muted"}`}>{n.severity || "info"}</span>
                      </div>
                      <p style={{ color: "var(--text-2)", fontSize: 12, marginTop: 6 }}>{n.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Broadcast / Public notifications */}
            <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>📢 Public Broadcasts</h4>
            {notifications.length === 0 && userNotifications.length === 0 ? (
              <div className="empty-state card"><div className="empty-icon">🔔</div><p>No notifications.</p></div>
            ) : notifications.length === 0 ? (
              <p className="muted" style={{ fontSize: 13 }}>No public broadcasts at this time.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {notifications.map((n) => (
                  <div key={n._id} className="card" style={{
                    borderLeft: `4px solid ${notifColor[n.type] || "var(--primary)"}`,
                    padding: "16px 20px"
                  }}>
                    <div className="flex-between">
                      <div className="flex-center" style={{ gap: 8 }}>
                        <span style={{ fontSize: 18 }}>{notifIcon[n.type]}</span>
                        <div>
                          <div style={{ fontWeight: 700 }}>{n.title}</div>
                          <div style={{ fontSize: 12, color: "var(--muted)" }}>
                            {new Date(n.createdAt).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <span className={`badge badge-${n.severity}`}>{n.severity}</span>
                    </div>
                    <p style={{ color: "var(--text-2)", fontSize: 13, marginTop: 8 }}>{n.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === "profile" && (
          <div style={{ maxWidth: 500 }}>
            <div className="card">
              <div className="card-header">
                <span className="card-title">My Profile</span>
                <button className="btn btn-sm" onClick={() => setEditMode(!editMode)}>
                  {editMode ? "Cancel" : "✏ Edit"}
                </button>
              </div>

              {profileMsg && (
                <div className={`alert ${profileMsg.startsWith("✅") ? "alert-success" : "alert-error"}`}>
                  {profileMsg}
                </div>
              )}

              {editMode ? (
                <div>
                  <div className="form-group">
                    <label className="form-label">Full Name</label>
                    <input className="input" value={profileForm.name}
                      onChange={(e) => setProfileForm((f) => ({ ...f, name: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone</label>
                    <input className="input" value={profileForm.phone}
                      onChange={(e) => setProfileForm((f) => ({ ...f, phone: e.target.value }))} />
                  </div>
                  <div className="grid grid-2">
                    <div className="form-group">
                      <label className="form-label">City</label>
                      <input className="input" value={profileForm.location?.city || ""}
                        onChange={(e) => setProfileForm((f) => ({ ...f, location: { ...f.location, city: e.target.value } }))} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">State</label>
                      <input className="input" value={profileForm.location?.state || ""}
                        onChange={(e) => setProfileForm((f) => ({ ...f, location: { ...f.location, state: e.target.value } }))} />
                    </div>
                  </div>
                  <button className="btn btn-primary" onClick={saveProfile} disabled={savingProfile}>
                    {savingProfile ? "Saving..." : "Save Profile"}
                  </button>
                </div>
              ) : (
                <div>
                  {[
                    ["Name", currentUser?.name],
                    ["Email", currentUser?.email],
                    ["Phone", currentUser?.phone || "—"],
                    ["Role", currentUser?.role],
                    ["City", currentUser?.location?.city || "—"],
                    ["State", currentUser?.location?.state || "—"],
                  ].map(([label, value]) => (
                    <div key={label} style={{ display: "flex", gap: 12, padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
                      <span style={{ width: 80, color: "var(--muted)", fontSize: 13 }}>{label}</span>
                      <span style={{ fontWeight: 500 }}>{value}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </PublicLayout>
  );
};

export default UserDashboard;
