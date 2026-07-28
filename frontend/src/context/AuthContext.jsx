import { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Check user session on app load
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("eventick_token");
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const response = await api.get("/profile");
        if (response.data?.success && response.data?.user) {
          setUser(response.data.user);
        } else if (response.data?._id || response.data?.email) {
          setUser(response.data);
        } else {
          setUser(null);
        }
      } catch (err) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Login handler
  const login = async (email, password, role = "user") => {
    // Standardize role to lowercase ("user" or "host")
    const backendRole = role.toLowerCase() === "event_organiser" || role.toLowerCase() === "host" ? "host" : "user";
    
    const response = await api.post(`/login/${backendRole}`, { email, password });
    if (response.data?.data) {
      if (response.data?.token) {
        localStorage.setItem("eventick_token", response.data.token);
      }
      setUser(response.data.data);
      navigate("/dashboard");
    }
    return response.data;
  };

  // Signup handler
  const signup = async (userData, role = "user") => {
    const backendRole = role.toLowerCase() === "event_organiser" || role.toLowerCase() === "host" ? "host" : "user";

    const response = await api.post(`/signup/${backendRole}`, userData);
    if (response.data?.data) {
      if (response.data?.token) {
        localStorage.setItem("eventick_token", response.data.token);
      }
      setUser(response.data.data);
      navigate("/dashboard");
    }
    return response.data;
  };

  // Update profile handler
  const updateProfile = async (updateData) => {
    const response = await api.patch("/profile", updateData);
    if (response.data?.data) {
      setUser(response.data.data);
    }
    return response.data;
  };

  // Upload profile picture (Cloudinary)
  const uploadProfilePic = async (base64Image) => {
    const response = await api.post("/upload-profile-pic", { image: base64Image });
    if (response.data?.data) {
      setUser(response.data.data);
    }
    return response.data;
  };

  // Remove profile picture
  const removeProfilePic = async () => {
    const response = await api.delete("/remove-profile-pic");
    if (response.data?.data) {
      setUser(response.data.data);
    }
    return response.data;
  };

  // Logout handler
  const logout = async () => {
    try {
      await api.post("/logout");
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      localStorage.removeItem("eventick_token");
      setUser(null);
      navigate("/");
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, updateProfile, uploadProfilePic, removeProfilePic }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthContext;
