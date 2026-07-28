import { useState, useEffect, useRef } from "react";
import {
  FaCrown,
  FaPlus,
  FaUsers,
  FaHeart,
  FaCalendarAlt,
  FaCheckCircle,
  FaEdit,
  FaTrash,
  FaMapMarkerAlt,
  FaTimes,
  FaClock,
  FaPaperPlane,
  FaMagic,
  FaSpinner,
  FaTicketAlt,
  FaStar
} from "react-icons/fa";
import Navbar from "../components/Navbar";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import {
  getHostStats,
  getHostEvents,
  createEvent,
  updateEvent,
  deleteEvent,
} from "../api/eventApi";
import "../styles/eventOwnerDashboard.css";

const CATEGORIES = [
  "concert",
  "conference",
  "workshop",
  "sports",
  "comedy",
  "theater",
  "festival",
  "meetup",
  "other",
];

// Helper to compress image client-side to prevent large base64 network timeouts
const compressImage = (file, maxWidth = 900, maxHeight = 900, quality = 0.75) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL("image/jpeg", quality);
        resolve(dataUrl);
      };
      img.onerror = () => resolve(event.target.result);
      img.src = event.target.result;
    };
    reader.onerror = () => resolve("");
    reader.readAsDataURL(file);
  });
};

const EventOwnerDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalEvents: 0,
    activeEvents: 0,
    totalLikes: 0,
    totalActiveUsers: 0,
  });
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [isEnhancing, setIsEnhancing] = useState(false);

  // Form State with Dual Image Upload (Poster & Flex)
  const [formData, setFormData] = useState({
    title: "",
    category: "concert",
    description: "",
    posterImage: "", // base64
    posterUrl: "",   // preview or url
    flexImage: "",   // base64
    flexUrl: "",     // preview or url
    date: "",
    time: "07:00 PM",
    venue: "",
    city: "",
    price: 499,
    totalSeats: 100,
    status: "live",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [allCities, setAllCities] = useState([]);
  const [attendeesFilterEventId, setAttendeesFilterEventId] = useState("all");
  const [isRelaunch, setIsRelaunch] = useState(false);

  const isEventPassed = (dateStr) => {
    if (!dateStr) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const eventDate = new Date(dateStr);
    return eventDate < today;
  };
  const [likesFilterEventId, setLikesFilterEventId] = useState("all");

  useEffect(() => {
    axios
      .post("https://countriesnow.space/api/v0.1/countries/cities", { country: "India" })
      .then((response) => {
        if (!response.data.error) {
          setAllCities(response.data.data);
        }
      })
      .catch((err) => console.error("Error fetching cities:", err));
  }, []);
  const posterInputRef = useRef(null);
  const flexInputRef = useRef(null);

  const formattedName = user?.firstName
    ? `${user.firstName.charAt(0).toUpperCase()}${user.firstName.slice(1).toLowerCase()} ${user.lastName ? user.lastName.charAt(0).toUpperCase() + user.lastName.slice(1).toLowerCase() : ""}`.trim()
    : "Event Host";

  const handleEnhanceDescription = async () => {
    if (!formData.title || !formData.date || !formData.city) {
      setError("Please fill out Title, Date, and City first so AI has context!");
      return;
    }
    try {
      setIsEnhancing(true);
      setError("");
      
      const token = localStorage.getItem("eventick_token");
      const res = await axios.post(
        `${import.meta.env.VITE_AI_API_URL}/description`,
        {
          title: formData.title,
          date: formData.date,
          venue: formData.city + (formData.venue ? ` (${formData.venue})` : ""),
          description: formData.description
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (res.data.success && res.data.description) {
        setFormData({ ...formData, description: res.data.description });
      }
    } catch (err) {
      console.error("AI Enhance failed:", err);
      setError("Failed to enhance description with AI.");
    } finally {
      setIsEnhancing(false);
    }
  };

  // Fetch Host Data
  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, eventsRes] = await Promise.allSettled([
        getHostStats(),
        getHostEvents(),
      ]);
      if (statsRes.status === "fulfilled" && statsRes.value?.data) {
        setStats(statsRes.value.data);
      }
      if (eventsRes.status === "fulfilled" && eventsRes.value?.data) {
        setEvents(eventsRes.value.data);
      }
    } catch (err) {
      console.error("Failed to load host dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreateDrawer = () => {
    setEditingEvent(null);
    setIsRelaunch(false);
    setFormData({
      title: "",
      category: "concert",
      description: "",
      posterImage: "",
      posterUrl: "",
      flexImage: "",
      flexUrl: "",
      date: "2026-07-25",
      time: "07:00 PM",
      venue: "",
      city: user?.city || "",
      price: 499,
      totalSeats: 100,
      status: "live",
    });
    setError("");
    setDrawerOpen(true);
  };

  const openEditDrawer = (event) => {
    setEditingEvent(event);
    setIsRelaunch(false);
    setFormData({
      title: event.title || "",
      category: event.category || "concert",
      description: event.description || "",
      posterImage: "",
      posterUrl: event.posterUrl || event.imageUrl || "",
      flexImage: "",
      flexUrl: event.flexUrl || "",
      date: event.date ? new Date(event.date).toISOString().split("T")[0] : "",
      time: event.time || "07:00 PM",
      venue: event.venue || "",
      city: event.city || "",
      price: event.price || 0,
      totalSeats: event.totalSeats || 100,
      status: event.status || "live",
    });
    setError("");
    setDrawerOpen(true);
  };

  const openRelaunchDrawer = (event) => {
    setEditingEvent(event);
    setIsRelaunch(true);
    setFormData({
      title: event.title || "",
      category: event.category || "concert",
      description: event.description || "",
      posterImage: "",
      posterUrl: event.posterUrl || event.imageUrl || "",
      flexImage: "",
      flexUrl: event.flexUrl || "",
      date: "", // Reset date for re-launch
      time: event.time || "07:00 PM",
      venue: event.venue || "",
      city: event.city || "",
      price: event.price || 0,
      totalSeats: event.totalSeats || 100,
      status: "live",
    });
    setError("");
    setDrawerOpen(true);
  };

  // Handle Poster file selection with client-side canvas compression
  const handlePosterChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const compressedBase64 = await compressImage(file, 600, 600, 0.65);
      setFormData((prev) => ({
        ...prev,
        posterImage: compressedBase64,
        posterUrl: compressedBase64,
      }));
      setError("");
    } catch (err) {
      console.error("Poster processing error:", err);
    }
  };

  // Handle Flex file selection with client-side canvas compression
  const handleFlexChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const compressedBase64 = await compressImage(file, 900, 450, 0.65);
      setFormData((prev) => ({
        ...prev,
        flexImage: compressedBase64,
        flexUrl: compressedBase64,
      }));
      setError("");
    } catch (err) {
      console.error("Flex processing error:", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.date || !formData.city) {
      setError("Please fill out all required fields (title, date, city).");
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      const payload = {
        title: formData.title,
        category: formData.category,
        description: formData.description,
        posterImage: formData.posterImage,
        posterUrl: formData.posterUrl,
        flexImage: formData.flexImage,
        flexUrl: formData.flexUrl,
        date: formData.date,
        time: formData.time,
        venue: formData.venue,
        city: formData.city,
        price: formData.price,
        totalSeats: formData.totalSeats,
        status: formData.status,
        hostName: `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "Event Host",
      };

      if (editingEvent) {
        if (isRelaunch) {
          await createEvent(payload);
          await deleteEvent(editingEvent._id);
        } else {
          await updateEvent(editingEvent._id, payload);
        }
      } else {
        await createEvent(payload);
      }

      setDrawerOpen(false);
      fetchData();
    } catch (err) {
      console.error("Publish error:", err);
      const serverMsg = err.response?.data?.message || err.message || "Network Error: Please check if event service is running.";
      setError(serverMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (eventId) => {
    if (window.confirm("Are you sure you want to remove this event?")) {
      try {
        await deleteEvent(eventId);
        fetchData();
      } catch (err) {
        alert(err.response?.data?.message || "Failed to delete event.");
      }
    }
  };

  const filteredEvents = statusFilter === "all"
    ? events
    : events.filter((e) => e.status === statusFilter);

  let displayActiveUsers = stats.totalActiveUsers;
  let displayTotalLikes = stats.totalLikes;
  let displayAvgRating = stats.avgRating;
  let displayTotalRatings = stats.totalRatings;

  if (attendeesFilterEventId !== "all") {
    const ev = events.find((e) => e._id === attendeesFilterEventId);
    if (ev) {
      displayActiveUsers = (ev.totalSeats || 0) - (ev.availableSeats || 0);
      displayTotalLikes = ev.likes?.length || 0;
      displayAvgRating = ev.rating || 0;
      displayTotalRatings = ev.ratingCount || 0;
    }
  }

  return (
    <div className="host-dashboard light-page">
      <Navbar />

      <div className="host-dash-container">
        {/* Top Hero Banner */}
        <div className="host-hero-card">
          <div className="host-hero-left">
            <div className="host-hero-icon-3d">
              <img src="/calander-svg.png" alt="Calendar" className="host-hero-3d-img" />
            </div>
            <div className="host-hero-content">
              <h1>
                Welcome, {formattedName}!{" "}
                <span className="host-crown-badge-pill">
                  <FaCrown /> Event Host Portal
                </span>
              </h1>
              <p className="host-hero-subtitle">
                Manage your listed events, track real-time attendee statistics, and publish new experiences.
              </p>
            </div>
          </div>

          <button className="host-hero-create-btn" onClick={openCreateDrawer}>
            <FaPlus /> Create New Event
          </button>
        </div>

        {/* Stats Row Header with Global Filter */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: "700", color: "#1e293b", margin: 0 }}>Dashboard Overview</h2>
          <select
            value={attendeesFilterEventId}
            onChange={(e) => setAttendeesFilterEventId(e.target.value)}
            style={{ 
              padding: "6px 12px", 
              borderRadius: "8px", 
              border: "1px solid #cbd5e1", 
              background: "#ffffff", 
              color: "#334155", 
              fontSize: "13px", 
              fontWeight: "600",
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(0,0,0,0.04)"
            }}
          >
            <option value="all">All Events Overview</option>
            {events.map((ev) => {
              const t = ev.title || "Untitled";
              return (
                <option key={ev._id} value={ev._id}>{t.length > 20 ? t.substring(0, 20) + "..." : t}</option>
              );
            })}
          </select>
        </div>

        {/* 4 Stat Cards Row */}
        <div className="host-stats-row">
          <div className="host-stat-box">
            <div className="host-stat-icon-wrapper blue">
              <FaUsers />
            </div>
            <div className="host-stat-details">
              <span className="host-stat-num">{displayActiveUsers}</span>
              <span className="host-stat-lbl">Active Attendees</span>
            </div>
          </div>

          <div className="host-stat-box">
            <div className="host-stat-icon-wrapper pink" style={{ background: '#fef3c7', color: '#f59e0b' }}>
              <FaStar />
            </div>
            <div className="host-stat-details">
              <span className="host-stat-num">{displayAvgRating ? `${typeof displayAvgRating === 'number' ? displayAvgRating.toFixed(1) : displayAvgRating} ★` : '0.0 ★'}</span>
              <span className="host-stat-lbl">Average Rating ({displayTotalRatings || 0} reviews)</span>
            </div>
          </div>

          <div className="host-stat-box">
            <div className="host-stat-icon-wrapper orange">
              <FaCalendarAlt />
            </div>
            <div className="host-stat-details">
              <span className="host-stat-num">{stats.totalEvents}</span>
              <span className="host-stat-lbl">Events Created</span>
            </div>
          </div>

          <div className="host-stat-box">
            <div className="host-stat-icon-wrapper green">
              <FaCheckCircle />
            </div>
            <div className="host-stat-details">
              <span className="host-stat-num">{stats.activeEvents}</span>
              <span className="host-stat-lbl">Active Live Events</span>
            </div>
          </div>
        </div>

        {/* My Listed Events Section */}
        <div className="host-events-container">
          <div className="host-events-topbar">
            <h2>My Listed Events</h2>
            <div className="host-filter-pills">
              {["all", "live", "completed"].map((st) => (
                <button
                  key={st}
                  className={`host-pill-btn ${statusFilter === st ? "active" : ""}`}
                  onClick={() => setStatusFilter(st)}
                >
                  {st === "all" ? "All" : st.charAt(0).toUpperCase() + st.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
              Loading listed events...
            </div>
          ) : filteredEvents.length > 0 ? (
            <div className="host-events-cards-grid">
              {filteredEvents.map((event) => (
                <div className="host-card-item" key={event._id}>
                  <div className="host-card-image-wrap">
                    <img src={event.posterUrl || event.imageUrl} alt={event.title} />
                    <span className={`host-card-badge ${event.status}`}>
                      {event.status}
                    </span>
                    <span className="host-card-price-tag">
                      {event.price === 0 ? "FREE" : `₹${event.price}`}
                    </span>
                  </div>

                  <div className="host-card-body-content">
                    <span className="host-card-title-text">{event.title || "Untitled Event"}</span>
                    <div className="host-card-sub-detail">
                      <FaMapMarkerAlt /> {event.city ? String(event.city).toUpperCase() : "N/A"} · {event.venue || "Venue TBD"}
                    </div>
                    <div className="host-card-sub-detail">
                      <FaClock /> {event.date && !isNaN(new Date(event.date).getTime()) ? new Date(event.date).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" }) : "Date TBD"} at {event.time || "07:00 PM"}
                    </div>
                    <div className="host-card-sub-detail" style={{ fontWeight: '600', color: '#10b981', marginTop: '4px' }}>
                      <FaTicketAlt /> Sold: {(event.totalSeats || 0) - (event.availableSeats || 0)} / {event.totalSeats || 0}
                    </div>
                  </div>

                  <div className="host-card-footer-bar">
                    {isEventPassed(event.date) ? (
                      <button
                        className="host-card-action-btn edit"
                        style={{ color: '#f59e0b', borderColor: '#fef3c7', background: '#fffbeb' }}
                        onClick={() => openRelaunchDrawer(event)}
                      >
                        <FaMagic /> Re-Launch
                      </button>
                    ) : (
                      <button
                        className="host-card-action-btn edit"
                        onClick={() => openEditDrawer(event)}
                      >
                        <FaEdit /> Edit Event
                      </button>
                    )}
                    <button
                      className="host-card-action-btn delete"
                      onClick={() => handleDelete(event._id)}
                    >
                      <FaTrash /> Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="host-empty-illustration-box">
              <img src="/no-event.png" alt="No events" className="host-empty-3d-img" />
              <h3>No events found</h3>
              <p>
                Looks like you haven't listed any events yet.
                <br />
                Click the button above to create your first event on EvenTick.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Right-Side Curved Floating Drawer Panel */}
      {drawerOpen && (
        <div className="host-drawer-backdrop" onClick={() => setDrawerOpen(false)}>
          <div className="host-drawer-panel" onClick={(e) => e.stopPropagation()}>
            <div className="host-drawer-header">
              <h3 className="host-drawer-title">
                {editingEvent ? (isRelaunch ? "Re-Launch Event" : "Edit Event") : "Create New Event"}
              </h3>
              <p>{editingEvent ? (isRelaunch ? "Launch a new edition of this event" : "Update your event details") : "Fill in the details to publish your event."}</p>
              <button
                className="host-drawer-close-btn"
                onClick={() => setDrawerOpen(false)}
              >
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="host-drawer-body">
              {error && (
                <div style={{ color: "#dc2626", fontSize: "13px", fontWeight: "600" }}>
                  {error}
                </div>
              )}

              {/* EVENT TITLE */}
              <div className="host-drawer-form-group">
                <label className="host-drawer-label">EVENT TITLE *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Live Music Concert"
                  className="host-drawer-input"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              {/* CATEGORY & CITY */}
              <div className="host-drawer-form-row">
                <div className="host-drawer-form-group">
                  <label className="host-drawer-label">CATEGORY *</label>
                  <select
                    className="host-drawer-select"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="host-drawer-form-group">
                  <label className="host-drawer-label">CITY *</label>
                  <input
                    type="text"
                    required
                    list="event-city-datalist"
                    placeholder="e.g. Mumbai, Delhi, Pune"
                    className="host-drawer-input"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  />
                  <datalist id="event-city-datalist">
                    {allCities.map((city, idx) => (
                      <option key={idx} value={city} />
                    ))}
                  </datalist>
                </div>
              </div>

              {/* MEDIA & DATE/TIME ROW */}
              <div className="host-drawer-form-row" style={{ alignItems: "flex-start" }}>
                
                {/* LEFT: MEDIA UPLOADS */}
                <div className="host-drawer-form-group" style={{ flex: 1, marginBottom: 0 }}>
                  <label className="host-drawer-label">EVENT MEDIA (POSTER & FLEX)</label>
                  
                  <input
                    type="file"
                    ref={posterInputRef}
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={handlePosterChange}
                  />

                  <input
                    type="file"
                    ref={flexInputRef}
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={handleFlexChange}
                  />

                  <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    {/* 1. POSTER UPLOAD */}
                    {formData.posterUrl ? (
                      <div
                        className="host-upload-preview-box"
                        onClick={() => posterInputRef.current?.click()}
                        style={{ minHeight: "80px", height: "80px" }}
                      >
                        <img src={formData.posterUrl} alt="Poster Preview" style={{ objectFit: "cover" }} />
                        <div className="host-preview-overlay">Change Poster</div>
                      </div>
                    ) : (
                      <div
                        className="host-dotted-upload-box"
                        onClick={() => posterInputRef.current?.click()}
                        style={{ minHeight: "80px", padding: "10px" }}
                      >
                        <div className="host-plus-circle-icon" style={{ width: "28px", height: "28px", marginBottom: "4px", fontSize: "14px" }}><FaPlus /></div>
                        <div className="host-dotted-title">Upload Poster (Grid View)</div>
                      </div>
                    )}

                    {/* 2. FLEX UPLOAD */}
                    {formData.flexUrl ? (
                      <div
                        className="host-upload-preview-box"
                        onClick={() => flexInputRef.current?.click()}
                        style={{ minHeight: "80px", height: "80px" }}
                      >
                        <img src={formData.flexUrl} alt="Flex Banner Preview" style={{ objectFit: "cover" }} />
                        <div className="host-preview-overlay">Change Flex</div>
                      </div>
                    ) : (
                      <div
                        className="host-dotted-upload-box"
                        onClick={() => flexInputRef.current?.click()}
                        style={{ minHeight: "80px", padding: "10px" }}
                      >
                        <div className="host-plus-circle-icon" style={{ width: "28px", height: "28px", marginBottom: "4px", fontSize: "14px" }}><FaPlus /></div>
                        <div className="host-dotted-title">Upload Flex (Banner View)</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* RIGHT: DATE & TIME */}
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div className="host-drawer-form-group" style={{ marginBottom: 0 }}>
                    <label className="host-drawer-label">DATE *</label>
                    <input
                      type="date"
                      required
                      min={new Date().toISOString().split("T")[0]}
                      className="host-drawer-input"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    />
                  </div>

                  <div className="host-drawer-form-group" style={{ marginBottom: 0 }}>
                    <label className="host-drawer-label">TIME *</label>
                    <input
                      type="text"
                      placeholder="07:00 PM"
                      className="host-drawer-input"
                      value={formData.time}
                      onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* VENUE */}
              <div className="host-drawer-form-group">
                <label className="host-drawer-label">VENUE *</label>
                <input
                  type="text"
                  placeholder="e.g. JLN Stadium"
                  className="host-drawer-input"
                  value={formData.venue}
                  onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                />
              </div>

              {/* PRICE & SEATS */}
              <div className="host-drawer-form-row">
                <div className="host-drawer-form-group">
                  <label className="host-drawer-label">PRICE (₹) *</label>
                  <input
                    type="number"
                    min="0"
                    className="host-drawer-input"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  />
                </div>

                <div className="host-drawer-form-group">
                  <label className="host-drawer-label">TOTAL CAPACITY / SEATS *</label>
                  <input
                    type="number"
                    min="1"
                    className="host-drawer-input"
                    value={formData.totalSeats}
                    onChange={(e) => setFormData({ ...formData, totalSeats: e.target.value })}
                  />
                </div>
              </div>

              {/* DESCRIPTION */}
              <div className="host-drawer-form-group">
                <div style={{ position: "relative", width: "100%" }}>
                  {/* Inner top bar: label + counter + AI button — all inside the box */}
                  <div style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    zIndex: 5,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 12px 8px 14px",
                    borderBottom: "1px solid #e2e8f0",
                    background: "linear-gradient(to bottom, #f8f7ff 80%, rgba(248,247,255,0))",
                    borderRadius: "14px 14px 0 0",
                    pointerEvents: "none"
                  }}>
                    <label className="host-drawer-label" style={{ margin: 0, pointerEvents: "none" }}>DESCRIPTION *</label>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", pointerEvents: "auto" }}>
                      <span style={{ fontSize: "11px", fontWeight: "600", color: "#94a3b8" }}>
                        {formData.description.length}/500
                      </span>
                      <button
                        type="button"
                        onClick={handleEnhanceDescription}
                        disabled={isEnhancing}
                        style={{
                          background: "linear-gradient(135deg, #7c3aed 0%, #a855f7 50%, #d946ef 100%)",
                          color: "#ffffff",
                          border: "none",
                          borderRadius: "20px",
                          padding: "6px 14px",
                          fontSize: "12px",
                          fontWeight: "700",
                          cursor: isEnhancing ? "not-allowed" : "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          boxShadow: "0 4px 14px rgba(124, 58, 237, 0.35)",
                          transition: "all 0.2s ease"
                        }}
                      >
                        {isEnhancing ? (
                          <><FaSpinner style={{ animation: "spin 1s linear infinite" }} /> Enhancing...</>
                        ) : (
                          <><FaMagic style={{ color: "#fef08a" }} /> Enhance with Eventick AI</>
                        )}
                      </button>
                    </div>
                  </div>

                  <textarea
                    rows="12"
                    maxLength="500"
                    placeholder="Describe your event details..."
                    className="host-drawer-textarea"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    style={{
                      paddingTop: "52px",
                      minHeight: "240px",
                      maxHeight: "280px",
                      overflowY: "auto",
                      resize: "none",
                      lineHeight: "1.6",
                      fontSize: "14px"
                    }}
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="host-drawer-submit-btn"
                disabled={submitting}
              >
                <FaPaperPlane /> {submitting ? "Publishing..." : editingEvent ? (isRelaunch ? "Re-Launch Event" : "Update Event") : "Publish Event"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventOwnerDashboard;
