import React from "react";
import { FaCalendarAlt, FaMapMarkerAlt, FaMoneyBillWave, FaTimesCircle, FaUser, FaQrcode, FaStar } from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";
import "../styles/ticket.css";

const TicketLayout = ({ ticket, onCancel, cancelTarget, setCancelTarget }) => {
  const { user } = useAuth();
  const ev = ticket.eventId;
  if (!ev) return null;
  const isCancelled = ticket.cancelled;

  const fmt = (d) => new Date(d).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });

  const themeImg = ev.ticketTheme || "";

  return (
    <div className={`premium-ticket-wrap ${isCancelled ? "ticket-gray" : ""}`}>
      {themeImg && (
        <div className="pt-theme-bg" aria-hidden="true">
          <img src={themeImg} alt="" className="pt-theme-bg-img" />
        </div>
      )}
      <div className="pt-left">
        <div className="pt-header">
          <div className="pt-title-col">
            <h3 className="pt-title">{ev.title}</h3>
            <p className="pt-admit-name">
              <FaUser className="pt-admit-icon" />
              Admit One: <strong>{user?.user?.name || "Guest"}</strong>
            </p>
          </div>
          <span className={`pt-badge ${isCancelled ? "pt-badge-cancelled" : "pt-badge-active"}`}>
            {isCancelled ? "Cancelled" : "Valid Pass"}
          </span>
        </div>

        <div className="pt-details">
          <div className="pt-detail-item">
            <div className="pt-icon-wrap"><FaCalendarAlt className="pt-icon" /></div>
            <div className="pt-detail-text">
              <span className="pt-detail-label">Date & Time</span>
              <span className="pt-detail-value">{fmt(ev.date)}</span>
            </div>
          </div>
          <div className="pt-detail-item">
            <div className="pt-icon-wrap"><FaMapMarkerAlt className="pt-icon" /></div>
            <div className="pt-detail-text">
              <span className="pt-detail-label">Venue & Address</span>
              <span className="pt-detail-value">
                {ev.venueId?.name || "Unknown Venue"}
                {ev.venueId?.address ? ` — ${ev.venueId.address}` : ev.venueId?.city ? `, ${ev.venueId.city}` : ""}
              </span>
            </div>
          </div>
          <div className="pt-detail-item">
            <div className="pt-icon-wrap"><FaMoneyBillWave className="pt-icon" /></div>
            <div className="pt-detail-text">
              <span className="pt-detail-label">Amount Paid</span>
              <span className="pt-detail-value">
                ₹{Number(ev.ticketPrice || 0).toLocaleString()}
                <span className="pt-payment-status"> · {ticket.paymentStatus || "SUCCESS"}</span>
              </span>
            </div>
          </div>
        </div>

        <div className="pt-meta-row">
          <div className="pt-meta-col">
            <span className="pt-meta-label">Booking ID</span>
            <span className="pt-meta-val">{ticket.bookingId?.split("-")[0].toUpperCase()}</span>
          </div>
          <div className="pt-meta-right">
            {!isCancelled && (
              cancelTarget === ticket._id ? (
                <div className="pt-cancel-confirm">
                  <span className="pt-confirm-msg">Cancel this booking?</span>
                  <button className="tab-btn tab-btn-danger tab-btn-sm" onClick={() => onCancel(ticket._id)}>Yes, Cancel</button>
                  <button className="tab-btn tab-btn-secondary tab-btn-sm" onClick={() => setCancelTarget(null)}>Keep</button>
                </div>
              ) : (
                <button className="pt-cancel-btn" onClick={() => setCancelTarget(ticket._id)}>
                  <FaTimesCircle size={13} /> Cancel Ticket
                </button>
              )
            )}
          </div>
        </div>
      </div>

      <div className="pt-divider">
        <div className="pt-notch pt-notch-top"></div>
        <div className="pt-notch pt-notch-bottom"></div>
      </div>

      <div className="pt-right">
        <div className="pt-vip-band"><FaStar size={10} /> ACCESS</div>
        {ticket.qrCode ? (
          <img src={ticket.qrCode} alt="QR Code" className="pt-qr" />
        ) : (
          <div className="pt-no-qr"><FaQrcode size={32} /></div>
        )}
        <p className="pt-scan">Scan for Entry</p>
      </div>
    </div>
  );
};

export default TicketLayout;
