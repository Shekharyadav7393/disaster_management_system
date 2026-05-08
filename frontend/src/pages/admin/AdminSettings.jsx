import { useEffect, useMemo, useState } from "react";
import AdminLayout from "../../modules/admin/AdminLayout.jsx";
import api from "../../api/axios.js";
import { persistApiBaseUrl } from "../../utils/runtimeConfig.js";

// ───────────────────────── helpers ──────────────────────────────────────────
const emptyIntegration = () => ({
  key: "",
  name: "",
  baseUrl: "",
  apiKey: "",
  apiSecret: "",
  enabled: true,
  notes: "",
  module: "general",
  configText: "{}",
});

const normalizeIntegrationForForm = (item) => ({
  key: item?.key || "",
  name: item?.name || "",
  baseUrl: item?.baseUrl || "",
  apiKey: item?.apiKey || "",
  apiSecret: item?.apiSecret || "",
  enabled: item?.enabled !== false,
  notes: item?.notes || "",
  module: item?.module || "general",
  configText: JSON.stringify(item?.config || {}, null, 2),
});

const emptyPayment = () => ({
  razorpayKeyId: "",
  razorpayKeySecret: "",
  razorpayEnabled: false,
  paymentLink: "",
  upiId: "",
  upiName: "",
  upiEnabled: false,
  accountHolderName: "",
  bankName: "",
  accountNumber: "",
  ifscCode: "",
  accountType: "savings",
  bankEnabled: false,
  orgName: "",
  orgDescription: "",
});

const normalizePaymentForForm = (pa = {}) => ({
  razorpayKeyId:     pa.razorpayKeyId     || "",
  razorpayKeySecret: pa.razorpayKeySecret || "",
  razorpayEnabled:   pa.razorpayEnabled   === true,
  paymentLink:       pa.paymentLink       || "",
  upiId:             pa.upiId             || "",
  upiName:           pa.upiName           || "",
  upiEnabled:        pa.upiEnabled        === true,
  accountHolderName: pa.accountHolderName || "",
  bankName:          pa.bankName          || "",
  accountNumber:     pa.accountNumber     || "",
  ifscCode:          pa.ifscCode          || "",
  accountType:       pa.accountType       || "savings",
  bankEnabled:       pa.bankEnabled       === true,
  orgName:           pa.orgName           || "",
  orgDescription:    pa.orgDescription    || "",
});

