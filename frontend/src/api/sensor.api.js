import api from "./axios.js";

export const fetchZoneRisk = async () => {
  const { data } = await api.get("/dashboard/zone-risk");
  return data;
};
