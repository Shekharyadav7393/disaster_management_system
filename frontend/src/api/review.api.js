import api from "./axios.js";

/**
 * POST /api/reviews — Submit a team review
 */
export const submitReview = async (payload) => {
  const { data } = await api.post("/reviews", payload);
  return data;
};

/**
 * GET /api/reviews/team/:teamId — Get reviews + stats for a team
 */
export const fetchTeamReviews = async (teamId) => {
  const { data } = await api.get(`/reviews/team/${teamId}`);
  return data;
};

/**
 * GET /api/reviews/mine — Get current user's reviews
 */
export const fetchMyReviews = async () => {
  const { data } = await api.get("/reviews/mine");
  return data;
};

/**
 * GET /api/notifications/mine — Get user's auto-generated notifications
 */
export const fetchMyNotifications = async (limit = 30) => {
  const { data } = await api.get("/notifications/mine", { params: { limit } });
  return data;
};

/**
 * PATCH /api/notifications/:id/read — Mark notification as read
 */
export const markNotificationRead = async (id) => {
  const { data } = await api.patch(`/notifications/${id}/read`);
  return data;
};
