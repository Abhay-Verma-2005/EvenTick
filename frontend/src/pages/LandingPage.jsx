import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {FaSearch, FaBuilding, FaCalendarAlt, FaTicketAlt, FaQrcode,FaShieldAlt, FaInstagram, FaTwitter, FaLinkedin, FaGithub,FaMapMarkerAlt, FaArrowRight, FaCompass, FaCheckCircle, FaStar, FaRegStar, FaPaperPlane} from "react-icons/fa";
import Navbar from "./Navbar";
import { useAuth } from "../context/AuthContext";
import apiClient from "../api/apiClient";
import "./styles/home.css";

const LandingPage = () => (
  <div className="main-container">
    <Navbar />
    <HeroSection />
    <FeaturesSection />
    <TestimonialsSection />
    <FooterSection />
  </div>
);

const HeroSection = () => {
  const [city, setCity] = useState("");
  const navigate = useNavigate();

  const handleSearch = () => {
    if (city.trim()) navigate(`/events?city=${encodeURIComponent(city.trim())}`);
    else navigate("/events");
  };

  return (
    <section className="hero">
      <h1 className="hero-title">
        Dream it. Plan it.<br />Your Event,<span className="outline-text"> LIVE.</span>
      </h1>

      <p className="hero-info">
        Experience the easiest way to discover venues, manage events, and
        book digital e-tickets instantly.
      </p>

      <div className="search-bar">
        <FaMapMarkerAlt className="icon" />
        <input
          value={city}
          onChange={e => setCity(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSearch()}
          placeholder="Where are you looking?"
        />
        <button onClick={handleSearch} className="search-btn">
          <FaSearch /> 
        </button>
      </div>

      <div className="cta-buttons">
        <Link to="/signup" className="signup-btn">
          Get Started <FaArrowRight />
        </Link>
      </div>
    </section>
  );
};

const FEATURES = [
  { icon: FaBuilding, title: "Venue Listing", desc: "List spaces with details, capacity, pricing." },
  { icon: FaCompass, title: "Venue Discovery", desc: "Filter venues by location and reviews." },
  { icon: FaCalendarAlt, title: "Event Management", desc: "Create and manage events easily." },
  { icon: FaTicketAlt, title: "Digital Booking", desc: "Real-time ticket booking system." },
  { icon: FaQrcode, title: "QR E-Ticket", desc: "Instant secure QR tickets." },
  { icon: FaShieldAlt, title: "RBAC Security", desc: "Role-based secure access." }
];

const FeaturesSection = () => (
  <section className="home-features">
    <div className="home-features-header">
      <p className="tag"><FaStar /> THE EVENTICK SUITE</p>
      <h2>Platform Features</h2>
      <p className="sub">
        Complete event lifecycle platform from discovery to booking.
      </p>
    </div>

    <div className="home-features-grid">
      {FEATURES.map((f, i) => (
        <div key={i} className="feature-card">
          <div className="icon-box"><f.icon /></div>
          <h3>{f.title}</h3>
          <p>{f.desc}</p>
        </div>
      ))}
    </div>
  </section>
);

const TestimonialsSection = () => {
  const { isAuthenticated } = useAuth();
  const [feedbacks, setFeedbacks] = useState([]);
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState("");

  const loadFeedback = async () => {
    try {
      const res = await apiClient.get("/feedback");
      if (Array.isArray(res.data)) setFeedbacks(res.data);
    } catch {}
  };

  useEffect(() => { loadFeedback(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSubmitting(true);
    setMsg("");
    try {
      await apiClient.post("/feedback/submit", { rating, text });
      setMsg("Thank you for your feedback!");
      setText("");
      setRating(5);
      loadFeedback();
    } catch (err) {
      setMsg(err.response?.data?.message || "Error submitting feedback.");
    } finally {
      setSubmitting(false);
    }
  };

  const displayList = [...feedbacks]
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 3);
  const avgRating = feedbacks.length > 0
    ? (feedbacks.reduce((sum, t) => sum + t.rating, 0) / feedbacks.length).toFixed(1)
    : null;

  return (
    <section className="testimonials">
      <div className="testimonials-header">
        <p className="tag"><FaStar /> PEOPLE'S THOUGHTS</p>
        <h2>Testimonials & Community Reviews</h2>
        {avgRating && (
          <div className="rating-badge">
            <span className="rating-num">{avgRating}</span>
            <span className="rating-label">/ 5 Average Rating</span>
            <div className="star-row">
              {[1, 2, 3, 4, 5].map(n => (
                <FaStar key={n} color={n <= Math.round(Number(avgRating)) ? "#fbbf24" : "#e5e7eb"} />
              ))}
            </div>
          </div>
        )}
      </div>

      {displayList.length > 0 ? (
        <div className="testimonials-grid">
          {displayList.map((t, i) => (
            <div key={i} className="testimonial-card">
              <div className="t-rating">
                {[1, 2, 3, 4, 5].map(n => (
                  <FaStar key={n} color={n <= t.rating ? "#fbbf24" : "#e5e7eb"} size={14} />
                ))}
              </div>
              <p className="t-text">"{t.text}"</p>
              <div className="t-author">
                <span className="t-name">{t.name}</span>
                <span className="t-role">{t.role}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="no-feedback-placeholder" style={{
          textAlign: "center",
          color: "rgba(255, 255, 255, 0.4)",
          margin: "40px auto 60px",
          fontStyle: "italic",
          maxWidth: "500px",
          padding: "30px",
          background: "rgba(255, 255, 255, 0.01)",
          borderRadius: "16px",
          border: "1px dashed rgba(255, 255, 255, 0.06)",
          fontSize: "15px"
        }}>
          No reviews submitted yet. Be the first to share your experience!
        </div>
      )}

      <div className="feedback-form-container">
        <h3>Share Your Platform Experience</h3>
        {msg && <p className="feedback-form-msg">{msg}</p>}
        {isAuthenticated ? (
          <form onSubmit={handleSubmit} className="feedback-form">
            <div className="feedback-stars-selector">
              <span>Your Rating: </span>
              {[1, 2, 3, 4, 5].map(n => (
                <button type="button" key={n} onClick={() => setRating(n)} className="star-btn">
                  {n <= rating ? <FaStar size={18} color="#fbbf24" /> : <FaRegStar size={18} color="#d1d5db" />}
                </button>
              ))}
            </div>
            <div className="feedback-input-group">
              <textarea
                required
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="What do you think about EvenTick? Share your experience with us..."
                rows="3"
              />
              <button type="submit" disabled={submitting || !text.trim()} className="feedback-submit-btn">
                <FaPaperPlane size={11} /> {submitting ? "Sending..." : "Submit Review"}
              </button>
            </div>
          </form>
        ) : (
          <p className="feedback-signin-hint">Please <Link to="/login">sign in</Link> to share your thoughts and ratings.</p>
        )}
      </div>
    </section>
  );
};

const FooterSection = () => (
  <footer className="footer">
    <div className="footer-grid">
      <div>
        <Link to="/" className="logo-link">
          <img src={"/logo.png"} className="logo-img" />
          <span className="logo-text">EvenTick</span>
        </Link>
        <p>All-in-one platform for events.</p>
        <div className="socials">
          <FaInstagram />
          <FaTwitter />
          <FaLinkedin />
          <FaGithub />
        </div>
      </div>

      {["Platform", "Resources", "Company"].map(col => (
        <div key={col}>
          <h4>{col}</h4>
          <ul>
            <li>Link 1</li>
            <li>Link 2</li>
            <li>Link 3</li>
          </ul>
        </div>
      ))}
    </div>

    <div className="copyright">
      © {new Date().getFullYear()} EvenTick
    </div>
  </footer>
);

export default LandingPage;