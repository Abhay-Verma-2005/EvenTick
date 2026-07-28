import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "react-router-dom";
import {
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaStar,
  FaRegStar,
  FaUserCircle,
  FaChevronLeft,
  FaChevronRight,
  FaFire,
  FaCompass,
  FaBolt,
  FaTheaterMasks,
  FaHeart,
  FaRegHeart,
  FaTicketAlt,
  FaClock,
  FaChevronDown
} from "react-icons/fa";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import { getRecommendedEvents, getAllEvents, rateEvent, bookTicket } from "../api/eventApi";
import axios from "axios";
import "../styles/userDashboard.css";

// ——— Date Formatter ———
const formatDate = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
};

// ——— Price Formatter ———
const formatPrice = (price) => {
  if (!price || price === 0) return "FREE";
  return `₹${price.toLocaleString("en-IN")}`;
};

// ——— Category Display Names ———
const CATEGORIES = [
  { key: "", label: "All" },
  { key: "concert", label: "Concerts" },
  { key: "conference", label: "Conferences" },
  { key: "workshop", label: "Workshops" },
  { key: "sports", label: "Sports" },
  { key: "comedy", label: "Comedy" },
  { key: "theater", label: "Theater" },
  { key: "festival", label: "Festivals" },
  { key: "meetup", label: "Meetups" },
];

