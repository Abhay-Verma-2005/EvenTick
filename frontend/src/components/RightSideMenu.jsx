import { useEffect, useRef } from "react";
import {
  FaUserCircle,
  FaBell,
  FaUserEdit,
  FaCommentAlt,
  FaSignOutAlt,
  FaChevronRight,
  FaTimes,
  FaCrown,
  FaTicketAlt,
  FaMagic
} from "react-icons/fa";
import "../styles/rightSideMenu.css";

const RightSideMenu = ({ isOpen, onClose, user, unreadCount = 0, onLogout, onEditProfile, onOpenTickets, onOpenNotifications, onOpenFeedback, onOpenAIChat }) => {
  const menuRef = useRef(null);

  const isOrganiser = user?.role === "host" || user?.role === "EVENT_ORGANISER";

  // Capitalize name helper
  const formattedFirstName = user?.firstName
    ? user.firstName.charAt(0).toUpperCase() + user.firstName.slice(1).toLowerCase()
    : "User";
  const formattedLastName = user?.lastName
    ? user.lastName.charAt(0).toUpperCase() + user.lastName.slice(1).toLowerCase()
    : "";
  const fullName = `${formattedFirstName} ${formattedLastName}`.trim();

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  // Prevent scroll when side menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="right-menu-overlay">
      <div className={`right-menu-panel ${isOrganiser ? "is-organiser" : ""}`} ref={menuRef}>
        {/* Header — plain white, avatar photo, name, email, close X */}
        <div className="right-menu-header">
          <div className="user-profile-summary">
            <div className="avatar-wrapper">
              {user?.photoUrl && user.photoUrl !== "https://geographyandyou.com/images/user-profile.png" ? (
                <img src={user.photoUrl} alt={fullName} className="user-avatar-img" />
              ) : (
                <FaUserCircle className="user-avatar-icon" />
              )}
            </div>
            <div className="user-info-text">
              <span className="user-full-name">{fullName}</span>
              <span className="user-email">{user?.email || "user@eventick.com"}</span>
              {isOrganiser && (
                <span className="user-role-badge role-host">
                  Event Host <FaCrown style={{ marginLeft: "3px", color: "#d97706" }} />
                </span>
              )}
            </div>
          </div>
          <button className="right-menu-close" onClick={onClose} title="Close menu">
            <FaTimes />
          </button>
        </div>

        {/* Menu Items List */}
        <div className="right-menu-content">
          <div className="menu-group">
            {!isOrganiser && (
              <button className="menu-item" onClick={() => {
                onClose();
                if (onOpenTickets) onOpenTickets();
              }}>
                <div className="menu-item-left">
                  <div className="menu-icon-box events">
                    <FaTicketAlt />
                  </div>
                  <div className="menu-item-text">
                    <span className="menu-item-title">My Tickets</span>
                    <span className="menu-item-subtitle">View your bookings and tickets</span>
                  </div>
                </div>
                <FaChevronRight className="chevron-icon" />
              </button>
            )}

            <button className="menu-item" onClick={() => {
              onClose();
              if (onOpenNotifications) onOpenNotifications();
            }}>
              <div className="menu-item-left">
                <div className="menu-icon-box bell">
                  <FaBell />
                </div>
                <div className="menu-item-text">
                  <span className="menu-item-title">Notifications</span>
                  {unreadCount > 0 ? (
                    <span className="menu-item-new-badge">{unreadCount} new</span>
                  ) : (
                    <span className="menu-item-subtitle">Stay updated with your alerts</span>
                  )}
                </div>
              </div>
              <FaChevronRight className="chevron-icon" />
            </button>

            <button
              className="menu-item"
              onClick={() => {
                onClose();
                if (onEditProfile) onEditProfile();
              }}
            >
              <div className="menu-item-left">
                <div className="menu-icon-box edit">
                  <FaUserEdit />
                </div>
                <div className="menu-item-text">
                  <span className="menu-item-title">Edit Profile</span>
                  <span className="menu-item-subtitle">Update your personal information</span>
                </div>
              </div>
              <FaChevronRight className="chevron-icon" />
            </button>

            <button className="menu-item" onClick={() => {
              onClose();
              if (onOpenFeedback) onOpenFeedback();
            }}>
              <div className="menu-item-left">
                <div className="menu-icon-box feedback">
                  <FaCommentAlt />
                </div>
                <div className="menu-item-text">
                  <span className="menu-item-title">Feedback</span>
                  <span className="menu-item-subtitle">Help us improve Eventick</span>
                </div>
              </div>
              <FaChevronRight className="chevron-icon" />
            </button>

            <button className="menu-item ai-menu-item" onClick={() => { onClose(); if (onOpenAIChat) onOpenAIChat(); }}>
              <div className="menu-item-left">
                <div className="menu-icon-box ai">
                  <FaMagic />
                </div>
                <div className="menu-item-text">
                  <div className="ai-label-box">
                    <span className="menu-item-title">Eventick AI</span>
                    <span style={{ fontSize: "9px", fontWeight: "800", color: "#fff", background: "#7c3aed", padding: "2px 6px", borderRadius: "8px" }}>
                      LIVE
                    </span>
                  </div>
                  <span className="menu-item-subtitle" style={{ color: "#8b5cf6" }}>Chat with your event assistant</span>
                </div>
              </div>
              <FaChevronRight className="chevron-icon" />
            </button>
          </div>
        </div>

        {/* Footer Logout */}
        <div className="right-menu-footer">
          <button
            className="logout-btn"
            onClick={() => {
              onLogout();
              onClose();
            }}
          >
            <FaSignOutAlt />
            <span>Log Out</span>
          </button>
          <div style={{ textAlign: "center", marginTop: "16px", fontSize: "11px", color: "#94a3b8", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            Your data is safe with us
          </div>
        </div>
      </div>
    </div>
  );
};

export default RightSideMenu;