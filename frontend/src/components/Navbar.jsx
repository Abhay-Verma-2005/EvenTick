import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { FaSearch, FaHome, FaMapMarkerAlt } from "react-icons/fa";
import axios from "axios";
import "../styles/navbar.css";

const POPULAR_CITIES = [
  { name: "Mumbai", image: "/mumbai.png" },
  { name: "Delhi", image: "/ncr.png" },
  { name: "Bengaluru", image: "/bang.png" },
  { name: "Hyderabad", image: "/hyd.png" },
  { name: "Pune", image: "/pune.png" },
  { name: "Kolkata", image: "/kolk.png" },
];

import { useAuth } from "../context/AuthContext";
import { FaUserCircle } from "react-icons/fa";
import RightSideMenu from "./RightSideMenu";
import EditProfileModal from "./EditProfileModal";
import TicketsOverlay from "./TicketsOverlay";
import NotificationsOverlay from "./NotificationsOverlay";
import FeedbackOverlay from "./FeedbackOverlay";
import AIChatOverlay from "./AIChatOverlay";
import { getMyNotifications, searchEventsApi } from "../api/eventApi";
import { useNavigate } from "react-router-dom";


const Navbar = ({ lightLogo = false, onSignIn }) => {
  const { user, logout, updateProfile } = useAuth();
  const [sideMenuOpen, setSideMenuOpen] = useState(false);
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [ticketsOpen, setTicketsOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [aiChatOpen, setAiChatOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState(user?.city || "");
  const [cityOpen, setCityOpen] = useState(false);
  const [citySearch, setCitySearch] = useState("");
  const [allCities, setAllCities] = useState([]);
  const [citiesFetched, setCitiesFetched] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!query || query.trim() === "") {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    const timer = setTimeout(() => {
      setIsSearching(true);
      searchEventsApi(query)
        .then((res) => {
          setSearchResults(res.data || []);
          setShowDropdown(true);
        })
        .catch(console.error)
        .finally(() => setIsSearching(false));
    }, 1000);

    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSearchSelect = (ev) => {
    setShowDropdown(false);
    setQuery("");
    
    if (currentPath === "/dashboard") {
      const el = document.getElementById(`event-card-${ev._id}`);
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
    } else {
      navigate(`/dashboard?scrollTo=${ev._id}`);
    }
  };


  // Sync selectedCity when user.city updates
  useEffect(() => {
    if (user?.city) {
      setSelectedCity(user.city);
    }
  }, [user?.city]);

  useEffect(() => {
    if (user) {
      getMyNotifications().then(res => {
        if (res.data) {
          setUnreadCount(res.data.filter(n => !n.isRead).length);
        }
      }).catch(console.error);
    }
  }, [user, notificationsOpen]); // re-fetch when notifications overlay closes

  // Capitalize first name
  const formattedFirstName = user?.firstName
    ? user.firstName.charAt(0).toUpperCase() + user.firstName.slice(1).toLowerCase()
    : "User";

  const triggerRef = useRef(null);
  const panelRef = useRef(null);

  const location = useLocation();
  const currentPath = location.pathname;

  
  const openCityPanel = () => {
    setCityOpen(true);
    if (citiesFetched) return;
    setCitiesFetched(true);
    axios
      .post("https://countriesnow.space/api/v0.1/countries/cities", { country: "India" })
      .then((response) => {
        if (!response.data.error) {
          setAllCities(response.data.data);
        }
      })
      .catch(console.error);
  };

  const filteredCities = citySearch.trim()
    ? allCities
        .filter((city) => city.toLowerCase().includes(citySearch.toLowerCase()))
        .slice(0, 8)
    : [];

  const handleCitySelect = async (city) => {
    setSelectedCity(city);
    setCityOpen(false);
    setCitySearch("");

    if (user && updateProfile) {
      try {
        await updateProfile({ city });
      } catch (err) {
        console.error("Failed to save selected city to user profile:", err);
      }
    }
  };

  useEffect(() => {
    if (!cityOpen) return;

    const handler = (e) => {
      const clickedTrigger = triggerRef.current && triggerRef.current.contains(e.target);
      const clickedPanel = panelRef.current && panelRef.current.contains(e.target);
      if (!clickedTrigger && !clickedPanel) {
        setCityOpen(false);
        setCitySearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [cityOpen]);

  return (
    <>
      <nav className="navbar">
        <div className="logo-container">
          <Link to="/" className="logo-link">
            <img 
              src={currentPath === "/" ? (lightLogo ? "/light-logo.png" : "/logo.png") : "/favicon.png"} 
              className="logo-img" 
              style={currentPath !== "/" ? { width: "24px", height: "24px", marginRight: "6px" } : { width: "56px", height: "56px" }}
              alt="EvenTick" 
            />
            <span className="logo-text">EvenTick</span>
          </Link>
        </div>

        <div className="nav-center" ref={searchRef} style={{ position: "relative" }}>
          <div className="nav-search-wrapper">
            <FaSearch className="nav-search-icon" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => { if(query.trim()) setShowDropdown(true); }}
              placeholder="Search events, cities..."
              className="nav-search-input"
            />
          </div>
          {showDropdown && (
            <div className="search-dropdown-overlay" style={{
              position: "absolute",
              top: "110%",
              left: 0,
              right: 0,
              backgroundColor: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: "12px",
              padding: "8px",
              zIndex: 1000,
              boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
              display: "flex",
              flexDirection: "column",
              gap: "4px"
            }}>
              {isSearching ? (
                 <div style={{ padding: "12px", color: "#64748b", textAlign: "center", fontSize: "14px" }}>Searching...</div>
              ) : searchResults.length > 0 ? (
                 searchResults.map(event => (
                   <div key={event._id} onClick={() => handleSearchSelect(event)} style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      padding: "8px",
                      borderRadius: "8px",
                      cursor: "pointer",
                      transition: "background 0.2s"
                   }} className="search-dropdown-item">
                      <img src={event.imageUrl} alt={event.title} style={{ width: "40px", height: "40px", borderRadius: "6px", objectFit: "cover" }} />
                      <div style={{ display: "flex", flexDirection: "column" }}>
                         <h4 style={{ margin: 0, color: "#1e293b", fontSize: "14px", fontWeight: "600", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "200px" }}>{event.title}</h4>
                         <p style={{ margin: 0, color: "#64748b", fontSize: "12px" }}>{event.city}</p>
                      </div>
                   </div>
                 ))
              ) : (
                 <div style={{ padding: "12px", color: "#64748b", textAlign: "center", fontSize: "14px" }}>No matching events found</div>
              )}
            </div>
          )}
        </div>

        <div className="nav-right" ref={triggerRef}>
          <div className="city-selector">
            <div className="city-trigger" onClick={() => (cityOpen ? setCityOpen(false) : openCityPanel())}>
              <FaMapMarkerAlt className="city-pin" />
              <div className="city-text">
                <span className="city-label">CITY</span>
                <span className="city-name">{selectedCity || "Select City"}</span>
              </div>

              {selectedCity ? (
                <button
                  className="city-clear-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCitySelect("");
                  }}
                  title="Clear City"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              ) : (
                <svg className={`city-chevron ${cityOpen ? "open" : ""}`} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 9l6 6 6-6"/>
                </svg>
              )}
            </div>
          </div>

          <div className="auth-buttons">
            {user ? (
              <div 
                className="user-nav-profile-btn" 
                onClick={() => setSideMenuOpen(!sideMenuOpen)}
                title="Open User Menu"
              >
                {user.photoUrl && user.photoUrl !== "https://geographyandyou.com/images/user-profile.png" ? (
                  <img src={user.photoUrl} alt={formattedFirstName} className="nav-avatar-img" />
                ) : (
                  <FaUserCircle className="nav-avatar-icon" />
                )}
                <span className="nav-user-name">{formattedFirstName}</span>
                <svg className={`nav-user-chevron ${sideMenuOpen ? "open" : ""}`} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M6 9l6 6 6-6"/>
                </svg>
              </div>
            ) : (
              <button className="nav-signup-btn" onClick={onSignIn}>Sign In</button>
            )}
          </div>
        </div>
      </nav>

      {/* Right Side User Drawer Menu */}
      <RightSideMenu
        isOpen={sideMenuOpen}
        onClose={() => setSideMenuOpen(false)}
        user={user}
        unreadCount={unreadCount}
        onLogout={logout}
        onEditProfile={() => setEditProfileOpen(true)}
        onOpenTickets={() => setTicketsOpen(true)}
        onOpenNotifications={() => setNotificationsOpen(true)}
        onOpenFeedback={() => setFeedbackOpen(true)}
        onOpenAIChat={() => setAiChatOpen(true)}
      />

      <TicketsOverlay 
        isOpen={ticketsOpen} 
        onClose={() => setTicketsOpen(false)} 
        user={user}
      />
      <NotificationsOverlay 
        isOpen={notificationsOpen} 
        onClose={() => setNotificationsOpen(false)} 
      />
      <FeedbackOverlay 
        isOpen={feedbackOpen} 
        onClose={() => setFeedbackOpen(false)} 
      />

      {/* Edit Profile Modal */}
      <EditProfileModal 
        isOpen={editProfileOpen} 
        onClose={() => setEditProfileOpen(false)} 
      />

      {/* AI Chatbot */}
      <AIChatOverlay
        isOpen={aiChatOpen}
        onClose={() => setAiChatOpen(false)}
      />

      {cityOpen && (
        <div className="city-panel-overlay">
          <div className="city-panel-box" ref={panelRef}>
            <div className="city-search-header">
              <FaSearch className="city-search-icon-large" />
              <input
                type="text"
                placeholder="Search for your city"
                value={citySearch}
                onChange={e => setCitySearch(e.target.value)}
                autoFocus
              />
            </div>

            <div className="city-panel-content">
              {citySearch.trim() ? (
                <div className="city-search-results">
                  {filteredCities.length > 0 ? (
                    <ul>
                      {filteredCities.map(city => (
                        <li key={city} onClick={() => handleCitySelect(city)}>{city}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="city-no-result">No cities found</p>
                  )}
                </div>
              ) : (
                <>
                  <p className="city-popular-title">Popular Cities</p>
                  <div className="city-image-grid">
                    {POPULAR_CITIES.map(city => (
                      <div
                        key={city.name}
                        className={`city-image-item ${selectedCity === city.name ? "selected" : ""}`}
                        onClick={() => handleCitySelect(city.name)}
                      >
                        <img src={city.image} alt={city.name} className="city-image-icon" />
                        <span className="city-image-name">{city.name}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="mobile-bottom-nav">
        <Link to="/" className={`mobile-nav-item ${currentPath === "/" ? "active" : ""}`}>
          <FaHome />
          <span>Home</span>
        </Link>
      </div>
    </>
  );
};

export default Navbar;