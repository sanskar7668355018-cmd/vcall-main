import { createContext, useState, useContext, useEffect, useCallback } from "react"
import axios from "axios"

const AuthContext = createContext()
const API_URL = process.env.REACT_APP_API_URL;

console.log("THE API URL IS:", API_URL);

export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const [credits, setCredits] = useState(0)
  const [token, setToken] = useState(localStorage.getItem("authToken") || null)

  // ✅ fetchCredits wrapped in useCallback to prevent it from being a dependency that causes loops
  const fetchCredits = useCallback(async (currentToken) => {
    const activeToken = currentToken || token;
    if (!activeToken) return 0;
    
    try {
      const res = await axios.get(`${API_URL}/api/payments/credits`, {
        headers: { Authorization: `Bearer ${activeToken}` }
      });
      setCredits(res.data.credits);
      return res.data.credits;
    } catch (error) {
      console.error("Error fetching credits:", error);
      return 0;
    }
  }, [token]);

  // ✅ 1. EFFECT FOR INITIAL LOAD ONLY
  // This runs once when the app starts. It stops the infinite loop.
  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem("authToken");
      if (!savedToken) {
        setLoading(false);
        return;
      }

      try {
        const res = await axios.get(`${API_URL}/api/auth/status`, {
          headers: { Authorization: `Bearer ${savedToken}` }
        });

        if (res.data.isAuthenticated) {
          setCurrentUser(res.data.user);
          setIsAuthenticated(true);
          setToken(savedToken);
          fetchCredits(savedToken);
        } else {
          handleLogoutLocal();
        }
      } catch (error) {
        console.error("Initial auth check failed:", error);
        handleLogoutLocal();
      } finally {
        setLoading(false);
      }
    };

    initAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty array = run once on mount only

  // ✅ 2. EFFECT TO SYNC TOKEN TO LOCALSTORAGE
  useEffect(() => {
    if (token) {
      localStorage.setItem("authToken", token);
    } else {
      localStorage.removeItem("authToken");
    }
  }, [token]);

  const handleLogoutLocal = () => {
    setToken(null);
    setCurrentUser(null);
    setIsAuthenticated(false);
    setCredits(0);
    localStorage.removeItem("authToken");
  };

  const login = async (email, password) => {
    try {
      const res = await axios.post(`${API_URL}/api/auth/login`, { email, password });
      const newToken = res.data.token;
      setToken(newToken);
      setCurrentUser(res.data.user);
      setIsAuthenticated(true);
      await fetchCredits(newToken);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Login failed",
      };
    }
  };

  const signup = async (name, email, password) => {
    try {
      const res = await axios.post(`${API_URL}/api/auth/signup`, { name, email, password });
      const newToken = res.data.token;
      setToken(newToken);
      setCurrentUser(res.data.user);
      setIsAuthenticated(true);
      await fetchCredits(newToken);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Signup failed",
      };
    }
  };

  const deductCredits = async () => {
    const activeToken = token || localStorage.getItem("authToken");
    if (!activeToken) return { success: false, message: "No token found" };

    try {
      const res = await axios.post(`${API_URL}/api/payments/deduct`, {}, {
        headers: { Authorization: `Bearer ${activeToken}` }
      });

      if (res.data.success) {
        setCredits(res.data.credits);
        return { success: true, credits: res.data.credits };
      }
      return { success: false, message: res.data.message };
    } catch (error) {
      return { success: false, message: "Deduction failed" };
    }
  };

  const logout = async () => {
    try {
      await axios.post(`${API_URL}/api/auth/logout`, {});
    } catch (err) {
      console.error("Logout request failed", err);
    } finally {
      handleLogoutLocal();
    }
  };

  const value = {
    currentUser,
    isAuthenticated,
    loading,
    credits,
    login,
    signup,
    logout,
    fetchCredits,
    deductCredits,
    hasEnoughCredits: () => credits > 0
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}