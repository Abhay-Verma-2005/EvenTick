import React, { useEffect, useState } from "react";
import { FaTimes, FaStar, FaCommentDots, FaSpinner } from "react-icons/fa";
import { submitFeedback } from "../api/eventApi";
import { useAuth } from "../context/AuthContext";
import "../styles/rightSideMenu.css";

const FeedbackOverlay = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      // Reset state on open
      setRating(0);
      setHoverRating(0);
      setMessage("");
      setError("");
      setSuccess("");
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      setError("Please select a rating.");
      return;
    }
    if (!message.trim()) {
      setError("Please enter your feedback.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      
      const userName = user?.firstName ? `${user.firstName} ${user.lastName || ""}`.trim() : "User";
      
      await submitFeedback({
        rating,
        message,
        userName,
        userPhoto: user?.photoUrl || "",
      });

      setSuccess("Thank you for your feedback!");
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit feedback.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="right-menu-overlay" style={{ zIndex: 10000 }}>
      <div className="right-menu-panel ticket-panel-wide">
        {/* Header */}
        <div className="right-menu-header">
          <div className="user-profile-summary">
            <div style={{ color: "#7c3aed", display: "flex", alignItems: "center", justifyContent: "center", marginRight: "12px" }}>
              <FaCommentDots size={28} />
            </div>
            <div className="user-info-text">
              <span className="user-full-name">Feedback</span>
              <span className="user-email">Help us improve Eventick</span>
            </div>
          </div>
          <button className="right-menu-close" onClick={onClose} type="button">
            <FaTimes />
          </button>
        </div>

        {/* Content */}
        <div className="right-menu-content" style={{ padding: "24px", display: "flex", flexDirection: "column" }}>
          
          {error && (
            <div style={{ padding: "10px", background: "#fef2f2", color: "#ef4444", borderRadius: "8px", marginBottom: "16px", fontSize: "14px" }}>
              {error}
            </div>
          )}
          
          {success ? (
            <div style={{ padding: "40px 20px", textAlign: "center" }}>
              <div style={{ fontSize: "48px", color: "#22c55e", marginBottom: "16px" }}>🎉</div>
              <h3 style={{ fontSize: "20px", fontWeight: "700", color: "#1e293b", marginBottom: "8px" }}>Success!</h3>
              <p style={{ color: "#64748b" }}>{success}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              
              <div>
                <label style={{ display: "block", fontSize: "14px", fontWeight: "600", color: "#334155", marginBottom: "12px" }}>
                  How would you rate your experience?
                </label>
                <div style={{ display: "flex", gap: "8px" }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <FaStar
                      key={star}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(star)}
                      style={{
                        fontSize: "32px",
                        cursor: "pointer",
                        color: star <= (hoverRating || rating) ? "#eab308" : "#e2e8f0",
                        transition: "color 0.2s ease"
                      }}
                    />
                  ))}
                </div>
              </div>

              <div style={{ position: "relative" }}>
                <label style={{ display: "block", fontSize: "14px", fontWeight: "600", color: "#334155", marginBottom: "12px" }}>
                  Tell us more about it
                </label>
                <textarea
                  placeholder="What did you like or dislike?"
                  value={message}
                  maxLength={500}
                  onChange={(e) => setMessage(e.target.value)}
                  style={{
                    width: "100%",
                    minHeight: "120px",
                    padding: "16px",
                    paddingBottom: "32px",
                    borderRadius: "12px",
                    border: "1px solid #e2e8f0",
                    background: "#f8fafc",
                    fontSize: "15px",
                    fontFamily: "inherit",
                    resize: "vertical",
                    outline: "none"
                  }}
                  onFocus={(e) => e.target.style.borderColor = "#7c3aed"}
                  onBlur={(e) => e.target.style.borderColor = "#e2e8f0"}
                />
                <div style={{ position: "absolute", bottom: "12px", right: "16px", fontSize: "12px", color: "#94a3b8" }}>
                  {message.length}/500
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                style={{
                  width: "100%",
                  padding: "16px",
                  borderRadius: "12px",
                  background: "#7c3aed",
                  color: "white",
                  border: "none",
                  fontWeight: "600",
                  fontSize: "16px",
                  cursor: loading ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  opacity: loading ? 0.7 : 1,
                  marginTop: "auto"
                }}
              >
                {loading ? (
                  <><FaSpinner style={{ animation: "spin 1s linear infinite" }} /> Submitting...</>
                ) : (
                  "Submit Feedback"
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default FeedbackOverlay;
