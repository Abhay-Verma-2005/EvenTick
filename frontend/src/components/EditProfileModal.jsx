import { useState, useRef, useEffect } from "react";
import { FaCalendarAlt, FaTimes, FaUser, FaMapMarkerAlt, FaLock, FaCamera, FaTrash, FaSpinner, FaUserEdit } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import "../styles/rightSideMenu.css"; // We are now a right side menu
import "../styles/authModal.css"; // Keep authModal.css for input field styling if needed

const EditProfileModal = ({ isOpen, onClose }) => {
  const { user, updateProfile, uploadProfilePic, removeProfilePic } = useAuth();
  const fileInputRef = useRef(null);

  const formatDateForInput = (dob) => {
    if (!dob) return "";
    const d = new Date(dob);
    if (isNaN(d.getTime())) return "";
    return d.toISOString().split("T")[0];
  };

  const isDefaultPhoto = !user?.photoUrl || user?.photoUrl === "https://geographyandyou.com/images/user-profile.png";

  const [firstName, setFirstName] = useState(user?.firstName || "");
  const [lastName, setLastName] = useState(user?.lastName || "");
  const [city, setCity] = useState(user?.city || "");
  const [dateOfBirth, setDateOfBirth] = useState(formatDateForInput(user?.dateOfBirth));
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [uploadingImg, setUploadingImg] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Handle image file selection
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type & size (max 5MB)
    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Image size must be less than 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const base64Image = reader.result;
      try {
        setUploadingImg(true);
        setError("");
        setSuccessMsg("");
        const res = await uploadProfilePic(base64Image);
        setSuccessMsg(res.message || "Profile picture updated successfully!");
      } catch (err) {
        const serverMsg = err.response?.data?.message || err.message || "Failed to upload image.";
        setError(serverMsg);
      } finally {
        setUploadingImg(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle remove image
  const handleRemovePhoto = async () => {
    try {
      setUploadingImg(true);
      setError("");
      setSuccessMsg("");
      const res = await removeProfilePic();
      setSuccessMsg(res.message || "Profile picture removed successfully!");
    } catch (err) {
      const serverMsg = err.response?.data?.message || err.message || "Failed to remove image.";
      setError(serverMsg);
    } finally {
      setUploadingImg(false);
    }
  };

  // Handle text details update
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    const updateData = {};
    if (firstName && firstName !== user?.firstName) updateData.firstName = firstName;
    if (lastName !== undefined && lastName !== user?.lastName) updateData.lastName = lastName;
    if (city !== undefined && city !== user?.city) updateData.city = city;
    if (dateOfBirth && formatDateForInput(user?.dateOfBirth) !== dateOfBirth) updateData.dateOfBirth = dateOfBirth;
    if (password.trim().length > 0) updateData.password = password;

    if (Object.keys(updateData).length === 0) {
      setError("No text changes detected to update.");
      return;
    }

    try {
      setLoading(true);
      const res = await updateProfile(updateData);
      setSuccessMsg(res.message || "Profile updated successfully!");
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err) {
      const serverMsg = err.response?.data?.message || err.message || "Failed to update profile.";
      setError(serverMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => { document.body.style.overflow = "unset"; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="right-menu-overlay" style={{ zIndex: 10000 }}>
      <div className="right-menu-panel ticket-panel-wide">
        {/* Header */}
        <div className="right-menu-header">
          <div className="user-profile-summary">
            <div style={{ color: "#db2777", display: "flex", alignItems: "center", justifyContent: "center", marginRight: "12px" }}>
              <FaUserEdit size={28} />
            </div>
            <div className="user-info-text">
              <span className="user-full-name">Edit Profile</span>
              <span className="user-email">Update your personal information</span>
            </div>
          </div>
          <button className="right-menu-close" onClick={onClose} type="button" title="Close menu">
            <FaTimes />
          </button>
        </div>

        {/* Content */}
        <div className="right-menu-content" style={{ padding: "30px 20px", overflowY: "auto" }}>
          {/* Profile Picture */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "20px" }}>
            <div style={{ position: "relative", width: "92px", height: "92px", borderRadius: "50%", background: "linear-gradient(135deg, #7c3aed, #a855f7)", padding: "3px", boxShadow: "0 6px 20px rgba(124, 58, 237, 0.25)" }}>
              {user?.photoUrl && !isDefaultPhoto ? (
                <img src={user.photoUrl} alt="Profile" style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
              ) : (
                <div style={{ width: "100%", height: "100%", borderRadius: "50%", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8" }}>
                  <FaUser style={{ fontSize: "40px" }} />
                </div>
              )}
              {uploadingImg && (
                <div style={{ position: "absolute", inset: 0, borderRadius: "50%", backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
                  <FaSpinner style={{ animation: "spin 1s linear infinite", fontSize: "24px" }} />
                </div>
              )}
              <button type="button" onClick={() => fileInputRef.current?.click()} title="Upload photo" style={{ position: "absolute", bottom: "2px", right: "2px", width: "28px", height: "28px", borderRadius: "50%", backgroundColor: "#7c3aed", color: "#fff", border: "2px solid #fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 2px 8px rgba(0,0,0,0.2)" }}>
                <FaCamera style={{ fontSize: "12px" }} />
              </button>
            </div>
            <input type="file" ref={fileInputRef} accept="image/*" onChange={handleFileChange} style={{ display: "none" }} />
            <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
              <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploadingImg} style={{ padding: "5px 12px", fontSize: "12px", fontWeight: "600", color: "#7c3aed", backgroundColor: "#f5f3ff", border: "1px solid rgba(124,58,237,0.3)", borderRadius: "6px", cursor: "pointer" }}>
                {uploadingImg ? "Uploading..." : "Upload Photo"}
              </button>
              {!isDefaultPhoto && (
                <button type="button" onClick={handleRemovePhoto} disabled={uploadingImg} style={{ padding: "5px 12px", fontSize: "12px", fontWeight: "600", color: "#ef4444", backgroundColor: "#fef2f2", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "6px", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
                  <FaTrash style={{ fontSize: "10px" }} /> Remove
                </button>
              )}
            </div>
          </div>

          {/* Messages */}
          {error && (
            <div style={{ margin: "0 0 16px", padding: "8px 12px", borderRadius: "6px", backgroundColor: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444", fontSize: "0.85rem", textAlign: "center" }}>
              {error}
            </div>
          )}
          {successMsg && (
            <div style={{ margin: "0 0 16px", padding: "8px 12px", borderRadius: "6px", backgroundColor: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.3)", color: "#4ade80", fontSize: "0.85rem", textAlign: "center" }}>
              {successMsg}
            </div>
          )}

          {/* Form */}
          <div className="auth-body">
            <form className="auth-form fade-slide" onSubmit={handleSubmit}>
              <div className="auth-row">
                <div className="auth-field">
                  <label>First Name</label>
                  <input type="text" placeholder="First Name" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
                </div>
                <div className="auth-field">
                  <label>Last Name</label>
                  <input type="text" placeholder="Last Name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
                </div>
              </div>
              <div className="auth-field">
                <label>City</label>
                <div className="auth-dob-wrapper">
                  <FaMapMarkerAlt className="auth-dob-icon" />
                  <input type="text" placeholder="e.g. Mumbai, Delhi, Bengaluru" value={city} onChange={(e) => setCity(e.target.value)} style={{ paddingLeft: "40px" }} />
                </div>
              </div>
              <div className="auth-field">
                <label>Date of Birth</label>
                <div className="auth-dob-wrapper">
                  <FaCalendarAlt className="auth-dob-icon" />
                  <input type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} required />
                </div>
              </div>
              <div className="auth-field">
                <label>New Password (Optional)</label>
                <div className="auth-dob-wrapper">
                  <FaLock className="auth-dob-icon" />
                  <input type="password" placeholder="Leave blank to keep current password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ paddingLeft: "40px" }} />
                </div>
              </div>
              <button className="auth-btn" type="submit" disabled={loading} style={{ marginTop: "12px" }}>
                {loading ? "Updating Profile..." : "Save Changes"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditProfileModal;

