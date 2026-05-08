import api from "./axios.js";

export const fetchActiveAlerts = async () => {
  const { data } = await api.get("/alerts", { params: { status: "active" } });
  return data;
};

export const fetchPublicActiveAlerts = async () => {
  const { data } = await api.get("/public/alerts/active");
  return data;
};
