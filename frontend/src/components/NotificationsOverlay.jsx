import React, { useEffect, useMemo, useState } from "react";
import { FaTimes, FaArrowLeft, FaBell } from "react-icons/fa";
import { getMyNotifications, markNotificationAsRead } from "../api/eventApi";
import "../styles/rightSideMenu.css"; // Reuse right-menu styles

const NotificationsOverlay = ({ isOpen, onClose, onBack }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("all"); // "all" | "unread"

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      fetchNotifications();
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await getMyNotifications();
      if (res.data) setNotifications(res.data);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRead = async (id) => {
    try {
      await markNotificationAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      console.error("Failed to mark as read:", err);
    }
  };

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.isRead).length,
    [notifications]
  );

  const visibleNotifications = useMemo(
    () => (activeTab === "unread" ? notifications.filter((n) => !n.isRead) : notifications),
    [notifications, activeTab]
  );

  if (!isOpen) return null;

  // Helper function to strip emojis from notification texts
  const stripEmojis = (str) => {
    if (!str) return "";
    return str.replace(/[\uD83C-\uDBFF\uDC00-\uDFFF\u2600-\u27BF]/g, "").trim();
  };

  const NotificationItem = ({ notif, onMarkRead }) => {
    // Extract ticket id from message if it exists: "(Ticket #: TKT-12345)" or similar
    const ticketMatch = notif.message.match(/Ticket\s*#:\s*([A-Z0-9-]+)/i);
    const ticketId = ticketMatch ? ticketMatch[1] : null;

    const handleTap = () => {
      if (!notif.isRead) {
        onMarkRead(notif._id);
      }
    };

    return (
      <div onClick={handleTap} className="notif-item-flat">
        <div className="notif-row">
          <div className="notif-heading-wrap">
            {!notif.isRead && <span className="notif-unread-dot" />}
            <h4 className="notif-heading">{stripEmojis(notif.title)}</h4>
          </div>
          <span className="notif-time">{timeAgo(notif.createdAt)}</span>
        </div>

        <p className="notif-message">{stripEmojis(notif.message)}</p>

        {ticketId && <span className="notif-ticket-id">tkt id: {ticketId}</span>}
      </div>
    );
  };

  return (
    <div className="right-menu-overlay">
      <div className="right-menu-panel">
        {/* Header — back arrow, centered title, close X */}
        <div className="sub-panel-header">
          <button className="sub-panel-icon-btn" onClick={onBack || onClose} title="Back">
            <FaArrowLeft />
          </button>
          <h2 className="sub-panel-title">Notifications</h2>
          <button className="sub-panel-icon-btn" onClick={onClose} title="Close">
            <FaTimes />
          </button>
        </div>

        {/* All / Unread underline tabs */}
        <div className="underline-tabs-row">
          <button
            className={`underline-tab ${activeTab === "all" ? "active" : ""}`}
            onClick={() => setActiveTab("all")}
          >
            All
          </button>
          <button
            className={`underline-tab ${activeTab === "unread" ? "active" : ""}`}
            onClick={() => setActiveTab("unread")}
          >
            Unread
            {unreadCount > 0 && <span className="underline-tab-badge">{unreadCount}</span>}
          </button>
        </div>

        {/* List */}
        <div className="notif-list">
          {loading ? (
            <div className="notif-loading">
              <div className="loading-spinner" />
              Loading notifications...
            </div>
          ) : visibleNotifications.length === 0 ? (
            <div className="notif-empty">
              <div className="notif-empty-icon">
                <FaBell style={{ fontSize: "32px", color: "#cbd5e1" }} />
              </div>
              <div>
                <h3 style={{ color: "#0f172a", margin: "0 0 8px", fontSize: "18px" }}>
                  {activeTab === "unread" ? "No unread notifications" : "All caught up!"}
                </h3>
                <p style={{ margin: 0, fontSize: "14px" }}>
                  {activeTab === "unread"
                    ? "You've read all your notifications."
                    : "You have no notifications yet."}
                </p>
              </div>
            </div>
          ) : (
            visibleNotifications.map((notif) => (
              <NotificationItem key={notif._id} notif={notif} onMarkRead={handleMarkRead} />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

// Simple relative time formatter e.g. "2m ago", "3h ago", "2d ago"
function timeAgo(dateString) {
  const date = new Date(dateString);
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  if (seconds < 60) return "now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default NotificationsOverlay;