// ───────────────────────── component ────────────────────────────────────────
const AdminSettings = () => {
  const [activeTab, setActiveTab]       = useState("payment");
  const [frontend, setFrontend]         = useState({ apiBaseUrl: "" });
  const [integrations, setIntegrations] = useState([]);
  const [payment, setPayment]           = useState(emptyPayment());
  const [loading, setLoading]           = useState(true);
  const [saving, setSaving]             = useState(false);
  const [message, setMessage]           = useState("");
  const [error, setError]               = useState("");
  const [showSecrets, setShowSecrets]   = useState({});

  const loadSettings = async () => {
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const { data } = await api.get("/settings");
      setFrontend({ apiBaseUrl: data?.frontend?.apiBaseUrl || "" });
      setIntegrations((data?.integrations || []).map(normalizeIntegrationForForm));
      setPayment(normalizePaymentForForm(data?.paymentAccount || {}));
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load settings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadSettings(); }, []);

  const hasInvalidJson = useMemo(
    () =>
      integrations.some((item) => {
        try { JSON.parse(item.configText || "{}"); return false; }
        catch { return true; }
      }),
    [integrations]
  );

  const updateIntegration = (index, field, value) =>
    setIntegrations((cur) =>
      cur.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );

  const addIntegration = () =>
    setIntegrations((cur) => [...cur, emptyIntegration()]);

  const removeIntegration = (index) =>
    setIntegrations((cur) => cur.filter((_, i) => i !== index));

  const setPaymentField = (field, value) =>
    setPayment((cur) => ({ ...cur, [field]: value }));

  const toggleSecret = (key) =>
    setShowSecrets((cur) => ({ ...cur, [key]: !cur[key] }));

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const payload = {
        frontend:       { apiBaseUrl: frontend.apiBaseUrl.trim() },
        paymentAccount: { ...payment },
        integrations:   integrations.map((item) => ({
          key:     item.key,
          name:    item.name,
          baseUrl: item.baseUrl,
          apiKey:  item.apiKey,
          apiSecret: item.apiSecret,
          enabled:   item.enabled,
          notes:     item.notes,
          module:    item.module,
          config:    JSON.parse(item.configText || "{}"),
        })),
      };

      const { data } = await api.put("/settings", payload);
      persistApiBaseUrl(payload.frontend.apiBaseUrl || "");
      setMessage(data?.message || "Settings saved.");
      setFrontend({ apiBaseUrl: data?.settings?.frontend?.apiBaseUrl || payload.frontend.apiBaseUrl || "" });
      setIntegrations((data?.settings?.integrations || []).map(normalizeIntegrationForForm));
      setPayment(normalizePaymentForForm(data?.settings?.paymentAccount || {}));
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  // ── tabs config ──────────────────────────────────────────────────────────
  const TABS = [
    { id: "payment", label: "💳 Payment Account", badge: payment.razorpayEnabled || payment.upiEnabled || payment.bankEnabled ? "active" : null },
    { id: "apis",    label: "🔌 API Registry",    badge: integrations.length > 0 ? String(integrations.length) : null },
    { id: "general", label: "⚙️ General",          badge: null },
  ];

  return (
    <AdminLayout
      title="Settings"
      action={
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn" onClick={loadSettings} disabled={loading || saving}>
            🔄 Reload
          </button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving || hasInvalidJson}>
            {saving ? "Saving…" : "💾 Save Settings"}
          </button>
        </div>
      }
    >
      {/* ── Alerts ── */}
      {message && <div className="alert alert-success" style={{ marginBottom: 16 }}>✅ {message}</div>}
      {error   && <div className="alert alert-error"   style={{ marginBottom: 16 }}>❌ {error}</div>}

      {/* ── Tab Bar ── */}
      <div className="settings-tab-bar" style={{
        display: "flex", gap: 4, borderBottom: "2px solid var(--border)",
        marginBottom: 24, overflowX: "auto",
      }}>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: "10px 20px",
              background: activeTab === tab.id ? "var(--primary)" : "transparent",
              color: activeTab === tab.id ? "#fff" : "var(--text-muted)",
              border: "none",
              borderRadius: "8px 8px 0 0",
              cursor: "pointer",
              fontWeight: activeTab === tab.id ? 700 : 400,
              fontSize: 14,
              display: "flex",
              alignItems: "center",
              gap: 8,
              whiteSpace: "nowrap",
              transition: "all 0.2s",
            }}
          >
            {tab.label}
            {tab.badge && (
              <span style={{
                background: activeTab === tab.id ? "rgba(255,255,255,0.25)" : "var(--primary)",
                color: "#fff",
                borderRadius: 12,
                padding: "1px 8px",
                fontSize: 11,
                fontWeight: 700,
              }}>
                {tab.badge === "active" ? "ON" : tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="card" style={{ textAlign: "center", padding: 40 }}>
          <div className="muted">Loading settings…</div>
        </div>
      ) : (
        <>
          {/* ════════════════ PAYMENT ACCOUNT TAB ════════════════ */}
          {activeTab === "payment" && (
            <div style={{ display: "grid", gap: 20 }}>

              {/* Organisation Info */}
              <div className="card">
                <div className="card-title" style={{ marginBottom: 4 }}>🏢 Organisation Info</div>
                <p className="muted" style={{ marginBottom: 16, fontSize: 13 }}>
                  Shown to donors on the Donate page.
                </p>
                <div className="grid grid-2" style={{ gap: 12 }}>
                  <div>
                    <label className="label">Organisation Name</label>
                    <input className="input" value={payment.orgName}
                      placeholder="Disaster Relief Foundation"
                      onChange={(e) => setPaymentField("orgName", e.target.value)} />
                  </div>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <label className="label">Short Description</label>
                    <textarea className="input" rows={2} value={payment.orgDescription}
                      placeholder="We provide emergency relief and rehabilitation support…"
                      onChange={(e) => setPaymentField("orgDescription", e.target.value)} />
                  </div>
                </div>
              </div>

              {/* Razorpay */}
              <div className="card" style={{ borderLeft: payment.razorpayEnabled ? "4px solid var(--primary)" : "4px solid var(--border)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <div>
                    <div className="card-title">💳 Razorpay Payment Gateway</div>
                    <p className="muted" style={{ fontSize: 13, marginTop: 2 }}>
                      Online card / UPI / netbanking donations via Razorpay.
                    </p>
                  </div>
                  <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                    <div className="toggle-switch" onClick={() => setPaymentField("razorpayEnabled", !payment.razorpayEnabled)}
                      style={{
                        width: 48, height: 26, borderRadius: 13, cursor: "pointer",
                        background: payment.razorpayEnabled ? "var(--primary)" : "var(--border)",
                        position: "relative", transition: "background 0.3s",
                      }}>
                      <div style={{
                        position: "absolute", top: 3, left: payment.razorpayEnabled ? 24 : 3,
                        width: 20, height: 20, borderRadius: "50%", background: "#fff",
                        transition: "left 0.3s", boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
                      }} />
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: payment.razorpayEnabled ? "var(--primary)" : "var(--text-muted)" }}>
                      {payment.razorpayEnabled ? "Enabled" : "Disabled"}
                    </span>
                  </label>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label className="label">
                      Razorpay Key ID
                      <span className="muted" style={{ fontWeight: "normal", fontSize: 11, marginLeft: 6 }}>(Public)</span>
                    </label>
                    <div style={{ position: "relative" }}>
                      <input className="input"
                        type={showSecrets.rzKeyId ? "text" : "password"}
                        value={payment.razorpayKeyId}
                        placeholder="rzp_live_xxxxxxxxxxxxxxxx"
                        onChange={(e) => setPaymentField("razorpayKeyId", e.target.value)} />
                      <button type="button" onClick={() => toggleSecret("rzKeyId")}
                        style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                          background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "var(--text-muted)" }}>
                        {showSecrets.rzKeyId ? "🙈" : "👁️"}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="label">
                      Razorpay Key Secret
                      <span className="muted" style={{ fontWeight: "normal", fontSize: 11, marginLeft: 6 }}>(Encrypted)</span>
                    </label>
                    <div style={{ position: "relative" }}>
                      <input className="input"
                        type={showSecrets.rzSecret ? "text" : "password"}
                        value={payment.razorpayKeySecret}
                        placeholder="Enter to update…"
                        onChange={(e) => setPaymentField("razorpayKeySecret", e.target.value)} />
                      <button type="button" onClick={() => toggleSecret("rzSecret")}
                        style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                          background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "var(--text-muted)" }}>
                        {showSecrets.rzSecret ? "🙈" : "👁️"}
                      </button>
                    </div>
                  </div>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <label className="label">Hosted Payment Link</label>
                    <input
                      className="input"
                      value={payment.paymentLink}
                      placeholder="https://rzp.io/rzp/your-payment-link"
                      onChange={(e) => setPaymentField("paymentLink", e.target.value)}
                    />
                    <div className="muted" style={{ marginTop: 6, fontSize: 12 }}>
                      Only the gateway account keys are required for in-app checkout. This link is optional and will appear on the public Donate page.
                    </div>
                  </div>
                </div>

                <div className="muted" style={{ marginTop: 12, fontSize: 12, paddingTop: 10, borderTop: "1px solid var(--border)" }}>
                  💡 <strong>Tip:</strong> Get your keys from{" "}
                  <a href="https://dashboard.razorpay.com/app/keys" target="_blank" rel="noopener noreferrer" style={{ color: "var(--primary)" }}>
                    Razorpay Dashboard → Settings → API Keys
                  </a>
                  . These keys are encrypted before storage. Enabling this will auto-sync keys to the Razorpay integration in the API Registry.
                </div>
              </div>

              {/* UPI */}
              <div className="card" style={{ borderLeft: payment.upiEnabled ? "4px solid #6366f1" : "4px solid var(--border)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <div>
                    <div className="card-title">📱 UPI / GPay / PhonePe</div>
                    <p className="muted" style={{ fontSize: 13, marginTop: 2 }}>
                      Show your UPI ID on the Donate page for direct UPI transfers.
                    </p>
                  </div>
                  <div className="toggle-switch" onClick={() => setPaymentField("upiEnabled", !payment.upiEnabled)}
                    style={{
                      width: 48, height: 26, borderRadius: 13, cursor: "pointer",
                      background: payment.upiEnabled ? "#6366f1" : "var(--border)",
                      position: "relative", transition: "background 0.3s",
                    }}>
                    <div style={{
                      position: "absolute", top: 3, left: payment.upiEnabled ? 24 : 3,
                      width: 20, height: 20, borderRadius: "50%", background: "#fff",
                      transition: "left 0.3s", boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
                    }} />
                  </div>
                </div>
                <div className="grid grid-2" style={{ gap: 12 }}>
                  <div>
                    <label className="label">UPI ID</label>
                    <input className="input" value={payment.upiId}
                      placeholder="yourname@bank"
                      onChange={(e) => setPaymentField("upiId", e.target.value)} />
                  </div>
                  <div>
                    <label className="label">Display Name (for QR)</label>
                    <input className="input" value={payment.upiName}
                      placeholder="Disaster Relief Foundation"
                      onChange={(e) => setPaymentField("upiName", e.target.value)} />
                  </div>
                </div>
              </div>

              {/* Bank Transfer */}
              <div className="card" style={{ borderLeft: payment.bankEnabled ? "4px solid #10b981" : "4px solid var(--border)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <div>
                    <div className="card-title">🏦 Bank Account (NEFT / RTGS)</div>
                    <p className="muted" style={{ fontSize: 13, marginTop: 2 }}>
                      Display bank details on the Donate page for direct transfers.
                    </p>
                  </div>
                  <div className="toggle-switch" onClick={() => setPaymentField("bankEnabled", !payment.bankEnabled)}
                    style={{
                      width: 48, height: 26, borderRadius: 13, cursor: "pointer",
                      background: payment.bankEnabled ? "#10b981" : "var(--border)",
                      position: "relative", transition: "background 0.3s",
                    }}>
                    <div style={{
                      position: "absolute", top: 3, left: payment.bankEnabled ? 24 : 3,
                      width: 20, height: 20, borderRadius: "50%", background: "#fff",
                      transition: "left 0.3s", boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
                    }} />
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label className="label">Account Holder Name</label>
                    <input className="input" value={payment.accountHolderName}
                      placeholder="Disaster Relief Foundation"
                      onChange={(e) => setPaymentField("accountHolderName", e.target.value)} />
                  </div>
                  <div>
                    <label className="label">Bank Name</label>
                    <input className="input" value={payment.bankName}
                      placeholder="State Bank of India"
                      onChange={(e) => setPaymentField("bankName", e.target.value)} />
                  </div>
                  <div>
                    <label className="label">Account Number <span className="muted" style={{ fontWeight: "normal", fontSize: 11 }}>(Masked)</span></label>
                    <div style={{ position: "relative" }}>
                      <input className="input"
                        type={showSecrets.accNo ? "text" : "password"}
                        value={payment.accountNumber}
                        placeholder="Enter account number"
                        onChange={(e) => setPaymentField("accountNumber", e.target.value)} />
                      <button type="button" onClick={() => toggleSecret("accNo")}
                        style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                          background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "var(--text-muted)" }}>
                        {showSecrets.accNo ? "🙈" : "👁️"}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="label">IFSC Code</label>
                    <input className="input" value={payment.ifscCode}
                      placeholder="SBIN0001234"
                      onChange={(e) => setPaymentField("ifscCode", e.target.value.toUpperCase())} />
                  </div>
                  <div>
                    <label className="label">Account Type</label>
                    <select className="input" value={payment.accountType}
                      onChange={(e) => setPaymentField("accountType", e.target.value)}
                      style={{ padding: "8px" }}>
                      <option value="savings">Savings</option>
                      <option value="current">Current</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ════════════════ API REGISTRY TAB ════════════════ */}
          {activeTab === "apis" && (
            <div className="card">
              <div className="card-header" style={{ marginBottom: 16 }}>
                <div>
                  <span className="card-title">🔌 API Registry</span>
                  <p className="muted" style={{ fontSize: 13, marginTop: 2 }}>
                    Add or update any external API key here. Changes take effect immediately on save.
                  </p>
                </div>
                <button className="btn btn-sm" onClick={addIntegration}>+ Add API</button>
              </div>

              {integrations.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">🔌</div>
                  <p>No integrations configured yet.</p>
                </div>
              ) : (
                <div style={{ display: "grid", gap: 16 }}>
                  {integrations.map((item, index) => {
                    let configError = "";
                    try { JSON.parse(item.configText || "{}"); }
                    catch { configError = "Invalid Config JSON format."; }

                    const moduleColors = {
                      general: "#6b7280",
                      notification: "#f59e0b",
                      weather: "#3b82f6",
                      prediction: "#8b5cf6",
                      payment: "#10b981",
                    };
                    const moduleColor = moduleColors[item.module] || moduleColors.general;

                    return (
                      <div key={`${item.key || "new"}-${index}`} className="card"
                        style={{ background: "var(--panel-2)", borderLeft: `4px solid ${moduleColor}` }}>
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 12, alignItems: "center" }}>
                          <div>
                            <div style={{ fontSize: 15, fontWeight: 700 }}>{item.name || "New Integration"}</div>
                            <div className="muted" style={{ fontSize: 12 }}>
                              <code style={{ background: "var(--panel)", padding: "1px 6px", borderRadius: 4 }}>
                                {item.key || "set-a-unique-key"}
                              </code>
                              <span style={{
                                marginLeft: 8, background: moduleColor + "22", color: moduleColor,
                                borderRadius: 10, padding: "1px 8px", fontSize: 11, fontWeight: 600
                              }}>
                                {item.module}
                              </span>
                            </div>
                          </div>
                          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                            <label style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 12 }}>
                              <div onClick={() => updateIntegration(index, "enabled", !item.enabled)}
                                style={{
                                  width: 36, height: 20, borderRadius: 10, cursor: "pointer",
                                  background: item.enabled ? "var(--primary)" : "var(--border)",
                                  position: "relative", transition: "background 0.3s",
                                }}>
                                <div style={{
                                  position: "absolute", top: 2, left: item.enabled ? 17 : 2,
                                  width: 16, height: 16, borderRadius: "50%", background: "#fff",
                                  transition: "left 0.3s",
                                }} />
                              </div>
                              {item.enabled ? "ON" : "OFF"}
                            </label>
                            <button className="btn btn-sm btn-danger" onClick={() => removeIntegration(index)}>Remove</button>
                          </div>
                        </div>

                        <div className="grid grid-2" style={{ gap: 12 }}>
                          <div>
                            <label className="label">Key</label>
                            <input className="input" value={item.key}
                              onChange={(e) => updateIntegration(index, "key", e.target.value)}
                              placeholder="weather" />
                          </div>
                          <div>
                            <label className="label">Name</label>
                            <input className="input" value={item.name}
                              onChange={(e) => updateIntegration(index, "name", e.target.value)}
                              placeholder="Weather API" />
                          </div>
                          <div style={{ gridColumn: "1 / -1", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                            <div>
                              <label className="label">Base URL / Endpoint</label>
                              <input className="input" value={item.baseUrl}
                                onChange={(e) => updateIntegration(index, "baseUrl", e.target.value)}
                                placeholder="https://api.example.com/v1" />
                            </div>
                            <div>
                              <label className="label">Module</label>
                              <select className="input" value={item.module || "general"}
                                onChange={(e) => updateIntegration(index, "module", e.target.value)}
                                style={{ padding: "8px" }}>
                                <option value="general">General Services</option>
                                <option value="notification">Notifications (Twilio, SMTP)</option>
                                <option value="weather">Weather &amp; Environment</option>
                                <option value="prediction">AI / Prediction Models</option>
                                <option value="payment">Payment Gateway</option>
                              </select>
                            </div>
                          </div>
                          <div>
                            <label className="label">API Key <span className="muted" style={{ fontWeight: "normal", fontSize: 11 }}>(Masked if saved)</span></label>
                            <input className="input" value={item.apiKey}
                              onChange={(e) => updateIntegration(index, "apiKey", e.target.value)}
                              placeholder="Enter new key to update…" />
                          </div>
                          <div>
                            <label className="label">API Secret <span className="muted" style={{ fontWeight: "normal", fontSize: 11 }}>(Masked if saved)</span></label>
                            <input className="input" value={item.apiSecret}
                              onChange={(e) => updateIntegration(index, "apiSecret", e.target.value)}
                              placeholder="Enter new secret to update…" />
                          </div>
                          <div style={{ gridColumn: "1 / -1" }}>
                            <label className="label">Notes</label>
                            <input className="input" value={item.notes}
                              onChange={(e) => updateIntegration(index, "notes", e.target.value)}
                              placeholder="What this API is used for" />
                          </div>
                          <div style={{ gridColumn: "1 / -1" }}>
                            <label className="label">Extra Config (JSON)</label>
                            <textarea className="input" rows={4} value={item.configText}
                              onChange={(e) => updateIntegration(index, "configText", e.target.value)}
                              style={{ resize: "vertical", fontFamily: "monospace", fontSize: 12 }} />
                            {configError && (
                              <div className="muted" style={{ color: "var(--danger)", marginTop: 6 }}>⚠️ {configError}</div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ════════════════ GENERAL TAB ════════════════ */}
          {activeTab === "general" && (
            <div className="card">
              <div className="card-title" style={{ marginBottom: 4 }}>⚙️ Frontend Connection</div>
              <p className="muted" style={{ marginBottom: 16, fontSize: 13 }}>
                Override the backend API base URL for the frontend. Leave blank to use the default <code>/api</code> path.
              </p>
              <label className="label">API Base URL</label>
              <input className="input"
                placeholder="https://your-backend.onrender.com"
                value={frontend.apiBaseUrl}
                onChange={(e) => setFrontend({ apiBaseUrl: e.target.value })} />
              <p className="muted" style={{ marginTop: 8, fontSize: 12 }}>
                Use the backend origin only. The frontend automatically appends `/api`.
              </p>
            </div>
          )}
        </>
      )}
    </AdminLayout>
  );
};

export default AdminSettings;