// =====================================================
// USER DASHBOARD PAGE
// =====================================================
const UserDashboard = () => {
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState([]);
  const [nearByEvents, setNearByEvents] = useState([]);
  const [newestEvents, setNewestEvents] = useState([]);
  const [allEvents, setAllEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const observerRef = useRef(null);

  
  const location = useLocation();

  // Highlight and scroll to searched event
  useEffect(() => {
    if (!loading && allEvents.length > 0) {
      const searchParams = new URLSearchParams(location.search);
      const eventId = searchParams.get("eventId");
      if (eventId) {
        // Wait a small tick to ensure DOM is fully rendered
        setTimeout(() => {
          const el = document.getElementById(`event-card-${eventId}`);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el.style.transition = 'box-shadow 0.3s ease';
            el.style.boxShadow = '0 0 0 4px rgba(124, 58, 237, 0.6)';
            el.style.borderRadius = '16px';
            setTimeout(() => {
              el.style.boxShadow = '';
            }, 3000);
          } else {
            // Event not in current view, we might need to load more, 
            // but for simplicity just scroll to all events section
            window.location.hash = "#all-events";
          }
        }, 300);
      }
    }
  }, [location.search, loading, allEvents.length]);

  const userCity = user?.city || "";
  const formattedName = user?.firstName
    ? user.firstName.charAt(0).toUpperCase() + user.firstName.slice(1).toLowerCase()
    : "User";

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [recData, eventsData] = await Promise.all([
          getRecommendedEvents(userCity),
          getAllEvents(1, 24),
        ]);
        console.log("REC_DATA:", recData); setRecommendations(recData?.data?.top5 || []);
        setNearByEvents(recData?.data?.nearByEvents || []);
        setNewestEvents(recData?.data?.newestEvents || []);
        setAllEvents(eventsData?.data || []);
        setHasMore((eventsData?.data?.length || 0) === 24);
      } catch (err) {
        console.error("Failed to fetch events:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [userCity]);

  // Infinite scroll load more
  const loadMoreEvents = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const res = await getAllEvents(nextPage, 24);
      setAllEvents((prev) => [...prev, ...res.data]);
      setHasMore(res.data.length === 24);
      setPage(nextPage);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMore(false);
    }
  }, [page, hasMore, loadingMore]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMoreEvents();
        }
      },
      { threshold: 0.1 }
    );
    if (observerRef.current) observer.observe(observerRef.current);
    return () => observer.disconnect();
  }, [loadMoreEvents]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const scrollToId = params.get("scrollTo");
    if (scrollToId && allEvents.length > 0) {
      setTimeout(() => {
        const el = document.getElementById(`event-card-${scrollToId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.style.transition = 'box-shadow 0.3s ease';
          el.style.boxShadow = '0 0 0 4px rgba(124, 58, 237, 0.6)';
          el.style.borderRadius = '16px';
          setTimeout(() => {
            el.style.boxShadow = '';
            // Remove from URL so it doesn't trigger on every re-render
            window.history.replaceState({}, document.title, window.location.pathname);
          }, 2000);
        }
      }, 500); // Wait for render
    }
  }, [allEvents]);


  // Filter events by category
  const filteredEvents = activeCategory
    ? (allEvents || []).filter((e) => e.category === activeCategory)
    : (allEvents || []);

  if (loading) {
    return (
      <div className="user-dashboard light-page">
        <Navbar />
        <div className="dash-loading">
          <div className="dash-spinner" />
        </div>
      </div>
    );
  }

  return (
    <div className="user-dashboard light-page">
      <Navbar />

      {/* ——— Luxury Profile Header ——— */}
      <div className="dash-profile-header" style={{
        background: '#fff',
        borderBottom: '1px solid #efefef',
        padding: '32px 40px 24px',
        display: 'flex',
        alignItems: 'center',
        gap: '20px',
        maxWidth: '1360px',
        margin: '0 auto',
      }}>
        <div className="dash-profile-avatar">
          {user?.photoUrl && user.photoUrl !== "https://geographyandyou.com/images/user-profile.png" ? (
            <img src={user.photoUrl} alt={formattedName} />
          ) : (
            <FaUserCircle className="dash-profile-avatar-icon" />
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span style={{
            fontFamily: 'var(--font-accent)',
            fontSize: '14px',
            fontWeight: '400',
            color: '#8e8e8e',
            letterSpacing: '0.5px',
          }}>
            Namaste,
          </span>
          <span style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '26px',
            fontWeight: '700',
            color: '#0f172a',
            letterSpacing: '-0.5px',
            lineHeight: '1.2',
          }}>
            {formattedName}
          </span>
          {userCity && (
            <span className="dash-profile-city" style={{ marginTop: '2px' }}>
              <FaMapMarkerAlt /> {userCity.charAt(0).toUpperCase() + userCity.slice(1)}
            </span>
          )}
        </div>

        {/* Right Side: Eventick Tagline & Date */}
        <div style={{ marginLeft: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
          <span style={{
            fontFamily: 'var(--font-accent)',
            fontSize: '24px',
            fontWeight: '600',
            color: '#0f172a',
            letterSpacing: '0.5px'
          }}>
            Eventick — it all starts here.
          </span>
          <span style={{
            fontFamily: 'var(--font-body)',
            fontSize: '12px',
            fontWeight: '600',
            color: '#64748b',
            textTransform: 'uppercase',
            letterSpacing: '1.5px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <FaClock style={{ fontSize: '11px', color: '#94a3b8' }} /> 
            {new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' })} <span style={{ color: '#cbd5e1' }}>|</span> {new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
          </span>
        </div>
      </div>

      {/* Hero Banner Carousel */}
      {(recommendations?.length || 0) > 0 ? (
        <HeroBanner events={recommendations} />
      ) : null}

      {/* ——— Tagline Divider Strip ——— */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '20px',
        maxWidth: '1360px',
        margin: '36px auto 28px',
        padding: '0 40px',
      }}>
        <div style={{ flex: 1, height: '1px', background: 'linear-gradient(to right, transparent, #d4d4d8)' }} />
        <span style={{
          fontFamily: 'var(--font-accent)',
          fontSize: '20px',
          fontWeight: '500',
          color: '#525252',
          letterSpacing: '0.5px',
          whiteSpace: 'nowrap',
        }}>
          where every moment becomes an event
        </span>
        <div style={{ flex: 1, height: '1px', background: 'linear-gradient(to left, transparent, #d4d4d8)' }} />
      </div>

      {/* Split Sections: Near By and Newest */}
      <div className="dash-split-sections">
        {(nearByEvents?.length || 0) > 0 && (
          <RecommendationSection
            title="Near By you"
            icon={<FaMapMarkerAlt />}
            events={nearByEvents}
            showViewAll={false}
          />
        )}

        {(newestEvents?.length || 0) > 0 && (
          <RecommendationSection
            title="Newest"
            icon={<FaBolt />}
            events={newestEvents}
            showViewAll={false}
          />
        )}
      </div>

      {/* Categories Bar */}
      <div className="dash-categories-bar" style={{ marginTop: '16px', marginBottom: '0', padding: '0 32px' }}>
        {CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            className={`dash-filter-btn ${activeCategory === cat.key ? "active" : ""}`}
            onClick={() => setActiveCategory(cat.key)}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* All Events Grid */}
      <div className="dash-grid-section" id="all-events">
        <div className="dash-grid-header">
          <h2 className="dash-grid-title">All Live Events</h2>
        </div>

        {filteredEvents.length > 0 ? (
          <div className="dash-events-grid">
            {filteredEvents.map((event) => (
              <EventGridCard key={event._id} event={event} />
            ))}
          </div>
        ) : (
          <div className="dash-empty">
            <FaTheaterMasks />
            <p>
              {allEvents.length === 0
                ? "No live events listed yet. Check back soon or register as an Event Host to publish the first event!"
                : "No events found in this category."}
            </p>
          </div>
        )}

        {hasMore && (
          <div ref={observerRef} className="dash-loading-more" style={{ textAlign: "center", padding: "40px 0" }}>
            <div className="dash-spinner" style={{ width: "30px", height: "30px", margin: "0 auto" }} />
          </div>
        )}
      </div>
    </div>
  );
};

// =====================================================
// HERO BANNER CAROUSEL
// =====================================================
const HeroBanner = ({ events }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
  const goTo = (index) => setCurrentIndex(index);
  const [taglines, setTaglines] = useState({});
  const intervalRef = useRef(null);

  useEffect(() => {
    const currentEvent = events[currentIndex];
    if (!currentEvent || taglines[currentEvent._id]) return;

    const fetchTagline = async () => {
      try {
        const token = localStorage.getItem("eventick_token");
        const res = await axios.post(
          `${import.meta.env.VITE_AI_API_URL }/tagline`,
          { 
            eventTitle: currentEvent.title, 
            eventCategory: currentEvent.category,
            description: currentEvent.description || currentEvent.about || ""
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setTaglines((prev) => ({ ...prev, [currentEvent._id]: res.data.tagline }));
      } catch (err) {
        console.error(err);
      }
    };
    fetchTagline();
  }, [currentIndex, events, taglines]);

  const startAutoSlide = useCallback(() => {
    intervalRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % events.length);
    }, 4500);
  }, [events.length]);

  useEffect(() => {
    if (events.length > 1) startAutoSlide();
    return () => clearInterval(intervalRef.current);
  }, [events.length, startAutoSlide]);

  
  const goNext = () => goTo((currentIndex + 1) % events.length);
  const goPrev = () => goTo((currentIndex - 1 + events.length) % events.length);

  return (
    <div className="dash-hero-banner">
      {events.length > 1 && (
        <>
          <button className="dash-hero-arrow left" onClick={goPrev}><FaChevronLeft /></button>
          <button className="dash-hero-arrow right" onClick={goNext}><FaChevronRight /></button>
        </>
      )}

      <div className="dash-hero-track" style={{ transform: `translateX(-${currentIndex * 100}%)` }}>
        {events.map((event) => (
          <div className="dash-hero-slide" key={event._id}>
            <img src={event.flexUrl || event.posterUrl || event.imageUrl} alt={event.title} />
            
            {/* Split Overlay */}
            <div className="dash-hero-split-overlay">
              
              {/* Left Side: Headline, Subtitle, Explore Button */}
              <div className="dash-hero-split-left" style={{ gap: '16px', maxWidth: '55%' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0px' }}>
                  <h1 style={{
                    fontFamily: 'var(--font-heading)',
                    fontWeight: '700',
                    fontSize: 'clamp(30px, 3.8vw, 48px)',
                    lineHeight: '1.15',
                    margin: 0,
                    color: '#ffffff',
                    letterSpacing: '-0.5px',
                    textShadow: '0 4px 20px rgba(0, 0, 0, 0.6)',
                  }}>
                    {event.catchyLine || taglines[event._id] || "Unleashes the Frenzy"}
                  </h1>
                </div>
                
                <p style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '15px',
                  fontWeight: '400',
                  color: 'rgba(255, 255, 255, 0.85)',
                  margin: '6px 0 10px 0',
                  lineHeight: '1.5',
                  maxWidth: '85%',
                }}>
                  Find the best events, concerts, workshops and experiences around you.
                </p>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <button style={{
                    background: '#8b5cf6',
                    border: 'none',
                    color: '#ffffff',
                    borderRadius: '8px',
                    padding: '12px 24px',
                    fontFamily: 'var(--font-body)',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 4px 14px rgba(139, 92, 246, 0.4)'
                  }} onClick={() => window.location.href="#all-events"}>
                    Explore Events <span>&rarr;</span>
                  </button>
                </div>
              </div>

              {/* Right Side: Floating Event Card */}
              <div className="dash-hero-split-right">
                <div className="dash-hero-floating-card">
                  <div className="dash-hero-fc-header" style={{ color: '#ffffff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ color: '#ffffff', fontSize: '16px', lineHeight: 1 }}>•</span>
                    <span style={{ color: '#ffffff', fontWeight: '700', letterSpacing: '1px', fontSize: '11px' }}>NEXT UP</span>
                  </div>
                  <h3 style={{ 
                    fontFamily: 'var(--font-heading)', 
                    fontWeight: '700', 
                    fontSize: '22px',
                    color: '#ffffff',
                    letterSpacing: '0px',
                    margin: '6px 0 6px 0'
                  }}>
                    {event.title.length > 20 ? event.title.substring(0, 20) + "..." : event.title}
                  </h3>
                  <p className="dash-hero-fc-meta" style={{ marginBottom: '4px' }}>
                    <FaCalendarAlt /> {formatDate(event.date)} &middot; {event.city?.charAt(0).toUpperCase() + event.city?.slice(1)}
                  </p>
                  <p style={{ margin: '0 0 14px 0', fontSize: '13px', color: 'rgba(255,255,255,0.85)', fontWeight: '500' }}>
                    From {formatPrice(event.price)}
                  </p>
                  <BookActionRow event={event} />
                </div>
              </div>

            </div>
          </div>
        ))}
      </div>

      {events.length > 1 && (
        <div className="dash-hero-dots">
          {events.map((_, i) => (
            <button
              key={i}
              className={`dash-hero-dot ${i === currentIndex ? "active" : ""}`}
              onClick={() => goTo(i)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// =====================================================
// RECOMMENDATION SECTION (Horizontal Scroll)
// =====================================================
const RecommendationSection = ({ title, icon, events, showViewAll }) => {
  return (
    <div className="dash-section dash-split-section-inner">
      <div className="dash-section-header">
        <h2 className="dash-section-title">{icon} {title}</h2>
        {showViewAll && <a href="#all-events" className="dash-view-all">View all</a>}
      </div>
      <div className="dash-split-grid">
        {events.map((event) => (
          <RecCard key={event._id} event={event} />
        ))}
      </div>
    </div>
  );
};

// ——— Inline Expanding Star Rating Component ———
const InlineStarRating = ({ event, initialRating, initialRatingCount, onRatingUpdated, showCount = false }) => {
  const { user } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null); // 'success' | 'error' | null
  const [rating, setRating] = useState(initialRating || 0);
  const [ratingCount, setRatingCount] = useState(initialRatingCount || 0);
  
  const containerRef = useRef(null);

  // Sync with initial props in case they change
  useEffect(() => {
    setRating(initialRating || 0);
    setRatingCount(initialRatingCount || 0);
  }, [initialRating, initialRatingCount]);

  // Click outside handler to collapse
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsExpanded(false);
        setSubmitStatus(null);
      }
    };
    if (isExpanded) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isExpanded]);

  const handleButtonClick = (e) => {
    e.stopPropagation();
    if (!isExpanded) {
      setIsExpanded(true);
    }
  };

  const handleRate = async (e, score) => {
    e.stopPropagation();
    if (!user) {
      alert("Please login to rate events!");
      return;
    }
    setIsSubmitting(true);
    setSubmitStatus(null);
    try {
      const res = await rateEvent(event._id, score);
      setRating(res.rating);
      setRatingCount(res.ratingCount);
      if (onRatingUpdated) {
        onRatingUpdated(event._id, res.rating, res.ratingCount);
      }
      setSubmitStatus('success');
      setIsSubmitting(false);
      // Auto collapse after success
      setTimeout(() => {
        setIsExpanded(false);
        setSubmitStatus(null);
      }, 1500);
    } catch (err) {
      console.error("Failed to rate event:", err);
      setSubmitStatus('error');
      setIsSubmitting(false);
    }
  };

  const activeStarColor = '#f59e0b';
  const inactiveStarColor = '#d1d5db';

  // Determine dynamic width for smooth spring transition
  let dynamicWidth = showCount ? '78px' : '54px';
  if (isExpanded) {
    if (isSubmitting || submitStatus) {
      dynamicWidth = '90px';
    } else {
      dynamicWidth = '126px';
    }
  }

  return (
    <div
      ref={containerRef}
      onClick={handleButtonClick}
      className={`inline-rating-container ${isExpanded ? 'expanded' : ''} ${submitStatus ? submitStatus : ''}`}
      style={{ width: dynamicWidth }}
    >
      {/* Closed State Content (Slides up and fades out when expanded) */}
      <div 
        className="inline-rating-pill-content"
        style={{
          opacity: isExpanded ? 0 : 1,
          transform: isExpanded ? 'translate(-50%, -130%) scale(0.8)' : 'translate(-50%, -50%) scale(1)',
          pointerEvents: isExpanded ? 'none' : 'auto'
        }}
      >
        <FaStar className="rating-star-icon" />
        <span className="rating-value">{Number(rating).toFixed(1)}</span>
        {showCount && (
          <span className="rating-count">
            ({ratingCount > 1000 ? `${(ratingCount / 1000).toFixed(1)}k` : (ratingCount || 0)})
          </span>
        )}
      </div>

      {/* Expanded State Content (Slides up to center and fades in when expanded) */}
      <div 
        className="inline-rating-expanded-content"
        style={{
          opacity: isExpanded ? 1 : 0,
          transform: isExpanded ? 'translate(-50%, -50%) scale(1)' : 'translate(-50%, 30%) scale(0.85)',
          pointerEvents: isExpanded ? 'auto' : 'none'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {isSubmitting ? (
          <span className="rating-status-text">Rating...</span>
        ) : submitStatus === 'success' ? (
          <span className="rating-status-text success-text">✓ Rated!</span>
        ) : submitStatus === 'error' ? (
          <span className="rating-status-text error-text">Failed!</span>
        ) : (
          <div className="star-row-container">
            <div className="stars-row">
              {[1, 2, 3, 4, 5].map((star) => {
                const isActive = star <= (hoverRating || 0);
                return (
                  <button
                    key={star}
                    type="button"
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={(e) => handleRate(e, star)}
                    className="star-interactive-btn"
                    style={{
                      color: isActive ? activeStarColor : inactiveStarColor,
                    }}
                  >
                    {isActive
                      ? <FaStar className="star-icon-svg" />
                      : <FaRegStar className="star-icon-svg" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ——— Star Rating Modal Component ———
const StarRatingModal = ({ event, onClose, onRatingUpdated }) => {
  const { user } = useAuth();
  const [hoverRating, setHoverRating] = useState(0);
  const [selectedRating, setSelectedRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRate = async (score) => {
    if (!user) {
      alert("Please login to rate events!");
      return;
    }
    setSelectedRating(score);
    setIsSubmitting(true);
    try {
      const res = await rateEvent(event._id, score);
      if (onRatingUpdated) {
        onRatingUpdated(event._id, res.rating, res.ratingCount);
      }
      setTimeout(() => {
        onClose();
      }, 500);
    } catch (err) {
      console.error("Failed to rate event:", err);
      alert(err.response?.data?.message || "Failed to submit rating.");
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.6)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '20px'
    }} onClick={onClose}>
      <div style={{
        background: '#ffffff',
        borderRadius: '20px',
        padding: '28px 32px',
        maxWidth: '400px',
        width: '100%',
        textAlign: 'center',
        boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
        animation: 'popIn 0.3s ease'
      }} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', margin: '0 0 8px 0' }}>
          Rate this Event
        </h3>
        <p style={{ fontSize: '14px', color: '#64748b', margin: '0 0 20px 0' }}>
          {event.title}
        </p>

        {/* 5 Star Selection Row */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '20px' }}>
          {[1, 2, 3, 4, 5].map((star) => {
            const active = star <= (hoverRating || selectedRating);
            return (
              <button
                key={star}
                type="button"
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => handleRate(star)}
                disabled={isSubmitting}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '32px',
                  color: active ? '#f59e0b' : '#cbd5e1',
                  transition: 'transform 0.15s ease, color 0.15s ease',
                  transform: active ? 'scale(1.2)' : 'scale(1)',
                  padding: '4px'
                }}
              >
                ★
              </button>
            );
          })}
        </div>

        <p style={{ fontSize: '13px', fontWeight: '600', color: '#f59e0b', minHeight: '20px', margin: '0 0 16px 0' }}>
          {(hoverRating || selectedRating) > 0 ? `${hoverRating || selectedRating} Star${(hoverRating || selectedRating) > 1 ? 's' : ''}` : 'Tap a star to rate'}
        </p>

        <button
          onClick={onClose}
          style={{
            background: '#f1f5f9',
            border: 'none',
            color: '#475569',
            padding: '10px 24px',
            borderRadius: '10px',
            fontSize: '13px',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
};

// ——— Category Icon Helper ———
const getCategoryIcon = (cat = "") => {
  const lower = cat.toLowerCase();
  if (lower.includes("concert") || lower.includes("music")) return "🎵";
  if (lower.includes("workshop") || lower.includes("tech")) return "📌";
  if (lower.includes("sport")) return "🏆";
  if (lower.includes("comedy")) return "🎭";
  if (lower.includes("festival")) return "🎉";
  if (lower.includes("meetup")) return "🎤";
  return "⚡";
};

// ——— Recommendation Card (BookMyShow Style) ———
const RecCard = ({ event }) => {
  const [currentRating, setCurrentRating] = useState(event.rating || 0);

  const handleClick = () => {
    const el = document.getElementById(`event-card-${event._id}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.style.transition = 'box-shadow 0.3s ease';
      el.style.boxShadow = '0 0 0 4px rgba(124, 58, 237, 0.6)';
      el.style.borderRadius = '16px';
      setTimeout(() => {
        el.style.boxShadow = '';
      }, 2000);
    } else {
      window.location.hash = "#all-events";
    }
  };

  const eventDate = new Date(event.date);
  const day = eventDate.getDate().toString().padStart(2, '0');
  const month = eventDate.toLocaleString('default', { month: 'short' }).toUpperCase();

  return (
    <>
      <div className="dash-bms-rec-card" onClick={handleClick}>
        <img src={event.posterUrl || event.imageUrl} alt={event.title} className="dash-bms-rec-bg" />
        <div className="dash-bms-rec-overlay"></div>
        
        {/* Top Right Rating (Clickable to rate inline) */}
        <InlineStarRating
          event={event}
          initialRating={currentRating}
          onRatingUpdated={(_, newRating) => setCurrentRating(newRating)}
        />
        
        {/* Bottom Content Area */}
        <div className="dash-bms-rec-content">
          <div className="dash-bms-rec-info-row">
            <div className="dash-bms-rec-date-box">
              <span className="dash-bms-rec-day">{day}</span>
              <span className="dash-bms-rec-month">{month}</span>
            </div>
            <div className="dash-bms-rec-text-wrap">
              <h4 className="dash-bms-rec-title" title={event.title} style={{ textTransform: 'uppercase' }}>{event.title}</h4>
              <p className="dash-bms-rec-subtitle">
                {event.category?.charAt(0).toUpperCase() + event.category?.slice(1)} • {event.city?.charAt(0).toUpperCase() + event.city?.slice(1)}
              </p>
            </div>
          </div>
          
          <div className="dash-bms-rec-footer">
            <span className="dash-bms-rec-price">From {formatPrice(event.price)}</span>
          </div>
        </div>
      </div>
    </>
  );
};

// =====================================================
// EVENT GRID CARD (Clean Icon-Free Design)
// =====================================================
const EventGridCard = ({ event }) => {
  const [rating, setRating] = useState(event.rating || 0);
  const [ratingCount, setRatingCount] = useState(event.ratingCount || 0);
  const [isExpanded, setIsExpanded] = useState(false);

  const formattedDateStr = new Date(event.date).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short"
  });

  return (
    <>
      <div
        className={`dash-event-card ${isExpanded ? 'expanded' : ''}`}
        id={`event-card-${event._id}`}
        style={{
          background: '#ffffff',
          borderRadius: '20px',
          border: '1px solid #f1f5f9',
          boxShadow: isExpanded
            ? '0 8px 32px rgba(124, 58, 237, 0.18)'
            : '0 4px 20px rgba(0, 0, 0, 0.05)',
          display: 'flex',
          flexDirection: 'column',
          transition: 'box-shadow 0.3s ease',
          overflow: 'hidden',
        }}
      >
        {/* Top Image Container */}
        <div style={{ position: 'relative', width: '100%', height: '200px', overflow: 'hidden', flexShrink: 0 }}>
          <img
            src={event.posterUrl || event.imageUrl}
            alt={event.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />

          {/* Top-Left Category Badge */}
          <div style={{
            position: 'absolute',
            top: '12px',
            left: '12px',
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(8px)',
            color: '#ffffff',
            padding: '5px 12px',
            borderRadius: '20px',
            fontSize: '11px',
            fontWeight: '700',
            letterSpacing: '0.5px',
            textTransform: 'uppercase',
            zIndex: 2
          }}>
            {event.category?.charAt(0).toUpperCase() + event.category?.slice(1)}
          </div>

          {/* Top-Right Star Rating */}
          <InlineStarRating
            event={event}
            initialRating={rating}
            initialRatingCount={ratingCount}
            onRatingUpdated={(id, newRating, newCount) => {
              setRating(newRating);
              setRatingCount(newCount);
            }}
            showCount={true}
          />
        </div>

        {/* Content Container — fixed height so all cards are uniform */}
        <div style={{ padding: '16px 18px', height: '200px', display: 'flex', flexDirection: 'column', gap: '8px', overflow: 'hidden', flexShrink: 0 }}>
          {/* Title + Price */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
            <h3 style={{
              fontSize: '15px',
              fontWeight: '800',
              color: '#0f172a',
              margin: 0,
              flex: 1,
              lineHeight: '1.2',
              textTransform: 'uppercase',
              letterSpacing: '0.3px',
              overflow: 'hidden',
              whiteSpace: 'nowrap',
              textOverflow: 'ellipsis'
            }}>
              {event.title}
            </h3>
            <div style={{
              fontSize: '16px',
              fontWeight: '900',
              color: event.price === 0 ? '#10b981' : '#6d28d9',
              whiteSpace: 'nowrap',
              letterSpacing: '-0.5px',
              flexShrink: 0
            }}>
              {event.price === 0 ? 'FREE' : formatPrice(event.price)}
            </div>
          </div>

          {/* Venue | Date + Seats */}
          <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', margin: '4px 0 6px 0', flex: 1, minHeight: 0 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', flex: 1, minWidth: 0, paddingRight: '6px' }}>
              <FaMapMarkerAlt style={{ color: '#6366f1', fontSize: '14px', marginTop: '2px', flexShrink: 0 }} />
              <div style={{ minWidth: 0, overflow: 'hidden' }}>
                <div style={{ fontSize: '10px', fontWeight: '700', color: '#a5b4fc', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>Venue</div>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a', lineHeight: '1.3', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                  {event.city?.charAt(0).toUpperCase() + event.city?.slice(1)}
                </div>
                <div style={{ fontSize: '11px', fontWeight: '500', color: '#64748b', lineHeight: '1.3', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', marginTop: '1px' }}>
                  {event.venue}
                </div>
              </div>
            </div>

            <div style={{ width: '1px', background: '#e2e8f0', alignSelf: 'stretch', flexShrink: 0 }} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, minWidth: 0, paddingLeft: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <FaCalendarAlt style={{ color: '#6366f1', fontSize: '14px', marginTop: '2px', flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: '10px', fontWeight: '700', color: '#a5b4fc', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>Date</div>
                  <div style={{ fontSize: '12px', fontWeight: '600', color: '#1e293b', lineHeight: '1.4', whiteSpace: 'nowrap' }}>{formattedDateStr}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <FaTicketAlt style={{ color: '#6366f1', fontSize: '13px', marginTop: '2px', flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: '10px', fontWeight: '700', color: '#a5b4fc', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>Seats</div>
                  <div style={{
                    fontSize: '12px',
                    fontWeight: '600',
                    color: event.availableSeats <= 10 ? '#dc2626' : '#1e293b',
                    whiteSpace: 'nowrap'
                  }}>
                    {event.availableSeats <= 10 ? `Only ${event.availableSeats} left!` : `${event.availableSeats} left`}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Book Now Button */}
          <div style={{ marginTop: 'auto', flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
            <BookActionRow event={event} lightMode={true} />
          </div>
        </div>

        {/* Expand Toggle Button — always visible, centered */}
        <div
          onClick={() => setIsExpanded(!isExpanded)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            padding: '10px 0',
            cursor: 'pointer',
            background: isExpanded
              ? 'linear-gradient(135deg, rgba(124,58,237,0.08), rgba(251,191,36,0.08))'
              : '#f8fafc',
            borderTop: '1px solid #e2e8f0',
            transition: 'background 0.3s ease',
            userSelect: 'none',
            flexShrink: 0,
          }}
        >
          <span style={{ fontSize: '11px', fontWeight: '700', color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {isExpanded ? 'Hide Details' : 'See Details'}
          </span>
          <FaChevronDown
            style={{
              color: '#7c3aed',
              fontSize: '12px',
              transition: 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
              transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
            }}
          />
        </div>

        {/* Expandable Details Section — in normal flow, pushes grid rows below */}
        <div style={{
          maxHeight: isExpanded ? '400px' : '0',
          opacity: isExpanded ? 1 : 0,
          overflow: 'hidden',
          transition: 'max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease',
          background: '#f8fafc',
          flexShrink: 0,
        }}>
          <div style={{ padding: '14px 18px 18px' }}>
            <h4 style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px', marginTop: 0 }}>
              About the Event
            </h4>
            <p style={{ fontSize: '14px', color: '#334155', lineHeight: '1.6', margin: 0 }}>
              {event.description || 'No description available for this event.'}
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

// ——— Creative Book Action Row (Inline Counter + Button) ———
const BookActionRow = ({ event, lightMode = false, compact = false }) => {
  const [quantity, setQuantity] = useState(1);
  const [isHovered, setIsHovered] = useState(false);

  const maxQuantity = Math.min(event.availableSeats ?? 10, 10);
  const isSoldOut = (event.availableSeats ?? -1) === 0;

  const handleBook = async (e) => {
    e.stopPropagation();
    try {
      await bookTicket(event._id, quantity);
      alert(`Successfully booked ${quantity} ticket(s) for "${event.title}"!`);
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to book ticket");
    }
  };

  const handleIncrement = (e) => {
    e.stopPropagation();
    if (quantity < maxQuantity) setQuantity((prev) => prev + 1);
  };

  const handleDecrement = (e) => {
    e.stopPropagation();
    if (quantity > 1) setQuantity((prev) => prev - 1);
  };

  if (isSoldOut) {
    return (
      <div
        className="dash-book-action-row"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginTop: compact ? "8px" : "12px",
          padding: compact ? "6px 12px" : "8px 20px",
          background: "rgba(239, 68, 68, 0.1)",
          border: "1px solid rgba(239, 68, 68, 0.3)",
          borderRadius: "10px",
          width: "100%",
          boxSizing: "border-box",
          color: "#ef4444",
          fontWeight: "700",
          fontSize: compact ? "11px" : "13px",
        }}
      >
        Sold Out
      </div>
    );
  }

  return (
    <div
      className="dash-book-action-row"
      onClick={(e) => e.stopPropagation()}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginTop: compact ? "8px" : "12px",
        padding: "4px",
        background: lightMode ? "#f8fafc" : "rgba(15, 23, 42, 0.4)",
        border: lightMode ? "1px solid #e2e8f0" : "1px solid rgba(255, 255, 255, 0.1)",
        borderRadius: "10px",
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      {/* Quantity Pill */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: compact ? "6px" : "10px",
          padding: compact ? "0 4px" : "0 8px",
        }}
      >
        <button
          onClick={handleDecrement}
          style={{
            background: "none",
            border: "none",
            color: lightMode ? (quantity > 1 ? "#334155" : "#cbd5e1") : (quantity > 1 ? "#fff" : "rgba(255,255,255,0.3)"),
            fontSize: "16px",
            fontWeight: "bold",
            cursor: quantity > 1 ? "pointer" : "not-allowed",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "2px 4px",
          }}
        >
          -
        </button>
        <span
          style={{
            fontSize: "13px",
            fontWeight: "700",
            color: lightMode ? "#0f172a" : "#ffffff",
            minWidth: "14px",
            textAlign: "center",
          }}
        >
          {quantity}
        </span>
        <button
          onClick={handleIncrement}
          style={{
            background: "none",
            border: "none",
            color: lightMode ? (quantity < maxQuantity ? "#334155" : "#cbd5e1") : (quantity < maxQuantity ? "#fff" : "rgba(255,255,255,0.3)"),
            fontSize: "15px",
            fontWeight: "bold",
            cursor: quantity < maxQuantity ? "pointer" : "not-allowed",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "2px 4px",
          }}
        >
          +
        </button>
      </div>

      {/* Book Button */}
      <button
        onClick={handleBook}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          background: isHovered ? "#6d28d9" : "#7c3aed",
          color: "#ffffff",
          border: "none",
          padding: compact ? "6px 12px" : "8px 20px",
          borderRadius: "8px",
          fontSize: compact ? "11px" : "13px",
          fontWeight: "700",
          cursor: "pointer",
          transition: "all 0.2s ease",
          boxShadow: isHovered ? "0 4px 12px rgba(124, 58, 237, 0.4)" : "none",
          whiteSpace: "nowrap",
        }}
      >
        {compact ? "Book" : "Book Now"}
      </button>
    </div>
  );
};

export default UserDashboard;
