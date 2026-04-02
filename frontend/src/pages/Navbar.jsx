import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaSearch, FaChevronDown, FaHome, FaCalendarAlt, FaTachometerAlt , FaSignOutAlt} from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import "./styles/navbar.css";

const Navbar = ({ lightLogo = false }) => {
  const [city, setCity] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);

  const auth = useAuth();
  const isAuthenticated = auth.isAuthenticated;
  const user = auth.user;
  const logout = auth.logout;

  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  const handleSearch = () => {
    if (city !== "") {
      navigate("/events?city=" + city);
    } else {
      navigate("/events");
    }
  };

  const handleLogout = () => {
    logout();
    setProfileOpen(false);
    navigate("/");
  };

  useEffect(() => {
    const closeDropdown = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", closeDropdown);
    return () => document.removeEventListener("mousedown", closeDropdown);
  }, []);

  let name = "";
  let email = "";
  let role = "";

  if (user && user.user) {
    name = user.user.name;
    email = user.user.email;
    role = user.user.role;
  }

  return (
    <nav className="navbar">

      <div className="logo-container">
        <Link to="/" className="logo-link">
          <img src={lightLogo ? "/light-logo.png" : "/logo.png"} className="logo-img" />
          <span className="logo-text">EvenTick</span>
        </Link>
      </div>

      <ul className="nav-links">
        <li>
          <Link to="/" className="nav-link">
            <FaHome /> Home
          </Link>
        </li>
        <li>
          <Link to="/events" className="nav-link">
            <FaCalendarAlt /> Events
          </Link>
        </li>
        {isAuthenticated && (
          <li>
            <Link to="/dashboard" className="nav-link">
              <FaTachometerAlt /> Dashboard
            </Link>
          </li>
        )}
      </ul>

      <div className="search-box">
        <input
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="Search by city"
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSearch();
          }}
        />
        <button onClick={handleSearch} className="nav-search-btn">
          <FaSearch />
        </button>
      </div>

      {!isAuthenticated && (
        <div className="auth-buttons">
          <Link to="/login" className="login-btn">Login</Link>
          <Link to="/signup" className="signup-btn">Sign Up</Link>
        </div>
      )}

      {isAuthenticated && (
        <div className="profile-wrapper" ref={dropdownRef}>
          <button
            className="profile-btn"
            onClick={() => setProfileOpen(!profileOpen)}
          >
            <img
              src={"https://ui-avatars.com/api/?name=" + name}
              className="avatar"
            />
            <span>{name}</span>
            <FaChevronDown />
          </button>

          {profileOpen && (
            <div className="dropdown">
              <h1>{name}</h1>
              <p>{email}</p>

              <button onClick={() => navigate("/dashboard")}>
                <FaHome /> Dashboard
              </button>

              <button onClick={() => navigate("/events")}>
                <FaCalendarAlt />  Events
              </button>

              <button className="log-out" onClick={handleLogout}>
                <FaSignOutAlt />Logout
              </button>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;