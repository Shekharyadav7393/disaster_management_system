import api from "./axios.js";

export const fetchOverview = async () => {
  const { data } = await api.get("/dashboard/overview");
  return data;
};

export const fetchDonorRanking = async (limit = 10) => {
  const { data } = await api.get("/donors/ranking", { params: { limit } });
  return data;
};

export const fetchDonationStats = async () => {
  const { data } = await api.get("/dashboard/donation-stats");
  return data;
};

export const fetchReliefCamps = async () => {
  const { data } = await api.get("/relief-camps");
  return data;
};

export const createDonation = async (payload) => {
  const { data } = await api.post("/donations", payload);
  return data;
};
