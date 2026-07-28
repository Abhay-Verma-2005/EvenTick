import axios from "axios";

const eventApi = axios.create({
  baseURL: import.meta.env.VITE_EVENT_API_URL || "http://localhost:6008/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor to attach Bearer token if stored in localStorage
eventApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("eventick_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Fetch recommended events (3-tier: nearby, popular, newest)
export const getRecommendedEvents = async (city = "") => {
  const response = await eventApi.get(`/events/recommended?city=${encodeURIComponent(city)}`);
  return response.data;
};

// Fetch all live events (paginated)
export const getAllEvents = async (page = 1, limit = 12, city = "", category = "") => {
  const params = new URLSearchParams({ page, limit });
  if (city) params.set("city", city);
  if (category) params.set("category", category);
  const response = await eventApi.get(`/events?${params.toString()}`);
  return response.data;
};

// Fetch single event by ID
export const getEventById = async (id) => {
  const response = await eventApi.get(`/events/${id}`);
  return response.data;
};

// Rate an event (1 to 5 stars)
export const rateEvent = async (eventId, rating) => {
  const response = await eventApi.post(`/events/${eventId}/rate`, { rating });
  return response.data;
};

// Toggle like for an event (deprecated)
export const toggleEventLike = async (eventId) => {
  const response = await eventApi.post(`/events/${eventId}/rate`, { rating: 5 });
  return response.data;
};

// Host API calls
export const getHostStats = async () => {
  const response = await eventApi.get("/events/host/stats");
  return response.data;
};

export const getHostEvents = async () => {
  const response = await eventApi.get("/events/host/my-events");
  return response.data;
};

export const uploadBanner = async (base64Image) => {
  const response = await eventApi.post("/events/host/upload-banner", { image: base64Image });
  return response.data;
};

export const createEvent = async (eventData) => {
  const response = await eventApi.post("/events/host/", eventData);
  return response.data;
};

export const updateEvent = async (id, eventData) => {
  const response = await eventApi.patch(`/events/host/${id}`, eventData);
  return response.data;
};

export const deleteEvent = async (id) => {
  const response = await eventApi.delete(`/events/host/${id}`);
  return response.data;
};

// ==========================================
// Booking API
// ==========================================
export const bookTicket = async (eventId, quantity = 1) => {
  const response = await eventApi.post(`/bookings/${eventId}`, { quantity });
  return response.data;
};

export const cancelTicket = async (bookingId) => {
  const response = await eventApi.post(`/bookings/${bookingId}/cancel`);
  return response.data;
};

export const getMyTickets = async () => {
  const response = await eventApi.get("/bookings/my-tickets");
  return response.data;
};

// ==========================================
// Notification API
// ==========================================
export const getMyNotifications = async () => {
  const response = await eventApi.get("/notifications");
  return response.data;
};

export const markNotificationAsRead = async (notificationId) => {
  const response = await eventApi.patch(`/notifications/${notificationId}/read`);
  return response.data;
};

export const searchEventsApi = async (query) => {
  const response = await eventApi.get(`/events/search?q=${encodeURIComponent(query)}`);
  return response.data;
};

// ==========================================
// Feedback API
// ==========================================
export const submitFeedback = async (feedbackData) => {
  const response = await eventApi.post("/feedback", feedbackData);
  return response.data;
};

export const getTopFeedbacks = async () => {
  const response = await eventApi.get("/feedback/top");
  return response.data;
};

export default eventApi;
