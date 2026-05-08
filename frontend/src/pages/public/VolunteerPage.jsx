import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PublicLayout from "../../modules/public/PublicLayout.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import api from "../../api/axios.js";

const SKILLS = ["First Aid", "Search & Rescue", "Medical", "Logistics", "Communication", "Driving", "Cooking", "Engineering", "IT Support", "Counseling"];

const VolunteerPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [registering, setRegistering] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [form, setForm] = useState({
        skills: [],
        availability: "on-call",
        bio: "",
        emergencyContactName: "",
        emergencyContactPhone: "",
        emergencyContactRelation: "",
    });

    useEffect(() => {
        if (!user) { setLoading(false); return; }
        api.get("/volunteers/me")
            .then(r => setProfile(r.data))
            .catch(() => setProfile(null))
            .finally(() => setLoading(false));
    }, [user]);

    if (!user) {
        return (
            <PublicLayout>
                <div className="card" style={{ maxWidth: 480, margin: "60px auto", textAlign: "center" }}>
                    <div style={{ fontSize: 48, marginBottom: 16 }}>🤝</div>
                    <h2>Join Our Volunteer Network</h2>
                    <p className="muted" style={{ margin: "12px 0 20px" }}>
                        Sign in to register as a disaster relief volunteer.
                    </p>
                    <button className="btn btn-primary" onClick={() => navigate("/login")}>Sign In</button>
                </div>
            </PublicLayout>
        );
    }

    const toggleSkill = skill => {
        setForm(f => ({
            ...f,
            skills: f.skills.includes(skill)
                ? f.skills.filter(s => s !== skill)
                : [...f.skills, skill],
        }));
    };

    const handleRegister = async e => {
        e.preventDefault();
        setRegistering(true);
        setError("");
        try {
            const { data } = await api.post("/volunteers/register", {
                skills: form.skills,
                availability: form.availability,
                bio: form.bio,
                emergencyContact: {
                    name: form.emergencyContactName,
                    phone: form.emergencyContactPhone,
                    relation: form.emergencyContactRelation,
                },
            });
            setProfile(data.volunteer);
            setSuccess("✅ Registration submitted! You'll hear from us after review.");
        } catch (err) {
            setError(err?.response?.data?.message || err.message || "Failed to register.");
        } finally {
            setRegistering(false);
        }
    };

    if (loading) {
        return (
            <PublicLayout>
                <div className="loading-page"><div className="spinner" /></div>
            </PublicLayout>
        );
    }

    const statusColors = {
        pending: "var(--warning)",
        approved: "var(--success)",
        active: "var(--primary)",
        rejected: "var(--danger)",
        inactive: "var(--muted)",
    };

    if (profile) {
        return (
            <PublicLayout>
                <div style={{ maxWidth: 600, margin: "0 auto" }}>
                    <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 24 }}>🤝 Volunteer Profile</h1>

                    <div className="card" style={{ marginBottom: 20 }}>
                        <div className="flex-between" style={{ marginBottom: 16 }}>
                            <div>
                                <h2 style={{ fontSize: 18, fontWeight: 700 }}>{user.name}</h2>
                                <p className="muted">{user.email}</p>
                            </div>
                            <span className="badge" style={{ background: `${statusColors[profile.status]}22`, color: statusColors[profile.status], fontSize: 13, padding: "6px 14px" }}>
                                {profile.status?.toUpperCase()}
                            </span>
                        </div>

                        {profile.status === "pending" && (
                            <div className="alert alert-warning">
                                ⏳ Your application is under review. You'll be notified once approved.
                            </div>
                        )}

                        <div className="grid grid-2" style={{ gap: 12 }}>
                            <div>
                                <div className="muted">Availability</div>
                                <div style={{ fontWeight: 600, marginTop: 2 }}>{profile.availability}</div>
                            </div>
                            <div>
                                <div className="muted">Total Hours</div>
                                <div style={{ fontWeight: 600, marginTop: 2 }}>{profile.totalHours || 0} hrs</div>
                            </div>
                            {profile.assignedZone && (
                                <div>
                                    <div className="muted">Assigned Zone</div>
                                    <div style={{ fontWeight: 600, marginTop: 2 }}>{profile.assignedZone}</div>
                                </div>
                            )}
                        </div>

                        {profile.skills?.length > 0 && (
                            <div style={{ marginTop: 16 }}>
                                <div className="muted" style={{ marginBottom: 8 }}>Skills</div>
                                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                                    {profile.skills.map(s => (
                                        <span key={s} className="badge badge-primary">{s}</span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Activity Log */}
                    {profile.activityLog?.length > 0 && (
                        <div className="card">
                            <div className="card-title" style={{ marginBottom: 12 }}>Activity Log</div>
                            {profile.activityLog.slice(0, 5).map((a, i) => (
                                <div key={i} style={{ padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
                                    <div style={{ fontWeight: 500, fontSize: 13 }}>{a.action}</div>
                                    <div className="muted">{a.location} · {a.hours} hrs · {new Date(a.date).toLocaleDateString()}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </PublicLayout>
        );
    }

    return (
        <PublicLayout>
            <div style={{ maxWidth: 600, margin: "0 auto" }}>
                <div style={{ marginBottom: 24 }}>
                    <h1 style={{ fontSize: 26, fontWeight: 800 }}>🤝 Become a Volunteer</h1>
                    <p style={{ color: "var(--text-2)", marginTop: 6 }}>
                        Join our disaster relief network. Your skills can save lives.
                    </p>
                </div>

                {error && <div className="alert alert-error">{error}</div>}
                {success && <div className="alert alert-success">{success}</div>}

                <form onSubmit={handleRegister}>
                    <div className="form-section">
                        <div className="form-section-title">🛠 Your Skills</div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                            {SKILLS.map(skill => (
                                <button
                                    type="button"
                                    key={skill}
                                    onClick={() => toggleSkill(skill)}
                                    className={`btn btn-sm ${form.skills.includes(skill) ? "btn-primary" : ""}`}
                                >
                                    {form.skills.includes(skill) ? "✓ " : ""}{skill}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="form-section">
                        <div className="form-section-title">📅 Availability</div>
                        <select className="select" value={form.availability}
                            onChange={e => setForm(f => ({ ...f, availability: e.target.value }))}>
                            <option value="full-time">Full-Time</option>
                            <option value="part-time">Part-Time</option>
                            <option value="weekends">Weekends Only</option>
                            <option value="on-call">On-Call (Emergency)</option>
                        </select>
                    </div>

                    <div className="form-section">
                        <div className="form-section-title">🧑 About You</div>
                        <div className="form-group">
                            <label className="form-label">Bio / Experience</label>
                            <textarea className="textarea" value={form.bio}
                                onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                                placeholder="Briefly describe your relevant experience..." />
                        </div>
                    </div>

                    <div className="form-section">
                        <div className="form-section-title">📞 Emergency Contact</div>
                        <div className="grid grid-2">
                            <div className="form-group">
                                <label className="form-label">Name</label>
                                <input className="input" value={form.emergencyContactName}
                                    onChange={e => setForm(f => ({ ...f, emergencyContactName: e.target.value }))}
                                    placeholder="Contact name" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Phone</label>
                                <input className="input" value={form.emergencyContactPhone}
                                    onChange={e => setForm(f => ({ ...f, emergencyContactPhone: e.target.value }))}
                                    placeholder="Phone number" />
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Relation</label>
                            <input className="input" value={form.emergencyContactRelation}
                                onChange={e => setForm(f => ({ ...f, emergencyContactRelation: e.target.value }))}
                                placeholder="e.g. Parent, Spouse, Sibling" />
                        </div>
                    </div>

                    <button type="submit" className="btn btn-primary btn-lg" disabled={registering}>
                        {registering ? "Registering..." : "🤝 Submit Registration"}
                    </button>
                </form>
            </div>
        </PublicLayout>
    );
};

export default VolunteerPage;
