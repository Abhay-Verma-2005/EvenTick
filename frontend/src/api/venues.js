import apiClient from "./apiClient";

export const getVenues = async (city = "", state = "") => {
  const params = new URLSearchParams();
  if (city)  params.set("city",  city);
  if (state) params.set("state", state);
  const { data } = await apiClient.get(`/venues?${params.toString()}`);
  return data;
};

export const getMyVenues = async () => {
  const { data } = await apiClient.get("/venues/my-venues");
  return data;
};

export const getVenueById = async (id) => {
  const { data } = await apiClient.get(`/venues/${id}`);
  return data;
};

export const createVenue = async (venueData) => {
  const { data } = await apiClient.post("/venues/create", venueData);
  return data;
};

export const deleteVenue = async (id) => {
  const { data } = await apiClient.delete(`/venues/${id}`);
  return data;
};

export const addVenueReview = async (id, rating, text) => {
  const { data } = await apiClient.post(`/venues/${id}/review`, { rating, text });
  return data;
};
