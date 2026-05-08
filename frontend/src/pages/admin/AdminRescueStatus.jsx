import { useCallback, useEffect, useState } from "react";
import AdminLayout from "../../modules/admin/AdminLayout.jsx";
import LeafletMap from "../../components/LeafletMap.jsx";
import {
  fetchTeams,
  fetchRescueStatus,
  createTeam,
  updateTeam,
  deleteTeam,
  bulkUpdateTeamStatus,
} from "../../api/rescue.api.js";
import { fetchTeamReviews } from "../../api/review.api.js";

const SPECIALIZATIONS = [
  { value: "general", label: "General Rescue" },
  { value: "flood", label: "Flood / Water Rescue" },
  { value: "fire", label: "Fire Response" },
  { value: "medical", label: "Medical / Paramedic" },
  { value: "earthquake", label: "Earthquake / Structural" },
  { value: "urban_search", label: "Urban Search & Rescue" },
  { value: "hazmat", label: "Hazmat / Chemical" },
];

const SPEC_ICONS = {
  general: "🛟",
  flood: "🌊",
  fire: "🔥",
  medical: "🏥",
  earthquake: "🏚️",
  urban_search: "🔍",
  hazmat: "☣️",
};

const STATUS_COLORS = {
  AVAILABLE: "badge-success",
  DISPATCHED: "badge-warning",
  INACTIVE: "badge-muted",
};

const emptyMember = () => ({ name: "", phone: "" });

/* ─── Consistent spacing tokens ─── */
const SPACING = {
  section: 20,   // gap between major sections
  card: 24,      // card internal padding
  cardCompact: 14, // compact card padding (filter bar)
  row: 12,       // gap between inline items
  field: 16,     // gap between form fields
  small: 8,      // small internal gaps
  tiny: 4,       // micro gaps
};

