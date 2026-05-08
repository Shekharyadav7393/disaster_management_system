import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import PublicLayout from "../../modules/public/PublicLayout.jsx";
import api from "../../api/axios.js";
import ReportIncidentModal from "../../components/modals/ReportIncidentModal.jsx";

const MediaGallery = () => {
    const [media, setMedia] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("all"); // all, image, video
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);

    const fetchMedia = async () => {
        try {
            const res = await api.get("/reports/verified");
            const items = res.data.filter(r => r.imageUrl || r.videoUrl);
            setMedia(items || []);
        } catch (err) {
            console.error(err?.response?.data?.message || err.message || "Failed to fetch media");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMedia();
    }, []);

    const filteredMedia = media.filter(m => {
        if (filter === "all") return true;
        if (filter === "image") return !!m.imageUrl;
        if (filter === "video") return !!m.videoUrl;
        return true;
    });

    return (
        <PublicLayout>
            <div className="page fade-in">
                <div style={{ marginBottom: 32, textAlign: "center" }}>
                    <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 12 }}>🎬 Crisis Media Gallery</h1>
                    <p style={{ color: "var(--text-2)", maxWidth: 600, margin: "0 auto 20px" }}>
                        Real-time visual evidence from disaster zones, verified by emergency authorities.
                    </p>
                    <button onClick={() => setIsReportModalOpen(true)} className="btn btn-primary btn-lg">
                        📢 Report Incident with Media
                    </button>
                </div>

                {loading ? (
                    <div className="loading-page"><div className="spinner" /></div>
                ) : filteredMedia.length > 0 && (
                    <div className="grid grid-3" style={{ gap: 24 }}>
                        {filteredMedia.map(item => (
                            <div key={item._id} className="card card-glass" style={{ padding: 0 }}>
                                <div style={{ position: "relative", height: 220, overflow: "hidden", borderRadius: "var(--radius-lg) var(--radius-lg) 0 0" }}>
                                    {item.imageUrl ? (
                                        <img 
                                            src={item.imageUrl} 
                                            alt={item.title} 
                                            style={{ width: "100%", height: "100%", objectFit: "cover" }} 
                                        />
                                    ) : (
                                        <video 
                                            src={item.videoUrl} 
                                            style={{ width: "100%", height: "100%", objectFit: "cover" }} 
                                            muted
                                            onMouseOver={e => e.target.play()}
                                            onMouseOut={e => e.target.pause()}
                                        />
                                    )}
                                    <div style={{ 
                                        position: "absolute", top: 12, right: 12,
                                        background: "rgba(0,0,0,0.6)", padding: "4px 10px", borderRadius: 20,
                                        fontSize: 10, fontWeight: 700, backdropFilter: "blur(4px)"
                                    }}>
                                        {item.imageUrl ? "📸 PHOTO" : "📹 VIDEO"}
                                    </div>
                                </div>
                                <div style={{ padding: 16 }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 8 }}>
                                        <h3 style={{ fontSize: 15, fontWeight: 700 }}>{item.title}</h3>
                                        <span className={`badge badge-${item.severity === 'critical' ? 'danger' : item.severity}`}>{item.severity}</span>
                                    </div>
                                    <p style={{ fontSize: 12, color: "var(--text-2)", marginBottom: 12 }}>
                                        📍 {item.location?.city || "Remote Location"}
                                    </p>
                                    <div style={{ display: "flex", gap: 8 }}>
                                        <a 
                                            href={item.imageUrl || item.videoUrl} 
                                            target="_blank" 
                                            rel="noreferrer" 
                                            className="btn btn-sm" 
                                            style={{ flex: 1, justifyContent: "center" }}
                                        >
                                            View Full Size
                                        </a>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <ReportIncidentModal 
                isOpen={isReportModalOpen} 
                onClose={() => setIsReportModalOpen(false)} 
                onSuccess={fetchMedia}
            />
        </PublicLayout>
    );
};

export default MediaGallery;
