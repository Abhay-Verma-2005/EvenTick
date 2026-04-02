import Navbar from "./Navbar";
import { useAuth } from "../context/AuthContext";
import { Navigate } from "react-router-dom";
import ProviderDashboard from "./components/ProviderDashboard";
import OrganiserDashboard from "./components/OrganiserDashboard";
import UserDashboard from "./components/UserDashboard";
import "./styles/dash.css";
import {
  FaTicketAlt, FaMapMarkerAlt, FaCalendarAlt, FaMoneyBillWave,
  FaUserCircle, FaHashtag, FaBan, FaChair, FaExternalLinkAlt,
  FaCheckCircle, FaTimesCircle, FaQrcode,
} from "react-icons/fa";

const ROLE_CONFIG = {
  PROVIDER: {
    label: "Venue Provider",
    icon: <FaMapMarkerAlt size={16} />,
  },
  ORGANISER: {
    label: "Event Organiser",
    icon: <FaCalendarAlt size={16} />,
  },
  USER: {
    label: "Ticket Buyer",
    icon: <FaTicketAlt size={16} />,
  },
};

const Dashboard = () => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) return <Navigate to="/login" />;

  const role = user?.user?.role || "USER";
  const cfg = ROLE_CONFIG[role] || ROLE_CONFIG.USER;

  return (
    <div className="light-page">
      <Navbar lightLogo />

      <div className="dashboard-layout">

        <aside className="dashboard-sidebar">
          <div className="sidebar-top">
            <img
              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.user?.name || "U")}&background=7c3aed&color=fff&bold=true`}
              alt="avatar"
              className="avatar-dash"
            />
            <p className="user-name">{user?.user?.name}</p>
            <p className="user-email">{user?.user?.email}</p>
            <span className="role-badge">{cfg.icon} {cfg.label}</span>
          </div>

          <div className="sidebar-label">Navigation</div>
        <div className="sidebar-item active">
          {role === "PROVIDER" && (
            <>
              <FaMapMarkerAlt size={16} />
              <span>My Venues</span>
            </>
          )}
          {role === "ORGANISER" && (
            <>
              <FaCalendarAlt size={16} />
              <span>My Events</span>
            </>
          )}
          {role === "USER" && (
            <>
              <FaTicketAlt size={16} />
              <span>My Tickets</span>
            </>
          )}
        </div>
        </aside>

        <main className="dashboard-main">
          <div className="dashboard-header">
            <h1 className="dashboard-title">{cfg.icon} {cfg.label} Dashboard</h1>
          </div>

          {role === "PROVIDER" && <ProviderDashboard />}
          {role === "ORGANISER" && <OrganiserDashboard />}
          {role === "USER" && <UserDashboard />}
        </main>

      </div>
    </div>
  );
};

export default Dashboard;