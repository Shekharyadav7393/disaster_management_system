import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PublicLayout from "../../modules/public/PublicLayout.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import LeafletMap from "../../components/LeafletMap.jsx";
import api from "../../api/axios.js";

const DISASTER_TYPES = [
    { value: "flood", label: "🌊 Flood" },
    { value: "earthquake", label: "🌍 Earthquake" },
    { value: "fire", label: "🔥 Fire" },
    { value: "cyclone", label: "🌀 Cyclone" },
    { value: "landslide", label: "⛰ Landslide" },
    { value: "gas", label: "☢ Gas Leak" },
    { value: "drought", label: "☀ Drought" },
    { value: "other", label: "⚠ Other" },
];

const SEVERITIES = [
    { value: "low", label: "🟢 Low" },
    { value: "medium", label: "🟡 Medium" },
    { value: "high", label: "🔴 High" },
    { value: "critical", label: "🔴 Critical" },
];

const ReportDisaster = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const fileRef = useRef();
    const videoRef = useRef();

    const [form, setForm] = useState({
        title: "",
        description: "",
        disasterType: "",
        severity: "medium",
        address: "",
        city: "",
        state: "",
        lat: "",
        lng: "",
    });
    const [disasterTypes, setDisasterTypes] = useState([]);
    const [image, setImage] = useState(null);
    const [video, setVideo] = useState(null);
    const [preview, setPreview] = useState(null);
    const [videoPreview, setVideoPreview] = useState(null);
    const [userLoc, setUserLoc] = useState(null);
    const [locating, setLocating] = useState(false);
    const [loading, setLoading] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [understoodWarning, setUnderstoodWarning] = useState(false);

    useEffect(() => {
        const fetchTypes = async () => {
            try {
                const { data } = await api.get("/disaster-types");
                setDisasterTypes(data || []);
            } catch (err) {
                console.error(err?.response?.data?.message || err.message || "Failed to fetch types");
            }
        };
        fetchTypes();
    }, []);

    if (!user) {
        return (
            <PublicLayout>
                <div className="card" style={{ maxWidth: 500, margin: "60px auto", textAlign: "center" }}>
                    <div style={{ fontSize: 48, marginBottom: 16 }}>🔐</div>
                    <h2>Sign In Required</h2>
                    <p className="muted" style={{ margin: "12px 0 20px" }}>
                        You must be logged in to report a disaster.
                    </p>
                    <button className="btn btn-primary" onClick={() => navigate("/login")}>
                        Sign In
                    </button>
                </div>
            </PublicLayout>
        );
    }

    const handleChange = e => {
        const { name, value } = e.target;
        setForm(f => ({ ...f, [name]: value }));
    };

    const handleImage = e => {
        const file = e.target.files[0];
        if (!file) return;
        if (!file.type.startsWith("image/")) {
            setError("Only image files (JPG, PNG, WebP) are allowed.");
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            setError("Image must be less than 5MB.");
            return;
        }
        setImage(file);
        setPreview(URL.createObjectURL(file));
        setError("");
    };

    const handleVideo = e => {
        const file = e.target.files[0];
        if (!file) return;
        if (!file.type.startsWith("video/")) {
            setError("Only video files (MP4, MOV) are allowed.");
            return;
        }
        if (file.size > 50 * 1024 * 1024) {
            setError("Video must be less than 50MB.");
            return;
        }
        setVideo(file);
        setVideoPreview(URL.createObjectURL(file));
        setError("");
    };

    const handleMapClick = ({ lat, lng }) => {
        setForm(f => ({
            ...f,
            lat: lat.toFixed(6),
            lng: lng.toFixed(6),
        }));
    };

    const getLocation = () => {
        setLocating(true);
        navigator.geolocation.getCurrentPosition(
            pos => {
                const lat = pos.coords.latitude;
                const lng = pos.coords.longitude;
                setForm(f => ({
                    ...f,
                    lat: lat.toFixed(6),
                    lng: lng.toFixed(6),
                }));
                setUserLoc({ lat, lng });
                setLocating(false);
            },
            err => {
                setError("Could not get location: " + err.message);
                setLocating(false);
            }
        );
    };

    const handleSubmit = async e => {
        e.preventDefault();
        if (!form.title || !form.description || !form.disasterType) {
            setError("Please fill in all required fields.");
            return;
        }
        setLoading(true);
        setError("");
        try {
            const fd = new FormData();
            Object.entries(form).forEach(([k, v]) => fd.append(k, v));
            if (image) fd.append("image", image);
            if (video) fd.append("video", video);

            await api.post("/reports", fd, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            setSuccess("✅ Report submitted! Our team will review it shortly.");
            setForm({ title: "", description: "", disasterType: "", severity: "medium", address: "", city: "", state: "", lat: "", lng: "" });
            setImage(null);
            setVideo(null);
            setPreview(null);
            setVideoPreview(null);
            setUnderstoodWarning(false);
        } catch (err) {
            setError(err?.response?.data?.message || err.message || "An error occurred while submitting the report.");
        } finally {
            setLoading(false);
        }
    };

    const handleAnalyzeImage = async () => {
        if (!image) return;
        setAnalyzing(true);
        setError("");
        try {
            const fd = new FormData();
            fd.append("image", image);
            const { data } = await api.post("/ai/analyze-image", fd, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            
            if (data.analysis) {
                const { disasterType, severity, damageDescription } = data.analysis;
                
                // Map AI disasterType to our values if possible, else keep 'other'
                let matchedType = "other";
                const aiTypeLower = (disasterType || "").toLowerCase();
                const possibleTypes = ["flood", "earthquake", "fire", "cyclone", "landslide", "gas", "drought"];
                for (let t of possibleTypes) {
                    if (aiTypeLower.includes(t)) {
                        matchedType = t;
                        break;
                    }
                }
                
                const validSeverity = ["low", "medium", "high", "critical"].includes(severity?.toLowerCase()) ? severity.toLowerCase() : "medium";

                setForm(f => ({
                    ...f,
                    disasterType: matchedType,
                    severity: validSeverity,
                    description: (f.description ? f.description + "\n\n" : "") + "[AI Analysis] " + damageDescription,
                    title: f.title || `AI Detected ${matchedType.charAt(0).toUpperCase() + matchedType.slice(1)} Incident`
                }));
                setSuccess("✅ AI Analysis complete! Form fields have been auto-filled.");
            }
        } catch (err) {
            setError(err?.response?.data?.message || err.message || "AI Analysis failed.");
        } finally {
            setAnalyzing(false);
        }
    };

    const selectedPos = form.lat && form.lng ? [parseFloat(form.lat), parseFloat(form.lng)] : null;

    return (
        <PublicLayout>
            <div className="form-page">
                <div style={{ marginBottom: 24 }}>
                    <h1 style={{ fontSize: 26, fontWeight: 800 }}>📋 Report a Disaster</h1>
                    <p style={{ color: "var(--text-2)", marginTop: 6 }}>
                        Submit a disaster report with photos, video, and your exact location. Admin team will verify and act on it.
                    </p>
                </div>

                {error && <div className="alert alert-error">{error}</div>}
                {success && <div className="alert alert-success">{success}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-section">
                        <div className="form-section-title">📝 Disaster Details</div>
                        <div className="form-group">
                            <label className="form-label">Title *</label>
                            <input className="input" name="title" value={form.title} onChange={handleChange}
                                placeholder="e.g. Severe flooding in Sector 12" required />
                        </div>
                        <div className="grid grid-2">
                            <div className="form-group">
                                <label className="form-label">Disaster Type *</label>
                                <select className="select" name="disasterType" value={form.disasterType} onChange={handleChange} required>
                                    <option value="">Select type...</option>
                                    {(disasterTypes.length > 0 ? disasterTypes : DISASTER_TYPES).map(d => (
                                        <option key={d.value || d._id} value={d.value || d.name}>{d.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Severity</label>
                                <select className="select" name="severity" value={form.severity} onChange={handleChange}>
                                    {SEVERITIES.map(s => (
                                        <option key={s.value} value={s.value}>{s.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Description *</label>
                            <textarea className="textarea" name="description" value={form.description} onChange={handleChange}
                                placeholder="Describe the disaster situation in detail..." required />
                        </div>
                    </div>

                    {/* Location Section with Real Map */}
                    <div className="form-section">
                        <div className="form-section-title">📍 Select Location on Map</div>
                        <p style={{ color: "var(--text-2)", fontSize: 13, marginBottom: 12 }}>
                            Click anywhere on the map to set the disaster location, or use the GPS button below.
                        </p>
                        <LeafletMap
                            height={300}
                            onClick={handleMapClick}
                            userLocation={userLoc}
                            selectedPosition={selectedPos}
                            zoom={5}
                        />
                        <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
                            <button type="button" className="btn btn-primary" onClick={getLocation} disabled={locating}>
                                {locating ? "📡 Detecting..." : "📡 Use My GPS Location"}
                            </button>
                            {selectedPos && (
                                <span className="badge badge-success" style={{ fontSize: 12, padding: "6px 12px" }}>
                                    📌 {form.lat}, {form.lng}
                                </span>
                            )}
                        </div>
                        <div className="grid grid-2" style={{ marginTop: 12 }}>
                            <div className="form-group">
                                <label className="form-label">Address</label>
                                <input className="input" name="address" value={form.address} onChange={handleChange}
                                    placeholder="Street address" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">City</label>
                                <input className="input" name="city" value={form.city} onChange={handleChange}
                                    placeholder="City name" />
                            </div>
                        </div>
                        <div className="grid grid-2">
                            <div className="form-group">
                                <label className="form-label">State</label>
                                <input className="input" name="state" value={form.state} onChange={handleChange}
                                    placeholder="State name" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Coordinates (auto-filled)</label>
                                <input className="input" value={selectedPos ? `${form.lat}, ${form.lng}` : ""} readOnly disabled
                                    placeholder="Click map or use GPS" />
                            </div>
                        </div>
                    </div>

                    {/* Evidence Upload Section */}
                    <div style={{ display: "grid", gap: 20, gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", marginBottom: 24 }}>
                        {/* Photo Evidence Card */}
                        <div className="card card-glass" style={{ padding: 24, border: "1px solid var(--border)" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10, borderBottom: "1px solid var(--border)", paddingBottom: 12, marginBottom: 16 }}>
                                <span style={{ fontSize: 20 }}>📷</span>
                                <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Photo Evidence</h3>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Upload Image (max 5MB)</label>
                                <div 
                                    onClick={() => fileRef.current.click()}
                                    style={{ 
                                        border: "1px dashed var(--border-2)", 
                                        borderRadius: 12, 
                                        padding: "20px", 
                                        textAlign: "center", 
                                        cursor: "pointer",
                                        background: "var(--panel-2)",
                                        transition: "var(--transition)"
                                    }}
                                    onMouseOver={e => e.currentTarget.style.borderColor = "var(--primary)"}
                                    onMouseOut={e => e.currentTarget.style.borderColor = "var(--border-2)"}
                                >
                                    <input ref={fileRef} type="file" accept="image/*" onChange={handleImage} style={{ display: "none" }} />
                                    <div style={{ fontSize: 32, marginBottom: 10 }}>📤</div>
                                    <button type="button" className="btn btn-sm">Choose Image</button>
                                </div>
                                {preview && (
                                    <div style={{ marginTop: 15, position: "relative" }}>
                                        <img src={preview} alt="Preview" className="img-preview" style={{ maxHeight: 150 }} />
                                        <button 
                                            type="button" 
                                            onClick={() => { setImage(null); setPreview(null); }}
                                            style={{ position: "absolute", top: 10, right: 10, background: "rgba(0,0,0,0.6)", color: "#fff", border: "none", borderRadius: "50%", width: 24, height: 24, cursor: "pointer" }}
                                        >✕</button>
                                        <button 
                                            type="button" 
                                            onClick={handleAnalyzeImage}
                                            disabled={analyzing}
                                            className="btn btn-sm"
                                            style={{ marginTop: 10, width: "100%", background: "linear-gradient(45deg, #a855f7, #6366f1)", color: "#fff", border: "none" }}
                                        >
                                            {analyzing ? "✨ Analyzing with AI..." : "✨ Auto-Fill with Gemini Vision AI"}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Video Evidence Card */}
                        <div className="card card-glass" style={{ padding: 24, border: "1px solid var(--border)" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10, borderBottom: "1px solid var(--border)", paddingBottom: 12, marginBottom: 16 }}>
                                <span style={{ fontSize: 20 }}>📹</span>
                                <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Video Evidence</h3>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Upload Video (max 50MB)</label>
                                <div 
                                    onClick={() => videoRef.current.click()}
                                    style={{ 
                                        border: "1px dashed var(--border-2)", 
                                        borderRadius: 12, 
                                        padding: "20px", 
                                        textAlign: "center", 
                                        cursor: "pointer",
                                        background: "var(--panel-2)",
                                        transition: "var(--transition)"
                                    }}
                                    onMouseOver={e => e.currentTarget.style.borderColor = "var(--primary)"}
                                    onMouseOut={e => e.currentTarget.style.borderColor = "var(--border-2)"}
                                >
                                    <input ref={videoRef} type="file" accept="video/*" onChange={handleVideo} style={{ display: "none" }} />
                                    <div style={{ fontSize: 32, marginBottom: 10 }}>🎬</div>
                                    <button type="button" className="btn btn-sm">Choose Video</button>
                                </div>
                                {videoPreview && (
                                    <div style={{ marginTop: 15, position: "relative" }}>
                                        <video src={videoPreview} controls className="img-preview" style={{ maxHeight: 150 }} />
                                        <button 
                                            type="button" 
                                            onClick={() => { setVideo(null); setVideoPreview(null); }}
                                            style={{ position: "absolute", top: 10, right: 10, background: "rgba(0,0,0,0.6)", color: "#fff", border: "none", borderRadius: "50%", width: 24, height: 24, cursor: "pointer" }}
                                        >✕</button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="form-group" style={{ background: "rgba(239, 68, 68, 0.1)", padding: 16, borderRadius: 8, border: "1px solid rgba(239, 68, 68, 0.3)", display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 20 }}>
                        <input type="checkbox" id="warningCheck" checked={understoodWarning} onChange={(e) => setUnderstoodWarning(e.target.checked)} style={{ marginTop: 4, transform: "scale(1.2)", cursor: "pointer" }} />
                        <label htmlFor="warningCheck" style={{ fontSize: 14, color: "var(--text-1)", cursor: "pointer", lineHeight: 1.5 }}>
                            <strong>Legal Notice: Genuine Reports Only.</strong> I understand that submitting false emergency reports or spamming is a punishable offense under government regulations. Strict legal action will be taken against fake alerts.
                        </label>
                    </div>

                    <button type="submit" className="btn btn-primary btn-lg" disabled={loading || !understoodWarning} style={{ width: "100%" }}>
                        {loading ? "Submitting..." : "📋 Submit Report"}
                    </button>
                </form>
            </div>
        </PublicLayout>
    );
};

export default ReportDisaster;
