import React, { useEffect, useMemo, useState } from "react";
import { FaTimes, FaArrowLeft, FaTicketAlt, FaMapMarkerAlt, FaCalendarAlt, FaChevronRight } from "react-icons/fa";
import { getMyTickets, cancelTicket } from "../api/eventApi";
import "../styles/rightSideMenu.css"; // Reuse right-menu styles

const parseEventDateTime = (dateStr, timeStr) => {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  if (timeStr) {
    const timeMatch = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (timeMatch) {
      let [_, hours, minutes, ampm] = timeMatch;
      hours = parseInt(hours, 10);
      minutes = parseInt(minutes, 10);
      if (ampm.toUpperCase() === "PM" && hours < 12) hours += 12;
      if (ampm.toUpperCase() === "AM" && hours === 12) hours = 0;
      date.setHours(hours, minutes, 0, 0);
    } else {
      const time24Match = timeStr.match(/(\d+):(\d+)/);
      if (time24Match) {
         date.setHours(parseInt(time24Match[1], 10), parseInt(time24Match[2], 10), 0, 0);
      }
    }
  }
  return date;
};

const TicketsOverlay = ({ isOpen, onClose, onBack, user }) => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("upcoming"); // "upcoming" | "past"
  const [selectedTicket, setSelectedTicket] = useState(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      fetchTickets();
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const res = await getMyTickets();
      if (res.data) setTickets(res.data);
    } catch (err) {
      console.error("Failed to fetch tickets:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (e, bookingId) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to cancel this ticket?")) return;
    try {
      await cancelTicket(bookingId);
      fetchTickets();
      setSelectedTicket(null);
    } catch (err) {
      console.error("Failed to cancel ticket:", err);
      alert("Failed to cancel ticket.");
    }
  };

  // Upcoming = event date is today or later, Past = event date already happened.
  // (A cancelled ticket for a future event still shows under Upcoming, grayed out.)
  const { upcomingTickets, pastTickets } = useMemo(() => {
    const now = new Date();
    const upcoming = [];
    const past = [];
    tickets.forEach((t) => {
      const eventDate = parseEventDateTime(t.eventId?.date, t.eventId?.time);
      if (eventDate && eventDate < now) {
        past.push(t);
      } else {
        upcoming.push(t);
      }
    });
    return { upcomingTickets: upcoming, pastTickets: past };
  }, [tickets]);

  const visibleTickets = activeTab === "upcoming" ? upcomingTickets : pastTickets;

  if (!isOpen) return null;

  const statusLabel = (status) => {
    if (status === "cancelled") return "CANCELLED";
    if (status === "expired") return "EXPIRED";
    return "BOOKED";
  };

  const isCancellable = (ticket) => {
    if (!ticket) return false;
    if (ticket.status === "cancelled" || ticket.status === "expired") return false;
    const eventDate = parseEventDateTime(ticket.eventId?.date, ticket.eventId?.time);
    if (!eventDate) return true;
    const now = new Date();
    return (eventDate.getTime() - now.getTime()) > 60 * 60 * 1000; // More than 1 hour away
  };

  return (
    <div className="right-menu-overlay">
      <div className="right-menu-panel">
        {/* Header — back arrow, centered title, close X */}
        <div className="sub-panel-header">
          <button className="sub-panel-icon-btn" onClick={() => {
            if (selectedTicket) setSelectedTicket(null);
            else if (onBack) onBack();
            else onClose();
          }} title="Back">
            <FaArrowLeft />
          </button>
          <h2 className="sub-panel-title">{selectedTicket ? "Ticket Details" : "My Tickets"}</h2>
          <button className="sub-panel-icon-btn" onClick={onClose} title="Close">
            <FaTimes />
          </button>
        </div>

        {selectedTicket ? (
          <div className="ticket-details-container" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px", overflowY: "auto", flex: 1 }}>
            <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
              <h3 style={{ margin: "0 0 16px 0", fontSize: "18px", color: "#1e293b", borderBottom: "1px solid #e2e8f0", paddingBottom: "12px" }}>Attendee Info</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <div style={{ fontSize: "12px", color: "#64748b", textTransform: "uppercase", fontWeight: "600", marginBottom: "4px" }}>User Name</div>
                  <div style={{ fontSize: "14px", color: "#0f172a", fontWeight: "500", textTransform: "uppercase" }}>
                    {user ? `${user.firstName || ""} ${user.lastName || ""}`.trim() : "Unknown"}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: "12px", color: "#64748b", textTransform: "uppercase", fontWeight: "600", marginBottom: "4px" }}>Email</div>
                  <div style={{ fontSize: "14px", color: "#0f172a", fontWeight: "500", wordBreak: "break-all" }}>{user?.email || "Unknown"}</div>
                </div>
              </div>
            </div>

            <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
              <h3 style={{ margin: "0 0 16px 0", fontSize: "18px", color: "#1e293b", borderBottom: "1px solid #e2e8f0", paddingBottom: "12px" }}>Booking Details</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div>
                  <div style={{ fontSize: "12px", color: "#64748b", textTransform: "uppercase", fontWeight: "600", marginBottom: "4px" }}>Ticket ID</div>
                  <div style={{ fontSize: "14px", color: "#0f172a", fontWeight: "500", wordBreak: "break-all" }}>{selectedTicket.ticketNumber}</div>
                </div>
                <div>
                  <div style={{ fontSize: "12px", color: "#64748b", textTransform: "uppercase", fontWeight: "600", marginBottom: "4px" }}>Quantity</div>
                  <div style={{ fontSize: "14px", color: "#0f172a", fontWeight: "500" }}>{selectedTicket.quantity} Ticket(s)</div>
                </div>
                <div>
                  <div style={{ fontSize: "12px", color: "#64748b", textTransform: "uppercase", fontWeight: "600", marginBottom: "4px" }}>Total Price</div>
                  <div style={{ fontSize: "14px", color: "#10b981", fontWeight: "600" }}>${selectedTicket.totalPrice}</div>
                </div>
                <div>
                  <div style={{ fontSize: "12px", color: "#64748b", textTransform: "uppercase", fontWeight: "600", marginBottom: "4px" }}>Status</div>
                  <div style={{ fontSize: "14px", color: "#0f172a", fontWeight: "500", textTransform: "capitalize" }}>{statusLabel(selectedTicket.status)}</div>
                </div>
              </div>
            </div>

            <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
              <h3 style={{ margin: "0 0 16px 0", fontSize: "18px", color: "#1e293b", borderBottom: "1px solid #e2e8f0", paddingBottom: "12px" }}>Event Information</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "16px" }}>
                <div>
                  <div style={{ fontSize: "12px", color: "#64748b", textTransform: "uppercase", fontWeight: "600", marginBottom: "4px" }}>Event Name</div>
                  <div style={{ fontSize: "15px", color: "#0f172a", fontWeight: "600" }}>{selectedTicket.eventId?.title || "Unknown"}</div>
                </div>
                <div>
                  <div style={{ fontSize: "12px", color: "#64748b", textTransform: "uppercase", fontWeight: "600", marginBottom: "4px" }}>Event ID</div>
                  <div style={{ fontSize: "14px", color: "#0f172a", fontWeight: "500", wordBreak: "break-all" }}>{selectedTicket.eventId?._id || "Unknown"}</div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <div style={{ fontSize: "12px", color: "#64748b", textTransform: "uppercase", fontWeight: "600", marginBottom: "4px" }}>Date</div>
                    <div style={{ fontSize: "14px", color: "#0f172a", fontWeight: "500" }}>
                      {selectedTicket.eventId?.date ? new Date(selectedTicket.eventId.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" }) : "TBA"}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: "12px", color: "#64748b", textTransform: "uppercase", fontWeight: "600", marginBottom: "4px" }}>Time</div>
                    <div style={{ fontSize: "14px", color: "#0f172a", fontWeight: "500" }}>
                       {selectedTicket.eventId?.time || "TBA"}
                    </div>
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <div style={{ fontSize: "12px", color: "#64748b", textTransform: "uppercase", fontWeight: "600", marginBottom: "4px" }}>Venue</div>
                    <div style={{ fontSize: "14px", color: "#0f172a", fontWeight: "500" }}>{selectedTicket.eventId?.venue || "TBA"}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: "12px", color: "#64748b", textTransform: "uppercase", fontWeight: "600", marginBottom: "4px" }}>City</div>
                    <div style={{ fontSize: "14px", color: "#0f172a", fontWeight: "500" }}>{selectedTicket.eventId?.city || "TBA"}</div>
                  </div>
                </div>
              </div>
            </div>
            
            {isCancellable(selectedTicket) && (
              <button 
                onClick={(e) => handleCancel(e, selectedTicket._id)}
                style={{
                  marginTop: "8px",
                  padding: "14px",
                  backgroundColor: "#fee2e2",
                  color: "#dc2626",
                  border: "none",
                  borderRadius: "8px",
                  fontWeight: "600",
                  cursor: "pointer",
                  fontSize: "15px",
                  transition: "background 0.2s"
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = "#fca5a5"}
                onMouseOut={(e) => e.target.style.backgroundColor = "#fee2e2"}
              >
                Cancel Ticket
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Upcoming / Past pill tabs */}
            <div className="pill-tabs-row">
              <button
                className={`pill-tab ${activeTab === "upcoming" ? "active" : ""}`}
                onClick={() => setActiveTab("upcoming")}
              >
                Upcoming
              </button>
              <button
                className={`pill-tab ${activeTab === "past" ? "active" : ""}`}
                onClick={() => setActiveTab("past")}
              >
                Past
              </button>
            </div>

            {/* Ticket list */}
            <div className="ticket-list-container">
          {loading ? (
            <div className="ticket-loading-state">
              <div className="loading-spinner" />
              Loading tickets...
            </div>
          ) : visibleTickets.length === 0 ? (
            <div className="ticket-empty-state">
              <div className="ticket-empty-icon">
                <FaTicketAlt style={{ fontSize: "32px", color: "#cbd5e1" }} />
              </div>
              <div>
                <h3 style={{ color: "#0f172a", margin: "0 0 8px", fontSize: "18px" }}>
                  {activeTab === "upcoming" ? "No upcoming tickets" : "No past tickets"}
                </h3>
                <p style={{ margin: 0, fontSize: "14px" }}>
                  {activeTab === "upcoming"
                    ? "You haven't booked any upcoming events yet."
                    : "Your past bookings will show up here."}
                </p>
              </div>
            </div>
          ) : (
            visibleTickets.map((ticket) => {
              const isInactive = ticket.status === "cancelled" || ticket.status === "expired";
              return (
                <div key={ticket._id} className={`ticket-card ${isInactive ? "ticket-inactive" : ""}`}>
                  <div className="ticket-banner">
                    <img
                      className="ticket-banner-img"
                      src={ticket.eventId?.posterUrl || ticket.eventId?.imageUrl}
                      alt="Event"
                    />
                    <div className={`ticket-status-tag ${ticket.status}`}>
                      {statusLabel(ticket.status)}
                    </div>
                  </div>

                  <div className="ticket-body">
                    <div className="ticket-title-row">
                      <h3 className="ticket-event-title">{ticket.eventId?.title || "Unknown Event"}</h3>
                      <span className="ticket-qty-badge">QTY: {ticket.quantity}</span>
                    </div>

                    <div className="ticket-meta-row">
                      <FaCalendarAlt />
                      {ticket.eventId?.date
                        ? new Date(ticket.eventId.date).toLocaleDateString("en-US", {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        : "Date TBA"}
                    </div>

                    <div className="ticket-meta-row">
                      <FaMapMarkerAlt />
                      {ticket.eventId?.city} • {ticket.eventId?.venue}
                    </div>

                    <div className="ticket-footer-row" onClick={() => setSelectedTicket(ticket)} style={{ cursor: "pointer" }}>
                      <div>
                        <div className="ticket-number-label">Ticket Number</div>
                        <div className="ticket-number-value">{ticket.ticketNumber}</div>
                      </div>
                      <button className="ticket-chevron-btn" title="View ticket details">
                        <FaChevronRight />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
          </>
        )}
      </div>
    </div>
  );
};

export default TicketsOverlay;