import { useState } from "react";
import { FaCalendarAlt } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import "../styles/authModal.css";

const AuthModal = ({ role = "USER", onClose }) => {
  const [isLogin, setIsLogin] = useState(true);
  const { login, signup } = useAuth();

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [rePassword, setRePassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [errorField, setErrorField] = useState(null);
  const [successMsg, setSuccessMsg] = useState("");

  const detectErrorField = (msg) => {
    if (!msg) return null;
    const lower = msg.toLowerCase();
    if (lower.includes("email")) return "email";
    if (lower.includes("incorrect password") || lower.includes("password is not strong") || lower.includes("password must be")) return "password";
    if (lower.includes("match")) return "rePassword";
    if (lower.includes("first name")) return "firstName";
    if (lower.includes("date of birth")) return "dateOfBirth";
    return null;
  };

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setFirstName("");
    setLastName("");
    setDateOfBirth("");
    setRePassword("");
    setError("");
    setErrorField(null);
    setSuccessMsg("");
  };

  const clearFieldError = (field) => {
    if (errorField === field) {
      setErrorField(null);
      setError("");
    }
  };

  const handleToggleMode = (loginMode) => {
    setIsLogin(loginMode);
    resetForm();
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setErrorField(null);
    setSuccessMsg("");

    if (!email) {
      setError("Please enter your email.");
      setErrorField("email");
      return;
    }
    if (!password) {
      setError("Please enter your password.");
      setErrorField("password");
      return;
    }

    try {
      setLoading(true);
      await login(email, password, role);
      onClose();
    } catch (err) {
      const serverMsg = err.response?.data?.message || err.message || "Login failed. Please check credentials.";
      setError(serverMsg);
      setErrorField(detectErrorField(serverMsg));
    } finally {
      setLoading(false);
    }
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setErrorField(null);
    setSuccessMsg("");

    if (!firstName) {
      setError("First Name is required.");
      setErrorField("firstName");
      return;
    }
    if (!email) {
      setError("Email is required.");
      setErrorField("email");
      return;
    }
    if (!dateOfBirth) {
      setError("Date of Birth is required.");
      setErrorField("dateOfBirth");
      return;
    }
    if (!password) {
      setError("Password is required.");
      setErrorField("password");
      return;
    }

    if (password !== rePassword) {
      setError("Passwords do not match.");
      setErrorField("rePassword");
      return;
    }

    try {
      setLoading(true);
      await signup(
        {
          firstName,
          lastName,
          email,
          dateOfBirth,
          password,
        },
        role
      );
      onClose();
    } catch (err) {
      const serverMsg = err.response?.data?.message || err.message || "Signup failed. Please try again.";
      setError(serverMsg);
      setErrorField(detectErrorField(serverMsg));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-overlay" onClick={onClose}>
      <div 
        className={`auth-card ${isLogin ? "mode-login" : "mode-signup"} ${role === "EVENT_ORGANISER" ? "role-organiser" : "role-user"}`} 
        onClick={e => e.stopPropagation()}
      >
        <button className="auth-close" onClick={onClose} type="button">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>

        <div className="auth-header">
          <div className="auth-logo">
            <img src="/light-logo.png" alt="EvenTick" />
            <span>EvenTick</span>
          </div>
          {role === "EVENT_ORGANISER" && (
            <div className="auth-subtitle">Event Host Portal</div>
          )}
        </div>

        <div className="auth-tabs">
          <button
            className={`auth-tab ${isLogin ? "active" : ""}`}
            onClick={() => handleToggleMode(true)}
            type="button"
          >
            Log In
          </button>
          <button
            className={`auth-tab ${!isLogin ? "active" : ""}`}
            onClick={() => handleToggleMode(false)}
            type="button"
          >
            Sign Up
          </button>
          <div className={`auth-tab-line ${isLogin ? "left" : "right"}`} />
        </div>

        {error && !errorField && (
          <div style={{
            margin: "0 0 16px 0",
            padding: "8px 12px",
            borderRadius: "6px",
            backgroundColor: "rgba(239, 68, 68, 0.15)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            color: "#ef4444",
            fontSize: "0.85rem",
            textAlign: "center"
          }}>
            {error}
          </div>
        )}

        {successMsg && (
          <div style={{
            margin: "0 0 16px 0",
            padding: "8px 12px",
            borderRadius: "6px",
            backgroundColor: "rgba(34, 197, 94, 0.15)",
            border: "1px solid rgba(34, 197, 94, 0.3)",
            color: "#4ade80",
            fontSize: "0.85rem",
            textAlign: "center"
          }}>
            {successMsg}
          </div>
        )}

        <div className="auth-body">
          {isLogin ? (
            <form className="auth-form fade-slide" key="login" onSubmit={handleLoginSubmit}>
              <div className="auth-field">
                <label>Email</label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  className={errorField === "email" ? "input-error" : ""}
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    clearFieldError("email");
                  }}
                  required
                />
                {errorField === "email" && <span className="field-error-msg">{error}</span>}
              </div>

              <div className="auth-field">
                <label>Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  className={errorField === "password" ? "input-error" : ""}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    clearFieldError("password");
                  }}
                  required
                />
                {errorField === "password" && <span className="field-error-msg">{error}</span>}
              </div>

              <button className="auth-btn" type="submit" disabled={loading}>
                {loading ? "Logging in..." : "Log In"}
              </button>
            </form>
          ) : (
            <form className="auth-form fade-slide" key="signup" onSubmit={handleSignupSubmit}>
              <div className="auth-row">
                <div className="auth-field">
                  <label>First Name</label>
                  <input
                    type="text"
                    placeholder="John"
                    className={errorField === "firstName" ? "input-error" : ""}
                    value={firstName}
                    onChange={(e) => {
                      setFirstName(e.target.value);
                      clearFieldError("firstName");
                    }}
                    required
                  />
                  {errorField === "firstName" && <span className="field-error-msg">{error}</span>}
                </div>
                <div className="auth-field">
                  <label>Last Name</label>
                  <input
                    type="text"
                    placeholder="Doe"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </div>
              </div>

              <div className="auth-field">
                <label>Email</label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  className={errorField === "email" ? "input-error" : ""}
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    clearFieldError("email");
                  }}
                  required
                />
                {errorField === "email" && <span className="field-error-msg">{error}</span>}
              </div>

              <div className="auth-field">
                <label>Date of Birth</label>
                <div className="auth-dob-wrapper">
                  <FaCalendarAlt className="auth-dob-icon" />
                  <input
                    type="date"
                    className={errorField === "dateOfBirth" ? "input-error" : ""}
                    value={dateOfBirth}
                    onChange={(e) => {
                      setDateOfBirth(e.target.value);
                      clearFieldError("dateOfBirth");
                    }}
                    required
                  />
                </div>
                {errorField === "dateOfBirth" && <span className="field-error-msg">{error}</span>}
              </div>

              <div className="auth-field">
                <label>Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  className={errorField === "password" ? "input-error" : ""}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    clearFieldError("password");
                  }}
                  required
                />
                {errorField === "password" && <span className="field-error-msg">{error}</span>}
              </div>

              <div className="auth-field">
                <label>Re-enter Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  className={errorField === "rePassword" ? "input-error" : ""}
                  value={rePassword}
                  onChange={(e) => {
                    setRePassword(e.target.value);
                    clearFieldError("rePassword");
                  }}
                  required
                />
                {errorField === "rePassword" && <span className="field-error-msg">{error}</span>}
              </div>

              <button className="auth-btn" type="submit" disabled={loading}>
                {loading ? "Signing up..." : "Sign Up"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
