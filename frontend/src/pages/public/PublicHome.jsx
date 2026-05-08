import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import PublicLayout from "../../modules/public/PublicLayout.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import api from "../../api/axios.js";
import { socket } from "../../socket/socket.js";
import { getRedirectPath } from "../../utils/authUtils.js";

const features = [
  {
    icon: "🚨",
    title: "Live Disaster Alerts",
    desc: "Real-time alerts for floods, earthquakes, fires, and more. Stay informed and stay safe.",
    path: "/alerts",
    color: "var(--danger)",
  },
  {
    icon: "🗺",
    title: "Interactive Disaster Map",
    desc: "View disaster zones, rescue teams, and relief camps on a live OpenStreetMap.",
    path: "/map",
    color: "var(--primary)",
  },
  {
    icon: "📋",
    title: "Report a Disaster",
    desc: "Spotted a disaster? Report it with photos, video, and GPS location on an interactive map.",
    path: "/report-disaster",
    color: "var(--warning)",
  },
  {
    icon: "🆘",
    title: "SOS Emergency Button",
    desc: "One-tap SOS that sends your live GPS coordinates directly to rescue teams.",
    path: "/sos",
    color: "var(--sos)",
  },
  {
    icon: "🏕",
    title: "Find Relief Camps",
    desc: "Locate nearby camps for shelter, food, water, and medical assistance.",
    path: "/camps",
    color: "var(--success)",
  },
  {
    icon: "💙",
    title: "Donate & Support",
    desc: "Contribute money or essential supplies to active disaster relief operations.",
    path: "/donate",
    color: "var(--cyan)",
  },
  {
    icon: "🤝",
    title: "Volunteer",
    desc: "Register as a volunteer and be part of the emergency response network.",
    path: "/volunteer",
    color: "var(--purple)",
  },
  {
    icon: "🔍",
    title: "Donation Transparency",
    desc: "Full public record of all donations — who donated, how much, and where it went.",
    path: "/transparency",
    color: "var(--orange)",
  },
];



/* Animated counter hook */
const useCounter = (target, duration = 1200) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    if (!target || started.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const startTime = performance.now();
          const animate = (now) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.round(eased * target));
            if (progress < 1) requestAnimationFrame(animate);
          };
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.3 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration]);

  return [count, ref];
};

const StatItem = ({ icon, value, label, color, isAmount }) => {
  const numericValue = isAmount
    ? (typeof value === "number" ? value : 0)
    : (parseInt(value) || 0);
  const [animatedCount, ref] = useCounter(numericValue);

  const formatDisplay = () => {
    if (isAmount) {
      if (animatedCount >= 10000000) return `₹${(animatedCount / 10000000).toFixed(1)}Cr+`;
      if (animatedCount >= 100000) return `₹${(animatedCount / 100000).toFixed(1)}L+`;
      return `₹${animatedCount.toLocaleString()}+`;
    }
    return `${animatedCount}+`;
  };

  return (
    <div ref={ref} style={{ textAlign: "center", padding: "16px 12px" }}>
      <div style={{ fontSize: 32, marginBottom: 8, filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.3))" }}>{icon}</div>
      <div className="counter-value" style={{ fontSize: 26, fontWeight: 800, color, letterSpacing: "-0.5px" }}>
        {formatDisplay()}
      </div>
      <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4, fontWeight: 500 }}>{label}</div>
    </div>
  );
};

