import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import "./index.css";

import { AuthProvider, useAuth } from "./context/AuthContext";
import LandingPage from "./pages/LandingPage";
import UserDashboard from "./pages/UserDashboard";
import EventOwnerDashboard from "./pages/EventOwnerDashboard";

const LoadingScreen = () => (
  <div style={{
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    background: "#05030f",
    color: "#ffffff"
  }}>
    <div style={{
      width: "44px",
      height: "44px",
      border: "3px solid rgba(124, 58, 237, 0.2)",
      borderTopColor: "#7c3aed",
      borderRadius: "50%",
      animation: "spin 0.8s linear infinite"
    }} />
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

// Dashboard switcher based on role
const DashboardSwitcher = () => {
  const { user } = useAuth();
  if (user?.role === "host" || user?.role === "EVENT_ORGANISER") {
    return <EventOwnerDashboard />;
  }
  return <UserDashboard />;
};

// Protected Route — redirects to "/" if not logged in
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  return user ? children : <Navigate to="/" replace />;
};

// Public Route — redirects to "/dashboard" if already logged in
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  return user ? <Navigate to="/dashboard" replace /> : children;
};

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<PublicRoute><LandingPage /></PublicRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><DashboardSwitcher /></ProtectedRoute>} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);