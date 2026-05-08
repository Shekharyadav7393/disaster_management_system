import { useState, useEffect } from "react";
import PublicLayout from "../../modules/public/PublicLayout.jsx";
import api from "../../api/axios.js";

const DonationTransparency = () => {
    const [donations, setDonations] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [totalAmount, setTotalAmount] = useState(0);
    const [searchTerm, setSearchTerm] = useState("");
    const filteredDonations = donations.filter(d => 
        (d.donorName && d.donorName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (d.date && new Date(d.date).toLocaleDateString().includes(searchTerm))
    );

    useEffect(() => {
        setLoading(true);
        api.get(`/donations/public?page=${page}&limit=20`)
            .then(r => {
                setDonations(r.data.donations || []);
                setTotal(r.data.total || 0);
                setTotalAmount(r.data.totalAmount || 0);
            })
            .catch(() => { })
            .finally(() => setLoading(false));
    }, [page]);

    const formatAmount = d => {
        if (d.donationType === "MONEY") {
            return `₹${(d.amount || 0).toLocaleString()}`;
        }
        if (d.items?.length)
            return d.items.map(i => `${i.quantity} ${i.unit} ${i.name}`).join(", ");
        return "Item Donation";
    };

    return (
        <PublicLayout>
            <div className="transparency-header">
                <h2 style={{ fontSize: 28, fontWeight: 800, background: "linear-gradient(135deg, var(--success), var(--cyan))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                    🔍 Donation Transparency
                </h2>
                <p style={{ color: "var(--text-2)", marginTop: 8, marginBottom: 24 }}>
                    Every donation is publicly recorded. Full transparency on where your money goes.
                </p>

                <div className="grid grid-3" style={{ textAlign: "center", maxWidth: 600, margin: "0 auto 32px" }}>
                    <div className="card">
                        <div style={{ fontSize: 24, fontWeight: 800, color: "var(--success)" }}>
                            {total}
                        </div>
                        <div className="muted">Total Records</div>
                    </div>
                    <div className="card">
                        <div style={{ fontSize: 24, fontWeight: 800, color: "var(--primary)" }}>
                            ₹{totalAmount.toLocaleString()}
                        </div>
                        <div className="muted">Money This Page</div>
                    </div>
                    <div className="card">
                        <div style={{ fontSize: 24, fontWeight: 800, color: "var(--warning)" }}>
                            100%
                        </div>
                        <div className="muted">Verified Records</div>
                    </div>
                </div>
            </div>

            <div className="card">
                <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
                    <input 
                        type="text" 
                        placeholder="Search by Donor Name or Date..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="input"
                        style={{ maxWidth: 300 }}
                    />
                </div>

                {loading ? (
                    <div className="loading-page"><div className="spinner" /></div>
                ) : filteredDonations.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">💰</div>
                        <p>No donation records yet.</p>
                    </div>
                ) : (
                    <div className="table-wrapper">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Donor Name</th>
                                    <th>Type</th>
                                    <th>Amount / Items</th>
                                    <th>Disaster / Camp</th>
                                    <th>Status</th>
                                    <th>Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredDonations.map((d, i) => (
                                    <tr key={i}>
                                        <td className="muted">{(page - 1) * 20 + i + 1}</td>
                                        <td>
                                            <div style={{ fontWeight: 600 }}>{d.donorName}</div>
                                            <div className="muted">{d.donorLocation || d.donorType}</div>
                                        </td>
                                        <td>
                                            <span className={`badge ${d.donationType === "MONEY" ? "badge-primary" : "badge-warning"}`}>
                                                {d.donationType}
                                            </span>
                                        </td>
                                        <td style={{ fontWeight: 600 }}>{formatAmount(d)}</td>
                                        <td>{d.disaster || d.camp || "General Fund"}</td>
                                        <td>
                                            <span className="badge badge-success">{d.status}</span>
                                        </td>
                                        <td className="muted">{new Date(d.date).toLocaleDateString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {total > 20 && (
                    <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 16 }}>
                        <button className="btn btn-sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                            ← Previous
                        </button>
                        <span style={{ padding: "5px 10px", color: "var(--muted)", fontSize: 13 }}>
                            Page {page} of {Math.ceil(total / 20)}
                        </span>
                        <button className="btn btn-sm" onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil(total / 20)}>
                            Next →
                        </button>
                    </div>
                )}
            </div>
        </PublicLayout>
    );
};

export default DonationTransparency;