const PublicHome = () => {
  const { user } = useAuth();
  const [statsData, setStatsData] = useState({
    alerts: 0,
    camps: 0,
    volunteers: 0,
    donations: 0
  });
  const [latestAlert, setLatestAlert] = useState(null);

  const isValidAlertText = (text) => {
    if (!text) return false;
    // Filter out obvious garbage like long strings without spaces
    if (text.length > 15 && !text.includes(' ')) return false;
    // Filter out common random keyboard smashes
    if (/^[A-Z]{10,}$/.test(text)) return false; 
    return true;
  };

  useEffect(() => {
    const loadStats = async () => {
      try {
        const { data } = await api.get("/public/stats");
        setStatsData(data);
      } catch (err) {
        console.error(err?.response?.data?.message || err.message || "Failed to load public stats");
      }
    };

    const loadLatestAlert = async () => {
      try {
        const { data } = await api.get("/public/alerts/active");
        const alerts = data || [];
        const validAlerts = alerts.filter(a => isValidAlertText(a.title || a.message));
        if (validAlerts.length > 0) setLatestAlert(validAlerts);
      } catch (err) {
        console.error("Ticker fetch error:", err.message);
      }
    };

    loadStats();
    loadLatestAlert();

    // 🔥 Real-time listeners
    socket.on("stats.updated", (data) => {
      console.log("Real-time stats update received:", data);
      loadStats();
    });

    socket.on("new_alert", (alert) => {
      console.log("New alert received via socket:", alert);
      if (!isValidAlertText(alert.title || alert.message)) return;
      
      setLatestAlert(prev => {
        const exists = prev?.some(a => a.id === alert._id || a._id === alert._id);
        if (exists) return prev;
        return [alert, ...(prev || [])].slice(0, 3);
      });
      loadStats(); // Alerts affect stats count
    });

    return () => {
      socket.off("stats.updated");
      socket.off("new_alert");
    };
  }, []);

  const stats = [
    { icon: "🚑", value: statsData.alerts, label: "Active Alerts", color: "var(--danger)" },
    { icon: "🏕", value: statsData.camps, label: "Relief Camps", color: "var(--success)" },
    { icon: "💰", value: statsData.donations, label: "Donations Raised", color: "var(--primary)", isAmount: true },
    { icon: "🤝", value: statsData.volunteers, label: "Volunteers", color: "var(--cyan)" },
  ];

  return (
    <PublicLayout>
      {/* Emergency Ticker */}
      {latestAlert && latestAlert.length > 0 && (
        <div className="emergency-ticker" style={{ marginBottom: 0, borderRadius: 0, marginTop: -32, marginLeft: -24, marginRight: -24 }}>
          <div className="ticker-track">
            {[...latestAlert, ...latestAlert].map((a, i) => (
              <div key={i} className="ticker-item">
                <span>⚡</span>
                <span>{a.title || a.message || "Emergency Alert"}</span>
                {a.severity && (
                  <span style={{
                    fontSize: 10, padding: "1px 6px", borderRadius: 4, fontWeight: 700,
                    background: "rgba(255,255,255,0.2)"
                  }}>{a.severity?.toUpperCase()}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hero with animated gradient backgrounds */}
      <div className="hero" style={{ position: "relative", overflow: "visible" }}>
        <div className="hero-bg" />
        <div className="hero-bg-2" />
        <div className="hero-badge">
          <div className="pulse-dot" />
          System Operational — Real-time monitoring active
        </div>
        <h1>India's Smart Disaster<br />Management Platform</h1>
        <p>
          A unified command center connecting citizens, rescue teams, volunteers, and relief organizations
          to respond to disasters faster, smarter, and more transparently.
        </p>
        


        <div className="hero-actions">
          <Link to="/sos" className="btn btn-danger btn-lg" style={{
            animation: "sosPulse 2s infinite",
            fontWeight: 700
          }}>
            🆘 Emergency SOS
          </Link>
          <Link to="/request-help" className="btn btn-lg" style={{ borderColor: "var(--warning)", color: "var(--warning)" }}>
            📞 Request Help
          </Link>
          {user ? (
            <Link to={getRedirectPath(user.role)} className="btn btn-lg">
              👤 My Dashboard
            </Link>
          ) : (
            <Link to="/login" className="btn btn-primary btn-lg">
              🔐 Sign In / Register
            </Link>
          )}
          <Link to="/map" className="btn btn-lg" style={{ border: "1px solid var(--primary)", color: "var(--primary)" }}>
            🗺 Open Live Map
          </Link>
        </div>
      </div>

      {/* Stats bar — glass effect with animated counters */}
      <div
        className="glass-card"
        style={{
          marginBottom: 36,
          padding: "8px 0",
          animation: "fadeInUp 0.6s ease 0.4s both",
        }}
      >
        <div className="grid grid-4">
          {stats.map((s) => (
            <StatItem key={s.label} {...s} />
          ))}
        </div>
      </div>



      {/* Features Grid */}
      <div style={{ marginBottom: 16, maxWidth: 1200, margin: "0 auto" }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4, letterSpacing: "-0.02em" }}>
          Platform Features
        </h2>
        <p style={{ color: "var(--muted)", fontSize: 14, marginBottom: 24 }}>
          Everything you need during a disaster situation — powered by real-time data and AI.
        </p>
        <div className="grid grid-4" style={{ gap: 24, justifyContent: "center" }}>
          {features.map((f) => (
            <Link
              to={f.path}
              key={f.title}
              className="feature-card"
              style={{ "--card-color": f.color, textDecoration: "none" }}
            >
              <div 
                className="feature-card-icon" 
                style={{ 
                  background: `color-mix(in srgb, ${f.color} 15%, transparent)`, 
                  padding: '16px', 
                  borderRadius: '16px', 
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '16px'
                }}
              >
                {f.icon}
              </div>
              <h3 style={{ marginBottom: 8 }}>{f.title}</h3>
              <p>{f.desc}</p>
              <div style={{ marginTop: 14, fontSize: 12, color: f.color, fontWeight: 600 }}>
                Explore →
              </div>
            </Link>
          ))}
        </div>
      </div>



      {/* Emergency banner */}
      <div
        className="card"
        style={{
          background: "linear-gradient(135deg, rgba(239,68,68,0.08), rgba(255,45,85,0.04))",
          border: "1px solid rgba(239,68,68,0.25)",
          marginTop: 8,
          textAlign: "center",
          padding: "40px 32px",
          animation: "fadeInUp 0.6s ease 0.6s both",
        }}
      >
        <div style={{ fontSize: 44, marginBottom: 16 }}>🆘</div>
        <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 10, letterSpacing: "-0.02em" }}>
          In a Life-Threatening Emergency?
        </h2>
        <p style={{ color: "var(--text-2)", marginBottom: 24, fontSize: 15, lineHeight: 1.7 }}>
          Call <strong style={{ color: "var(--danger)", fontSize: 22 }}>112</strong> immediately or use our SOS system to alert rescue teams with your live GPS location.
        </p>
        <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
          <Link to="/sos" className="btn btn-danger btn-lg">
            🆘 Activate SOS
          </Link>
          <Link to="/request-help" className="btn btn-lg">
            📞 Request Help
          </Link>
        </div>
      </div>
    </PublicLayout>
  );
};

export default PublicHome;
