import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {FaSearch, FaBuilding, FaCalendarAlt, FaTicketAlt, FaQrcode,FaShieldAlt, FaInstagram, FaLinkedin, FaGithub,FaMapMarkerAlt, FaArrowRight, FaCompass, FaCheckCircle, FaStar, FaTheaterMasks, FaRobot, FaHackerNews, FaHandsHelping, FaMapMarkedAlt, FaBell, FaUserCircle} from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import Navbar from "../components/Navbar";
import AuthModal from "../components/AuthModal";
import { getTopFeedbacks } from "../api/eventApi";
import "../styles/home.css";

const LandingPage = () => {
  const [authRole, setAuthRole] = useState(null);

  return (
    <div className="main-container">
      <Navbar onSignIn={() => setAuthRole("USER")} />
      <HeroSection onGetStarted={() => setAuthRole("USER")} />
      <FeaturesSection />
      <FeedbackSection />
      <FooterFlexBanner />
      <OrganiserCTA onJoinToday={() => setAuthRole("EVENT_ORGANISER")} />
      <FooterSection />
      {authRole && <AuthModal role={authRole} onClose={() => setAuthRole(null)} />}
    </div>
  );
};

const HeroSection = ({ onGetStarted }) => {
  const [query, setQuery] = useState("");
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
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search by event or city..."
        />
        <button className="search-btn" onClick={onGetStarted}>
          <FaSearch /> 
        </button>
      </div>

      <div className="cta-buttons">
        <button className="hero-signup-btn" onClick={onGetStarted}>
          Get Started <FaArrowRight />
        </button>
      </div>
    </section>
  );
};

const FEATURES = [
  { icon: FaHandsHelping,  title: "AI Event Assistant", desc: "AI-powered guidance to create successful events." },
  { icon: FaCompass, title: "Event Discovery", desc: "Explore events by city, category, and date." },
  { icon: FaCalendarAlt, title: "Instant Booking", desc: "Book tickets with real-time seat availability." },
  { icon: FaMapMarkedAlt, title: "Smart Recommendations", desc: "Discover nearby events prioritized for your interests." },
  { icon: FaBell, title: "Smart Notifications", desc: "Receive booking updates and event reminders." },
  { icon: FaShieldAlt, title: "Auth Security", desc: "Role-based access with JWT authentication.." }
];

const FeaturesSection = () => {
  return (
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
          <FeatureCard key={i} feature={f} index={i} />
        ))}
      </div>
    </section>
  );
};

const FeatureCard = ({ feature: f, index }) => {
  return (
    <div className="feature-card">
      <div className="icon-box"><f.icon /></div>
      <h3>{f.title}</h3>
      <p>{f.desc}</p>
    </div>
  );
};

const FeedbackSection = () => {
  const [feedbacks, setFeedbacks] = useState([]);

  useEffect(() => {
    getTopFeedbacks()
      .then(res => {
        if (res.data) setFeedbacks(res.data);
      })
      .catch(err => console.error("Failed to load feedbacks", err));
  }, []);

  return (
    <section className="feedback-section">
      <div className="feedback-header">
        <p className="tag"><FaStar /> PEOPLE'S THOUGHT SUITE</p>
        <h2>People's Thoughts</h2>
        {feedbacks.length === 0 ? (
          <p className="lp-no-reviews">Be the first to experience and review Eventick!</p>
        ) : (
          <div className="feedback-cards-container">
            {feedbacks.map((fb) => (
              <div key={fb._id} className="feedback-card">
                <div className="feedback-card-header">
                  {fb.userPhoto ? (
                    <img src={fb.userPhoto} alt={fb.userName} className="feedback-avatar" />
                  ) : (
                    <FaUserCircle className="feedback-avatar-icon" />
                  )}
                  <div className="feedback-user-info">
                    <h4>{fb.userName}</h4>
                    <div className="feedback-rating">
                      {Array.from({ length: Math.floor(Number(fb.rating) || 0) }).map((_, i) => <FaStar key={i} />)}
                    </div>
                  </div>
                </div>
                <p className="feedback-text">"{fb.message}"</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

const FooterFlexBanner = () => {
  return (
    <div className="footer-flex-banner">
      <img src="/footer-flex.png" alt="EvenTick" />
    </div>
  );
};

const OrganiserCTA = ({ onJoinToday }) => {
  return (
    <section className="organiser-cta">
      <div className="organiser-cta-inner">
        <div className="organiser-cta-left">
          <FaTheaterMasks className="organiser-cta-icon" />
          <span className="organiser-cta-title">List your Event</span>
        </div>
        <div className="organiser-cta-middle">
          <span>Got a show, event, activity or a great experience?</span>
          <span>Partner with us &amp; get listed on EvenTick</span>
        </div>
        <div className="organiser-cta-right">
          <button className="organiser-cta-btn" onClick={onJoinToday}>
            Hosts Signup <FaArrowRight style={{ marginLeft: '6px' }} />
          </button>
        </div>
      </div>
    </section>
  );
};

const FooterSection = () => {
  return (
    <footer className="footer">
      <div className="footer-grid">
        <div className="footer-col footer-brand">
          <Link to="/" className="logo-link">
            <img src="/logo.png" className="logo-img" alt="EvenTick" />
            <span className="logo-text">EvenTick</span>
          </Link>
          <p>All-in-one platform for events.</p>
          <div className="socials">
            <FaInstagram onClick={() => window.open("https://www.instagram.com/the_a.b.h.a.y", "_blank")} />
            <FaXTwitter onClick={() => window.open("https://www.twitter.com/ABHAYVERMA78471", "_blank")} />
            <FaLinkedin onClick={() => window.open("https://www.linkedin.com/in/abhay-verma-990735281/", "_blank")} />
            <FaGithub onClick={() => window.open("https://www.github.com/Abhay-Verma-2005/", "_blank")} />
          </div>
        </div>

        <div className="footer-col">
          <h4>HELP</h4>
          <div className="footer-links-col">
            <Link to="/">About Us</Link>
            <Link to="/">Contact Us</Link>
            <Link to="/">FAQs</Link>
            <Link to="/">Terms and Conditions</Link>
            <Link to="/">Privacy Policy</Link>
          </div>
        </div>
        
        <div className="footer-col">
          <h4>EVENTICK EXCLUSIVES</h4>
          <div className="footer-links-col">
            <Link to="/">Offers</Link>
            <Link to="/">My List</Link>
            <Link to="/">Gift Cards</Link>
            <Link to="/">Book Event</Link>
          </div>
        </div>

        <div className="footer-col">
          <h4>TOP CITIES</h4>
          <div className="footer-links-col">
            <Link to="/">Events in Delhi</Link>
            <Link to="/">Events in Mumbai</Link>
            <Link to="/">Events in Pune</Link>
            <Link to="/">Events in Kolkata</Link>
          </div>
        </div>
      </div>

      <div className="copyright">
        © {new Date().getFullYear()} EvenTick. All rights reserved.
      </div>
    </footer>
  );
};

export default LandingPage;
