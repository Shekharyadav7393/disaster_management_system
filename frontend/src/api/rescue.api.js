import api from "./axios.js";

/**
 * GET /api/teams — Fetch all teams with optional filters
 * @param {Object} params - { status, specialization, search }
 */
export const fetchTeams = async (params = {}) => {
  const { data } = await api.get("/teams", { params });
  return data;
};

/**
 * GET /api/teams/:id — Fetch single team by ID
 */
export const fetchTeamById = async (id) => {
  const { data } = await api.get(`/teams/${id}`);
  return data;
};

/**
 * POST /api/teams — Create a new rescue team
 */
export const createTeam = async (payload) => {
  const { data } = await api.post("/teams", payload);
  return data;
};

/**
 * PUT /api/teams/:id — Update an existing rescue team
 */
export const updateTeam = async (id, payload) => {
  const { data } = await api.put(`/teams/${id}`, payload);
  return data;
};

/**
 * DELETE /api/teams/:id — Delete a rescue team
 */
export const deleteTeam = async (id) => {
  const { data } = await api.delete(`/teams/${id}`);
  return data;
};

/**
 * PATCH /api/teams/bulk-status — Bulk update team statuses
 * @param {string[]} teamIds
 * @param {string} status - AVAILABLE | DISPATCHED | INACTIVE
 */
export const bulkUpdateTeamStatus = async (teamIds, status) => {
  const { data } = await api.patch("/teams/bulk-status", { teamIds, status });
  return data;
};

/**
 * GET /api/dashboard/rescue-status — Fetch rescue status counts
 */
export const fetchRescueStatus = async () => {
  const { data } = await api.get("/dashboard/rescue-status");
  return data;
};