const AdminRescueStatus = () => {
  const [statusCounts, setStatusCounts] = useState({});
  const [teams, setTeams] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());

  // Filters
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterSpec, setFilterSpec] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    capacity: 5,
    status: "AVAILABLE",
    specialization: "general",
    leadName: "",
    leadPhone: "",
  });
  const [members, setMembers] = useState([emptyMember()]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [locationSearch, setLocationSearch] = useState("");
  const [locationSearching, setLocationSearching] = useState(false);

  // ─── Data Loading ───

  const load = useCallback(async () => {
    setError("");
    try {
      const params = {};
      if (filterStatus !== "all") params.status = filterStatus;
      if (filterSpec !== "all") params.specialization = filterSpec;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const [statusData, teamsData] = await Promise.all([
        fetchRescueStatus(),
        fetchTeams(params),
      ]);
      setStatusCounts(statusData || {});
      setTeams(teamsData || []);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Failed to load rescue status.");
    }
  }, [filterStatus, filterSpec, searchQuery]);

  useEffect(() => {
    load();
  }, [load]);

  // ─── Form Handlers ───

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleMemberChange = (index, field, value) => {
    setMembers((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const addMemberRow = () => {
    if (members.length >= 20) return;
    setMembers((prev) => [...prev, emptyMember()]);
  };

  const removeMemberRow = (index) => {
    if (members.length <= 1) return;
    setMembers((prev) => prev.filter((_, i) => i !== index));
  };

  const handleMapClick = ({ lat, lng }) => {
    setSelectedLocation([lat, lng]);
  };

  const handleSearchLocation = async () => {
    if (!locationSearch.trim()) return;
    setLocationSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationSearch)}`
      );
      const data = await res.json();
      if (data?.length > 0) {
        setSelectedLocation([parseFloat(data[0].lat), parseFloat(data[0].lon)]);
      } else {
        alert("Location not found.");
      }
    } catch {
      alert("Search failed.");
    } finally {
      setLocationSearching(false);
    }
  };

  // ─── CRUD ───

  const handleCreateNew = () => {
    setEditingId(null);
    setFormData({ name: "", capacity: 5, status: "AVAILABLE", specialization: "general", leadName: "", leadPhone: "" });
    setMembers([emptyMember()]);
    setSelectedLocation(null);
    setLocationSearch("");
    setError("");
    setShowModal(true);
  };

  const handleEdit = (team) => {
    setEditingId(team._id);
    setFormData({
      name: team.name || "",
      capacity: team.capacity || 5,
      status: team.status || "AVAILABLE",
      specialization: team.specialization || "general",
      leadName: team.leadName || team.memberNames?.[0] || "",
      leadPhone: team.leadPhone || team.memberPhones?.[0] || "",
    });

    const memberNames = team.memberNames || [];
    const memberPhones = team.memberPhones || [];
    const maxLen = Math.max(memberNames.length, memberPhones.length, 1);
    const memberRows = Array.from({ length: maxLen }, (_, i) => ({
      name: memberNames[i] || "",
      phone: memberPhones[i] || "",
    }));
    setMembers(memberRows);

    if (team.currentLocation?.coordinates) {
      setSelectedLocation([
        team.currentLocation.coordinates[1],
        team.currentLocation.coordinates[0],
      ]);
    } else {
      setSelectedLocation(null);
    }
    setLocationSearch("");
    setError("");
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedLocation) {
      setError("Please select the starting location for this team on the map.");
      return;
    }

    const validMembers = members.filter((m) => m.name.trim() || m.phone.trim());

    setLoading(true);
    setError("");
    try {
      const payload = {
        name: formData.name,
        capacity: Math.max(Number(formData.capacity), validMembers.length || 1),
        status: formData.status,
        specialization: formData.specialization,
        memberNames: validMembers.map((m) => m.name.trim()),
        memberPhones: validMembers.map((m) => m.phone.trim()),
        leadName: formData.leadName || validMembers[0]?.name?.trim() || "",
        leadPhone: formData.leadPhone || validMembers[0]?.phone?.trim() || "",
        currentLocation: {
          type: "Point",
          coordinates: [selectedLocation[1], selectedLocation[0]],
        },
      };

      if (editingId) {
        await updateTeam(editingId, payload);
      } else {
        await createTeam(payload);
      }

      setShowModal(false);
      setFormData({ name: "", capacity: 5, status: "AVAILABLE", specialization: "general", leadName: "", leadPhone: "" });
      setMembers([emptyMember()]);
      setSelectedLocation(null);
      setLocationSearch("");
      setEditingId(null);
      load();
    } catch (err) {
      const msg = err?.response?.data?.errors
        ? err.response.data.errors.join(", ")
        : err?.response?.data?.message || err.message || "Failed to save team.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this team?")) return;
    try {
      await deleteTeam(id);
      setSelectedIds((prev) => { const s = new Set(prev); s.delete(id); return s; });
      load();
    } catch (err) {
      alert(err?.response?.data?.message || err.message || "Failed to delete team.");
    }
  };

  const handleQuickStatus = async (team, newStatus) => {
    try {
      await updateTeam(team._id, { status: newStatus });
      load();
    } catch (err) {
      alert(err?.response?.data?.message || err.message || "Failed to update status.");
    }
  };

  // ─── Bulk Actions ───

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const s = new Set(prev);
      if (s.has(id)) s.delete(id); else s.add(id);
      return s;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === teams.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(teams.map((t) => t._id)));
    }
  };

  const handleBulkStatus = async (status) => {
    if (selectedIds.size === 0) return;
    try {
      await bulkUpdateTeamStatus([...selectedIds], status);
      setSelectedIds(new Set());
      load();
    } catch (err) {
      alert(err?.response?.data?.message || err.message || "Bulk update failed.");
    }
  };

  // ─── Row Expand ───

  const toggleExpand = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
    // Fetch reviews when expanding
    if (expandedId !== id) {
      fetchTeamReviews(id)
        .then((data) => setTeamReviews((prev) => ({ ...prev, [id]: data })))
        .catch(() => {});
    }
  };

  const [teamReviews, setTeamReviews] = useState({});

  // ─── Auto-sync lead from first member ───
  useEffect(() => {
    if (members.length > 0 && members[0].name && !formData.leadName) {
      setFormData((prev) => ({
        ...prev,
        leadName: members[0].name,
        leadPhone: members[0].phone || prev.leadPhone,
      }));
    }
  }, [members]);

  return (
    <AdminLayout
      title="Rescue Team Management"
      action={
        <button className="btn btn-primary" onClick={handleCreateNew} id="add-rescue-team-btn">
          + Add Rescue Team
        </button>
      }
    >
      {error && !showModal && <div className="alert alert-error">{error}</div>}

      {/* ── Status Cards ── */}
      <div className="grid grid-3" style={{ marginBottom: SPACING.section }}>
        {Object.entries(statusCounts).map(([key, value]) => (
          <div
            key={key}
            className="card"
            style={{ cursor: "pointer", padding: SPACING.card }}
            onClick={() => setFilterStatus(filterStatus === key ? "all" : key)}
          >
            <div className="muted" style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: 1, marginBottom: SPACING.small }}>
              {key}
            </div>
            <div style={{
              fontSize: 28,
              fontWeight: 800,
              lineHeight: 1,
              color: key === "AVAILABLE" ? "var(--success)" : key === "DISPATCHED" ? "var(--warning)" : "var(--muted)",
            }}>
              {value}
            </div>
            {filterStatus === key && (
              <div style={{ fontSize: 10, color: "var(--primary)", marginTop: SPACING.small }}>● Filtered</div>
            )}
          </div>
        ))}
      </div>

      {/* ── Filters & Bulk Actions ── */}
      <div className="card" style={{ marginBottom: SPACING.section, padding: `${SPACING.cardCompact}px ${SPACING.field}px` }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: SPACING.row, alignItems: "center" }}>
          <input
            type="text"
            className="input"
            placeholder="Search teams, members, phones..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ maxWidth: 260, flex: "1 1 200px" }}
            id="team-search-input"
          />
          <select
            className="select"
            value={filterSpec}
            onChange={(e) => setFilterSpec(e.target.value)}
            style={{ maxWidth: 180 }}
            id="team-filter-spec"
          >
            <option value="all">All Specializations</option>
            {SPECIALIZATIONS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          <select
            className="select"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{ maxWidth: 160 }}
            id="team-filter-status"
          >
            <option value="all">All Status</option>
            <option value="AVAILABLE">Available</option>
            <option value="DISPATCHED">Dispatched</option>
            <option value="INACTIVE">Inactive</option>
          </select>

          {selectedIds.size > 0 && (
            <div style={{ display: "flex", gap: SPACING.small, marginLeft: "auto", alignItems: "center" }}>
              <span className="muted" style={{ fontSize: 13 }}>{selectedIds.size} selected</span>
              <button className="btn btn-sm btn-success" onClick={() => handleBulkStatus("AVAILABLE")}>
                Set Available
              </button>
              <button className="btn btn-sm btn-warning" onClick={() => handleBulkStatus("INACTIVE")}>
                Set Inactive
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Team Table ── */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: `${SPACING.cardCompact}px ${SPACING.section}px`, borderBottom: "1px solid var(--border)" }}>
          <h4 style={{ margin: 0, fontWeight: 700, fontSize: 15 }}>
            Teams ({teams.length})
          </h4>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table className="table" id="rescue-teams-table">
            <thead>
              <tr>
                <th style={{ width: 40, paddingLeft: SPACING.field }}>
                  <input
                    type="checkbox"
                    checked={teams.length > 0 && selectedIds.size === teams.length}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th>Team</th>
                <th>Specialization</th>
                <th>Status</th>
                <th>Members</th>
                <th>Lead Contact</th>
                <th>Location</th>
                <th style={{ textAlign: "right", paddingRight: SPACING.field }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {teams.map((t) => {
                const isExpanded = expandedId === t._id;
                return (
                  <tr key={t._id}>
                    <td style={{ paddingLeft: SPACING.field }}>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(t._id)}
                        onChange={() => toggleSelect(t._id)}
                      />
                    </td>

                    {/* Team Name + Expand */}
                    <td>
                      <div style={{ display: "flex", alignItems: "flex-start", gap: SPACING.small }}>
                        <button
                          className="btn-icon"
                          onClick={() => toggleExpand(t._id)}
                          style={{ fontSize: 10, padding: "4px 6px", marginTop: 2, border: "none", background: "none", color: "var(--muted)" }}
                          title={isExpanded ? "Collapse" : "Expand members"}
                        >
                          {isExpanded ? "▼" : "▶"}
                        </button>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 13, lineHeight: 1.4 }}>{t.name}</div>
                          {t.autoGenerated && (
                            <span style={{ fontSize: 10, color: "var(--muted)", marginTop: 2, display: "inline-block" }}>
                              ⚙️ Auto-generated
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Expanded Member Detail Panel */}
                      {isExpanded && (
                        <div style={{
                          marginTop: SPACING.row,
                          padding: SPACING.row,
                          background: "var(--panel-2)",
                          borderRadius: SPACING.small,
                          border: "1px solid var(--border)",
                        }}>
                          <div style={{ fontWeight: 700, marginBottom: SPACING.small, color: "var(--primary)", fontSize: 12 }}>
                            Team Members ({t.memberCount || t.memberNames?.length || 0})
                          </div>
                          <div style={{ display: "grid", gap: SPACING.small }}>
                            {(t.memberNames || []).map((name, i) => (
                              <div
                                key={`member-${t._id}-${i}`}
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                  padding: `${SPACING.small}px ${SPACING.row}px`,
                                  background: "var(--panel-3)",
                                  borderRadius: 6,
                                  gap: SPACING.row,
                                }}
                              >
                                <div style={{ display: "flex", alignItems: "center", gap: SPACING.small }}>
                                  <span style={{
                                    width: 24, height: 24, borderRadius: "50%",
                                    background: i === 0 ? "var(--primary)" : "var(--panel)",
                                    color: i === 0 ? "#fff" : "var(--text-2)",
                                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                                    fontSize: 10, fontWeight: 700, flexShrink: 0,
                                  }}>
                                    {i === 0 ? "L" : i + 1}
                                  </span>
                                  <span style={{ fontWeight: i === 0 ? 700 : 400, fontSize: 13 }}>
                                    {name}
                                    {i === 0 && <span style={{ fontSize: 10, color: "var(--primary)", marginLeft: 4 }}>(Lead)</span>}
                                  </span>
                                </div>
                                <span className="muted" style={{ fontSize: 12, whiteSpace: "nowrap" }}>
                                  {t.memberPhones?.[i] || "—"}
                                </span>
                              </div>
                            ))}
                          </div>

                          {/* Team Reviews Section */}
                          {teamReviews[t._id] && (
                            <div style={{
                              marginTop: SPACING.row,
                              padding: SPACING.row,
                              background: "var(--panel-3)",
                              borderRadius: 6,
                              border: "1px solid var(--border)",
                            }}>
                              <div style={{ fontWeight: 700, marginBottom: SPACING.small, color: "var(--warning)", fontSize: 12 }}>
                                ⭐ Reviews ({teamReviews[t._id].stats?.totalReviews || 0})
                              </div>
                              {teamReviews[t._id].stats?.totalReviews > 0 ? (
                                <>
                                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: SPACING.small, marginBottom: SPACING.small }}>
                                    <div style={{ textAlign: "center", padding: 8, background: "var(--panel-2)", borderRadius: 6 }}>
                                      <div style={{ fontSize: 18, fontWeight: 800, color: "var(--warning)" }}>
                                        {teamReviews[t._id].stats.avgRating?.toFixed(1)}
                                      </div>
                                      <div style={{ fontSize: 10, color: "var(--muted)" }}>Avg Rating</div>
                                    </div>
                                    <div style={{ textAlign: "center", padding: 8, background: "var(--panel-2)", borderRadius: 6 }}>
                                      <div style={{ fontSize: 18, fontWeight: 800, color: "var(--primary)" }}>
                                        {teamReviews[t._id].stats.avgProfessionalism?.toFixed(1)}
                                      </div>
                                      <div style={{ fontSize: 10, color: "var(--muted)" }}>Professionalism</div>
                                    </div>
                                    <div style={{ textAlign: "center", padding: 8, background: "var(--panel-2)", borderRadius: 6 }}>
                                      <div style={{ display: "flex", justifyContent: "center", gap: 4 }}>
                                        <span style={{ color: "var(--success)", fontSize: 11 }}>⚡{teamReviews[t._id].stats.fastCount}</span>
                                        <span style={{ color: "var(--warning)", fontSize: 11 }}>⏱️{teamReviews[t._id].stats.moderateCount}</span>
                                        <span style={{ color: "var(--danger)", fontSize: 11 }}>🐢{teamReviews[t._id].stats.slowCount}</span>
                                      </div>
                                      <div style={{ fontSize: 10, color: "var(--muted)" }}>Response</div>
                                    </div>
                                  </div>
                                  {teamReviews[t._id].reviews?.slice(0, 3).map((r) => (
                                    <div key={r._id} style={{
                                      padding: `${SPACING.small}px ${SPACING.row}px`,
                                      background: "var(--panel-2)",
                                      borderRadius: 6,
                                      marginBottom: 4,
                                      fontSize: 12,
                                    }}>
                                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                        <span style={{ fontWeight: 600, fontSize: 11 }}>{r.user?.name || "User"}</span>
                                        <span style={{ color: "var(--warning)", fontSize: 11 }}>{"⭐".repeat(r.rating)}</span>
                                      </div>
                                      {r.comment && <div className="muted" style={{ marginTop: 2, fontSize: 11 }}>"{r.comment}"</div>}
                                    </div>
                                  ))}
                                </>
                              ) : (
                                <div className="muted" style={{ fontSize: 11 }}>No reviews yet.</div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Specialization */}
                    <td>
                      <span style={{ fontSize: 12 }}>
                        {SPEC_ICONS[t.specialization] || "🛟"}{" "}
                        {SPECIALIZATIONS.find((s) => s.value === t.specialization)?.label || t.specialization}
                      </span>
                    </td>

                    {/* Status + Quick Toggles */}
                    <td>
                      <div style={{ display: "flex", flexDirection: "column", gap: SPACING.small }}>
                        <span className={`badge ${STATUS_COLORS[t.status] || "badge-muted"}`}>
                          {t.status}
                        </span>
                        <div style={{ display: "flex", gap: SPACING.tiny }}>
                          {t.status !== "AVAILABLE" && (
                            <button className="btn btn-sm" style={{ fontSize: 10, padding: "2px 6px" }} onClick={() => handleQuickStatus(t, "AVAILABLE")} title="Set Available">✅</button>
                          )}
                          {t.status !== "DISPATCHED" && (
                            <button className="btn btn-sm" style={{ fontSize: 10, padding: "2px 6px" }} onClick={() => handleQuickStatus(t, "DISPATCHED")} title="Set Dispatched">🚀</button>
                          )}
                          {t.status !== "INACTIVE" && (
                            <button className="btn btn-sm" style={{ fontSize: 10, padding: "2px 6px" }} onClick={() => handleQuickStatus(t, "INACTIVE")} title="Set Inactive">⏸️</button>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Members */}
                    <td>
                      <span style={{ fontWeight: 700 }}>{t.memberCount || t.memberNames?.length || 0}</span>
                      <span className="muted"> / {t.capacity}</span>
                    </td>

                    {/* Lead Contact */}
                    <td>
                      <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.4 }}>{t.leadName || t.memberNames?.[0] || "—"}</div>
                      <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>{t.leadPhone || "—"}</div>
                    </td>

                    {/* Location */}
                    <td>
                      <span className="muted" style={{ fontSize: 12 }}>
                        {t.currentLocation?.coordinates
                          ? `${t.currentLocation.coordinates[1]?.toFixed(4)}, ${t.currentLocation.coordinates[0]?.toFixed(4)}`
                          : "—"}
                      </span>
                    </td>

                    {/* Actions */}
                    <td style={{ paddingRight: SPACING.field }}>
                      <div style={{ display: "flex", gap: SPACING.small, justifyContent: "flex-end" }}>
                        <button className="btn btn-sm btn-outline" onClick={() => handleEdit(t)} id={`edit-team-${t._id}`}>
                          ✏️ Edit
                        </button>
                        <button className="btn btn-sm btn-danger" onClick={() => handleDelete(t._id)} id={`delete-team-${t._id}`}>
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!teams.length && (
                <tr>
                  <td colSpan="8" className="muted" style={{ textAlign: "center", padding: `${SPACING.card}px ${SPACING.section}px` }}>
                    No rescue teams found. Add one above or adjust your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ──────────── Create/Edit Team Modal ──────────── */}
      {showModal && (
        <div
          className="modal-overlay"
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}
        >
          <div className="modal-content" style={{ maxWidth: 720 }}>
            {/* Modal Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: SPACING.section }}>
              <h3 style={{ fontWeight: 700, fontSize: 17, margin: 0 }}>
                {editingId ? "✏️ Edit Rescue Team" : "🚑 Add Rescue Team"}
              </h3>
              <button className="btn-icon" onClick={() => setShowModal(false)} style={{ flexShrink: 0 }}>✕</button>
            </div>

            {error && <div className="alert alert-error">{error}</div>}

            <form onSubmit={handleSubmit}>
              {/* Basic Info Row 1 */}
              <div className="grid grid-2" style={{ marginBottom: SPACING.field, gap: SPACING.row }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Team Name / Callsign *</label>
                  <input
                    className="input"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g. Alpha Rescue Unit 1"
                    required
                    id="team-name-input"
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Specialization</label>
                  <select
                    className="select"
                    name="specialization"
                    value={formData.specialization}
                    onChange={handleInputChange}
                    id="team-specialization-select"
                  >
                    {SPECIALIZATIONS.map((s) => (
                      <option key={s.value} value={s.value}>{SPEC_ICONS[s.value]} {s.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Basic Info Row 2 */}
              <div className="grid grid-2" style={{ marginBottom: SPACING.field, gap: SPACING.row }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Max Capacity (Personnel) *</label>
                  <input
                    className="input"
                    type="number"
                    min="1"
                    max="50"
                    name="capacity"
                    value={formData.capacity}
                    onChange={handleInputChange}
                    required
                    id="team-capacity-input"
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Initial Status</label>
                  <select
                    className="select"
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    id="team-status-select"
                  >
                    <option value="AVAILABLE">Available</option>
                    <option value="DISPATCHED">Dispatched</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>
              </div>

              {/* Lead Info */}
              <div style={{
                padding: SPACING.cardCompact,
                background: "var(--panel-2)",
                borderRadius: SPACING.small,
                border: "1px solid var(--border)",
                marginBottom: SPACING.field,
              }}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: SPACING.row, color: "var(--primary)" }}>
                  👤 Team Lead
                </div>
                <div className="grid grid-2" style={{ gap: SPACING.row }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: 12 }}>Lead Name</label>
                    <input
                      className="input"
                      name="leadName"
                      value={formData.leadName}
                      onChange={handleInputChange}
                      placeholder="Auto from 1st member"
                      id="team-lead-name"
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: 12 }}>Lead Phone</label>
                    <input
                      className="input"
                      name="leadPhone"
                      value={formData.leadPhone}
                      onChange={handleInputChange}
                      placeholder="Auto from 1st member"
                      id="team-lead-phone"
                    />
                  </div>
                </div>
              </div>

              {/* Dynamic Member Rows */}
              <div style={{ marginBottom: SPACING.field }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: SPACING.row }}>
                  <label className="form-label" style={{ marginBottom: 0 }}>
                    👥 Team Members ({members.filter((m) => m.name.trim()).length} entered)
                  </label>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline"
                    onClick={addMemberRow}
                    disabled={members.length >= 20}
                  >
                    + Add Member
                  </button>
                </div>

                <div style={{ maxHeight: 220, overflowY: "auto", display: "grid", gap: SPACING.small }}>
                  {members.map((member, index) => (
                    <div
                      key={`member-row-${index}`}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "28px 1fr 1fr 32px",
                        gap: SPACING.small,
                        alignItems: "center",
                      }}
                    >
                      <span style={{
                        width: 24, height: 24, borderRadius: "50%",
                        background: index === 0 ? "var(--primary)" : "var(--panel-3)",
                        color: index === 0 ? "#fff" : "var(--text-2)",
                        display: "inline-flex", alignItems: "center", justifyContent: "center",
                        fontSize: 10, fontWeight: 700,
                      }}>
                        {index + 1}
                      </span>
                      <input
                        className="input"
                        placeholder={`Member ${index + 1} name`}
                        value={member.name}
                        onChange={(e) => handleMemberChange(index, "name", e.target.value)}
                        style={{ fontSize: 13 }}
                      />
                      <input
                        className="input"
                        placeholder="+91 98765 43210"
                        value={member.phone}
                        onChange={(e) => handleMemberChange(index, "phone", e.target.value)}
                        style={{ fontSize: 13 }}
                      />
                      <button
                        type="button"
                        className="btn-icon"
                        onClick={() => removeMemberRow(index)}
                        disabled={members.length <= 1}
                        style={{ fontSize: 14, opacity: members.length <= 1 ? 0.3 : 0.7 }}
                        title="Remove member"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>

                <div className="muted" style={{ fontSize: 11, marginTop: SPACING.small }}>
                  💡 Leave member rows empty to let the system auto-generate placeholder names.
                </div>
              </div>

              {/* Map Selection */}
              <div style={{ marginBottom: SPACING.field }}>
                <label className="form-label">📍 Team Base Location (Click map to pin) *</label>

                <div style={{ display: "flex", gap: SPACING.small, marginBottom: SPACING.small }}>
                  <input
                    type="text"
                    className="input"
                    placeholder="Search city or area..."
                    value={locationSearch}
                    onChange={(e) => setLocationSearch(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleSearchLocation())}
                    id="team-location-search"
                  />
                  <button type="button" className="btn btn-secondary" onClick={handleSearchLocation} disabled={locationSearching} style={{ flexShrink: 0 }}>
                    {locationSearching ? "..." : "🔍"}
                  </button>
                  {selectedLocation && (
                    <button type="button" className="btn" onClick={() => setSelectedLocation(null)} style={{ flexShrink: 0 }}>
                      Clear
                    </button>
                  )}
                </div>

                <LeafletMap
                  height={260}
                  onClick={handleMapClick}
                  selectedPosition={selectedLocation}
                  zoom={5}
                />

                {selectedLocation && (
                  <div className="muted" style={{ fontSize: 11, marginTop: SPACING.small }}>
                    📌 Lat: {selectedLocation[0]?.toFixed(5)}, Lng: {selectedLocation[1]?.toFixed(5)}
                  </div>
                )}
              </div>

              {/* Submit Buttons */}
              <div style={{ display: "flex", gap: SPACING.small, justifyContent: "flex-end", paddingTop: SPACING.field, borderTop: "1px solid var(--border)" }}>
                <button type="button" className="btn" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading || !selectedLocation}
                  id="team-submit-btn"
                >
                  {loading ? "Saving..." : editingId ? "💾 Save Changes" : "🚑 Add Team"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminRescueStatus;
