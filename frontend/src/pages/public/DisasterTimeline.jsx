import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import PublicLayout from "../../modules/public/PublicLayout.jsx";
import api from "../../api/axios.js";

const DisasterTimeline = () => {
    const { id } = useParams();
    const [alert, setAlert] = useState(null);
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            try {
                const [alertRes, timelineRes] = await Promise.all([
                    api.get(`/alerts/${id}`),
                    api.get(`/timeline/${id}`)
                ]);
                setAlert(alertRes.data);
                setEvents(timelineRes.data);
            } catch (err) {
                console.error("Failed to load timeline", err);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [id]);

    if (loading) return <PublicLayout><div className="loading-page"><div className="spinner" /></div></PublicLayout>;
    if (!alert) return <PublicLayout><div className="container"><h3>Alert not found</h3></div></PublicLayout>;

    const getIcon = (type) => {
        switch (type) {
            case "alert": return "🚨";
            case "rescue_deployed": return "🚑";
            case "rescue_completed": return "✅";
            case "relief_camp_opened": return "⛺";
            case "casualty_update": return "📉";
            default: return "ℹ️";
        }
    };

    return (
        <PublicLayout>
            <div className="container" style={{ padding: "40px 20px" }}>
                <Link to="/alerts" className="btn btn-sm" style={{ marginBottom: 20 }}>← Back to Alerts</Link>
                
                <div className="card" style={{ marginBottom: 40, borderLeft: `6px solid var(--${alert.severity === 'critical' ? 'danger' : 'warning'})` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div>
                            <h1 style={{ margin: "0 0 10px 0" }}>{alert.title}</h1>
                            <p className="muted" style={{ fontSize: 16 }}>{alert.description}</p>
                        </div>
                        <span className={`badge badge-${alert.severity === 'critical' || alert.severity === 'high' ? 'danger' : 'warning'}`} style={{ fontSize: 14, padding: "8px 16px" }}>
                            {alert.severity.toUpperCase()}
                        </span>
                    </div>
                    <div style={{ marginTop: 20, display: "flex", gap: 20, fontSize: 14 }} className="muted">
                        <span>📍 {alert.location?.city || "Unknown Location"}</span>
                        <span>📅 Started: {new Date(alert.createdAt).toLocaleString()}</span>
                        <span>⚠️ Type: {alert.type.toUpperCase()}</span>
                    </div>
                </div>

                <div className="timeline-container" style={{ position: "relative", maxWidth: 800, margin: "0 auto" }}>
                    <div style={{ position: "absolute", left: 20, top: 0, bottom: 0, width: 2, background: "var(--border)", zIndex: 0 }} />
                    
                    {events.length === 0 ? (
                        <div style={{ paddingLeft: 60, paddingBottom: 40 }}>
                            <p className="muted">No detailed timeline updates yet. Check back soon for live updates.</p>
                        </div>
                    ) : (
                        events.map((event, index) => (
                            <div key={event._id} className="timeline-item" style={{ position: "relative", paddingLeft: 60, paddingBottom: 40 }}>
                                <div style={{ 
                                    position: "absolute", 
                                    left: 0, 
                                    top: 0, 
                                    width: 42, 
                                    height: 42, 
                                    borderRadius: "50%", 
                                    background: "var(--panel-2)", 
                                    display: "flex", 
                                    alignItems: "center", 
                                    justifyContent: "center",
                                    fontSize: 20,
                                    zIndex: 1,
                                    boxShadow: "0 0 0 4px var(--bg)"
                                }}>
                                    {getIcon(event.type)}
                                </div>
                                <div className="card" style={{ background: index === 0 ? "rgba(59, 130, 246, 0.05)" : "var(--panel)", border: index === 0 ? "1px solid var(--primary)" : "1px solid var(--border)" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                                        <h4 style={{ margin: 0, color: index === 0 ? "var(--primary)" : "inherit" }}>{event.title}</h4>
                                        <span className="muted" style={{ fontSize: 12 }}>{new Date(event.timestamp).toLocaleString()}</span>
                                    </div>
                                    <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6 }}>{event.description}</p>
                                    {event.mediaUrl && (
                                        <img src={event.mediaUrl} alt="Update" style={{ marginTop: 15, borderRadius: 8, maxWidth: "100%", maxHeight: 300, objectFit: "cover" }} />
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </PublicLayout>
    );
};

export default DisasterTimeline;
