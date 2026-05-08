import { useState, useEffect, useCallback } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts';
import AdminLayout from "../../modules/admin/AdminLayout.jsx";
import api from "../../api/axios.js";

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#a855f7', '#06b6d4', '#ec4899'];

const AdminAnalytics = () => {
    const [data, setData] = useState(null);
    const [regional, setRegional] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [syncing, setSyncing] = useState(false);
    const [syncMsg, setSyncMsg] = useState("");

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [summaryRes, regionalRes] = await Promise.all([
                api.get("/analytics/summary"),
                api.get("/analytics/regional")
            ]);
            setData(summaryRes.data);
            setRegional(regionalRes.data);
        } catch (err) {
            setError(err?.response?.data?.message || err.message || "Failed to load analytics");
        } finally {
            setLoading(false);
        }
    }, []);

    const handleSync = async () => {
        setSyncing(true);
        setSyncMsg("");
        try {
            const res = await api.post("/admin/sensors/sync");
            setSyncMsg(res.data.message || "Sync successful!");
            load(); // Reload data after sync
            setTimeout(() => setSyncMsg(""), 5000);
        } catch (err) {
            setSyncMsg(err?.response?.data?.message || "Sync failed");
        } finally {
            setSyncing(false);
        }
    };

    useEffect(() => { load(); }, [load]);

    if (loading) {
        return (
            <AdminLayout title="System Analytics">
                <div className="loading-page"><div className="spinner" /></div>
            </AdminLayout>
        );
    }

    const { typeDistribution, severityBreakdown, reportsTrend, alertsTrend, resourceDistribution, taskStatus, stats } = data || {};

    const summaryCards = [
        { label: "Verified Reports", value: stats?.verifiedReports || 0, icon: "📋", color: "#3b82f6" },
        { label: "Active Volunteers", value: stats?.volunteerCount || 0, icon: "🤝", color: "#10b981" },
        { label: "Total Users", value: stats?.totalUsers || 0, icon: "👥", color: "#a855f7" },
        { label: "Pending SOS", value: stats?.openSOS || 0, icon: "🆘", color: "#ef4444" },
    ];

    if (error) {
        return (
            <AdminLayout title="System Analytics">
                <div className="card" style={{ textAlign: "center", padding: 40, margin: "20px auto", maxWidth: 600 }}>
                    <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
                    <h3>Analytics Load Failed</h3>
                    <p style={{ color: "var(--text-2)", margin: "12px 0 20px" }}>{error}</p>
                    <button className="btn btn-primary" onClick={load}>🔄 Try Again</button>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout title="System Analytics" action={
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                {syncMsg && <span style={{ fontSize: 13, color: syncMsg.includes("failed") ? "#ef4444" : "#10b981", fontWeight: 500 }}>{syncMsg}</span>}
                <button 
                    className="btn btn-secondary" 
                    onClick={handleSync} 
                    disabled={syncing}
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                >
                    {syncing ? "⌛ Syncing..." : "🤖 Sync AI Sensors"}
                </button>
                <button className="btn btn-primary" onClick={load}>🔄 Refresh Data</button>
            </div>
        }>
            {/* KPI Row */}
            <div className="stats-grid" style={{ marginBottom: 30 }}>
                {summaryCards.map(c => (
                    <div key={c.label} className="stat-card" style={{ borderTop: `4px solid ${c.color}` }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div>
                                <div className="stat-label" style={{ fontSize: 13, textTransform: "uppercase", letterSpacing: "0.5px" }}>{c.label}</div>
                                <div className="stat-value" style={{ fontSize: 28, fontWeight: 800, color: "var(--text-1)" }}>{c.value}</div>
                            </div>
                            <div style={{ fontSize: 32, opacity: 0.8 }}>{c.icon}</div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-2" style={{ marginBottom: 30, gap: 24 }}>
                {/* Reports Trend - Area Chart */}
                <div className="card" style={{ padding: 24 }}>
                    <h3 style={{ marginTop: 0, marginBottom: 20 }}>📊 Reports & Alerts Trend (30 Days)</h3>
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={reportsTrend}>
                                <defs>
                                    <linearGradient id="colorReports" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                <XAxis dataKey="_id" stroke="var(--muted)" fontSize={12} tickFormatter={(val) => val.split('-').slice(1).join('/')} />
                                <YAxis stroke="var(--muted)" fontSize={12} />
                                <Tooltip 
                                    contentStyle={{ background: 'var(--panel-1)', border: '1px solid var(--border)', borderRadius: '8px' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Legend />
                                <Area type="monotone" dataKey="count" name="Disaster Reports" stroke="#3b82f6" fillOpacity={1} fill="url(#colorReports)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Disaster Type Distribution - Pie Chart */}
                <div className="card" style={{ padding: 24 }}>
                    <h3 style={{ marginTop: 0, marginBottom: 20 }}>🔥 Disaster Type Distribution</h3>
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={typeDistribution}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="count"
                                    nameKey="_id"
                                >
                                    {typeDistribution?.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ background: 'var(--panel-1)', border: '1px solid var(--border)', borderRadius: '8px' }}
                                />
                                <Legend verticalAlign="bottom" height={36}/>
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div className="grid grid-2" style={{ gap: 24 }}>
                {/* Severity Breakdown - Bar Chart */}
                <div className="card" style={{ padding: 24 }}>
                    <h3 style={{ marginTop: 0, marginBottom: 20 }}>⚡ Severity Breakdown</h3>
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={severityBreakdown}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                <XAxis dataKey="_id" stroke="var(--muted)" fontSize={12} />
                                <YAxis stroke="var(--muted)" fontSize={12} />
                                <Tooltip
                                    contentStyle={{ background: 'var(--panel-1)', border: '1px solid var(--border)', borderRadius: '8px' }}
                                />
                                <Bar dataKey="count" name="Total Reports" radius={[4, 4, 0, 0]}>
                                    {severityBreakdown?.map((entry, index) => (
                                        <Cell 
                                            key={`cell-${index}`} 
                                            fill={entry._id === 'critical' || entry._id === 'high' ? '#ef4444' : entry._id === 'medium' ? '#f59e0b' : '#10b981'} 
                                        />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Regional Activity - Vertical Bar Chart */}
                <div className="card" style={{ padding: 24 }}>
                    <h3 style={{ marginTop: 0, marginBottom: 20 }}>📍 Top Affected Regions (City)</h3>
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={regional} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                <XAxis type="number" stroke="var(--muted)" fontSize={12} />
                                <YAxis type="category" dataKey="_id" stroke="var(--muted)" fontSize={11} width={80} />
                                <Tooltip
                                    contentStyle={{ background: 'var(--panel-1)', border: '1px solid var(--border)', borderRadius: '8px' }}
                                />
                                <Bar dataKey="count" name="Reports" fill="#06b6d4" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div className="grid grid-2" style={{ gap: 24, marginTop: 24 }}>
                {/* Resource Distribution - Bar Chart */}
                <div className="card" style={{ padding: 24 }}>
                    <h3 style={{ marginTop: 0, marginBottom: 20 }}>📦 Resource Stock by Category</h3>
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data?.resourceDistribution}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                <XAxis dataKey="_id" stroke="var(--muted)" fontSize={11} tickFormatter={val => val.toUpperCase()} />
                                <YAxis stroke="var(--muted)" fontSize={12} />
                                <Tooltip
                                    contentStyle={{ background: 'var(--panel-1)', border: '1px solid var(--border)', borderRadius: '8px' }}
                                />
                                <Bar dataKey="total" name="Quantity" fill="#8884d8" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Volunteer Task Status - Pie Chart */}
                <div className="card" style={{ padding: 24 }}>
                    <h3 style={{ marginTop: 0, marginBottom: 20 }}>📋 Volunteer Task Status</h3>
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data?.taskStatus}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="count"
                                    nameKey="_id"
                                >
                                    {data?.taskStatus?.map((entry, index) => (
                                        <Cell 
                                            key={`cell-${index}`} 
                                            fill={entry._id === 'completed' ? '#10b981' : entry._id === 'in-progress' ? '#3b82f6' : '#f59e0b'} 
                                        />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ background: 'var(--panel-1)', border: '1px solid var(--border)', borderRadius: '8px' }}
                                />
                                <Legend verticalAlign="bottom" height={36}/>
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminAnalytics;

