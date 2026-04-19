import { createContext, useState, useContext, useEffect } from "react"
import axios from "axios"

const AuthContext = createContext()

//const API_URL = "https://vcall-2vlg.onrender.com"
// Replace the hardcoded localhost with this:
const API_URL = process.env.REACT_APP_API_URL;

// This will tell us the truth in the console
console.log("THE API URL IS:", API_URL);

if (!API_URL) {
  console.error("ERROR: REACT_APP_API_URL is undefined! Vercel settings are wrong.");
}

const setupAxiosInterceptors = (token) => {
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete axios.defaults.headers.common['Authorization'];
  }
};

export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const [credits, setCredits] = useState(0)
  const [token, setToken] = useState(localStorage.getItem("authToken") || null)

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        if (!token) {
          setLoading(false);
          return;
        }

        // ✅ FIX: Manually pass the header here to ensure it's present
        const res = await axios.get(API_URL + "/api/auth/status", {
          headers: { Authorization: `Bearer ${token}` }
        })

        if (res.data.isAuthenticated) {
          setCurrentUser(res.data.user)
          setIsAuthenticated(true)
          // ✅ FIX: Pass the token to fetchCredits
          fetchCredits(token)
        } else {
          setToken(null);
        }
      } catch (error) {
        console.error("Authentication check failed:", error)
        setToken(null);
      } finally {
        setLoading(false)
      }
    }
    checkAuthStatus()
  }, [token])

  const fetchCredits = async (currentToken) => {
    try {
      const activeToken = currentToken || token;
      if (!activeToken) return 0;
      const res = await axios.get(API_URL + "/api/payments/credits", {
        headers: { Authorization: `Bearer ${activeToken}` }
      })
      setCredits(res.data.credits)
      return res.data.credits
    } catch (error) {
      console.error("Error fetching credits:", error)
      return 0
    }
  }

 const deductCredits = async () => {
    try {
      // ✅ FIX: Get the token from state or localStorage
      const activeToken = token || localStorage.getItem("authToken");

      if (!activeToken) {
        return { success: false, message: "No token, authorization denied" };
      }

      const res = await axios.post(API_URL + "/api/payments/deduct", {}, {
        headers: {
          Authorization: `Bearer ${activeToken}` // ✅ Manually add the token here
        }
      });

      if (res.data.success) {
        setCredits(res.data.credits);
        return { success: true, credits: res.data.credits };
      }
      return { success: false, message: res.data.message };
    } catch (error) {
      console.error("Deduct credits error:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Failed to deduct credits"
      };
    }
  };

  const hasEnoughCredits = () => {
    return credits > 0
  }

  const login = async (email, password) => {
    try {
      const res = await axios.post(API_URL + "/api/auth/login", { email, password });
      const newToken = res.data.token; // Get the token from response
      setToken(newToken); 
      setCurrentUser(res.data.user);
      setIsAuthenticated(true);
      await fetchCredits(newToken);
      return { success: true }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Login failed",
      }
    }
  };

  const signup = async (name, email, password) => {
  try {
    const res = await axios.post(API_URL + "/api/auth/signup", { name, email, password });
    
    // 1. Extract the token immediately
    const newToken = res.data.token; 
    
    // 2. Update state
    setToken(newToken);
    setCurrentUser(res.data.user);
    setIsAuthenticated(true);
    
    // 3. Pass the NEW token directly to fetchCredits to avoid 401
    await fetchCredits(newToken); 
    
    return { success: true };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Signup failed",
    };
  }
};

  const logout = async () => {
    try {
      await axios.post(API_URL + "/api/auth/logout", {})
      setToken(null)
      setCurrentUser(null)
      setIsAuthenticated(false)
      setCredits(0)
      return { success: true }
    } catch (error) {
      return { success: false, message: "Logout failed" }
    }
  }

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
    hasEnoughCredits
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
