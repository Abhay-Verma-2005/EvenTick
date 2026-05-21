import { useState, useEffect } from "react";
import { getMyTickets, cancelTicket } from "../../api/bookings";
import { FaTicketAlt, FaCalendarAlt, FaMapMarkerAlt, FaMoneyBillWave, FaTimesCircle } from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";
import TicketLayout from "./TicketLayout";

const UserDashboard = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [cancelTarget, setCancelTarget] = useState(null);

  useEffect(() => { loadTickets(); }, []);

  const loadTickets = async () => {
    try {
      const data = await getMyTickets();
      if (Array.isArray(data)) setTickets(data);
    } catch (err) {
      console.error("Failed to load tickets", err);
    }
  };

  const handleCancel = async (id) => {
    await cancelTicket(id);
    setCancelTarget(null);
    loadTickets();
  };

  const fmt = (d) => new Date(d).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });

  const active = tickets.filter(t => !t.cancelled && t.eventId);
  const cancelledCount = tickets.filter(t => t.cancelled).length;

  return (
    <div>
      <div className="user-dash-top">
        <div className="user-dash-welcome">
          <p className="welcome-greeting">Great to see you again!</p>
          <h2 className="welcome-name">Welcome back, <span>{user?.user?.name || "User"}</span></h2>
        </div>
        <div className="stats-row user-dash-stats">
          <div className="stat-card">
            <div className="stat-card-icon"><FaTicketAlt size={18} color="#7c3aed" /></div>
            <div className="stat-value">{tickets.length}</div>
            <div className="stat-label">Total Bookings</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-icon"><FaCalendarAlt size={18} color="#7c3aed" /></div>
            <div className="stat-value">{active.length}</div>
            <div className="stat-label">Active Bookings</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-icon"><FaTimesCircle size={18} color="#7c3aed" /></div>
            <div className="stat-value">{cancelledCount}</div>
            <div className="stat-label">Cancelled Bookings</div>
          </div>
        </div>
      </div>

      {tickets.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon-color">
            <FaTicketAlt size={32} />
          </div>
          <h3>No Bookings Yet</h3>
          <p>You haven't booked any tickets yet. Past and active bookings will appear here.</p>
        </div>
      ) : (
        <div className="cards-list">
          {tickets.map(t => (
            <TicketLayout
              key={t._id}
              ticket={t}
              onCancel={handleCancel}
              cancelTarget={cancelTarget}
              setCancelTarget={setCancelTarget}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default UserDashboard;