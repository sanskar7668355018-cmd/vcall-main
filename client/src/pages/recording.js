import { useEffect, useState } from "react";
import axios from "axios";

export default function Recordings() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,setError]=useState(null);
  
  // ✅ Ensure this is your Render URL
  const API_URL = process.env.REACT_APP_API_URL || "https://vcall-main.onrender.com";

  useEffect(() => {
    const fetchRecordings = async () => {
      try {
        const token = localStorage.getItem("authToken");

        console.log("🔍 DEBUG INFO:");
        console.log("API_URL:", API_URL);
        console.log("Auth Token exists:", !!token);
        console.log("Token preview:", token ? token.substring(0, 20) + "..." : "MISSING");
        
        const url = `${API_URL}/api/recordings/all`;
        console.log("Fetching from:", url);

        
        const res = await axios.get(`${API_URL}/api/recordings/all`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        console.log("✅ API Response received");
        console.log("Response status:", res.status);
        console.log("Response data:", res.data);
        console.log("Data type:", typeof res.data);
        console.log("Is array:", Array.isArray(res.data));
        console.log("Data length:", res.data?.length || 0);

         // ✅ FIX: Handle both array and object responses
        const recordings = Array.isArray(res.data) ? res.data : res.data?.recordings || [];
        setData(recordings);
        setError(null);
        
      } catch (err) {
        console.error("❌ RECORDINGS_FETCH_ERROR");
        console.error("Error status:", err.response?.status);
        console.error("Error message:", err.message);
        console.error("Error response:", err.response?.data);
        console.error("Full error:", err);
        
        setError(err.response?.data?.error || err.message || "Failed to fetch recordings");
      } finally {
        setLoading(false);
      }
    };
 
    fetchRecordings();
  }, [API_URL]);
 
  return (
    <div style={{ padding: "40px", backgroundColor: "#ffffff", minHeight: "100vh", color: "#333" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <h2 style={{ fontSize: "28px", fontWeight: "bold", borderBottom: "2px solid #f0f0f0", paddingBottom: "15px", marginBottom: "30px" }}>
          🎥 My Recordings
        </h2>
 
        {loading ? (
          <p>Loading...</p>
        ) : error ? (
          // ✅ FIX: Show error message to help debug
          <div style={{ textAlign: "center", padding: "50px", border: "2px dashed #ff6b6b", borderRadius: "12px", backgroundColor: "#fff5f5" }}>
            <p style={{ color: "#d32f2f", fontWeight: "bold" }}>⚠️ Error: {error}</p>
            <p style={{ color: "#888", fontSize: "12px", marginTop: "10px" }}>Check the browser console (F12) for more details</p>
          </div>
        ) : data.length === 0 ? (
          <div style={{ textAlign: "center", padding: "50px", border: "2px dashed #e0e0e0", borderRadius: "12px" }}>
            <p style={{ color: "#888" }}>No recordings found in your account.</p>
            <p style={{ color: "#aaa", fontSize: "12px", marginTop: "10px" }}>
              💡 Tip: Make sure you've completed at least one recording session.
            </p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))", gap: "25px" }}>
            {data.map((rec) => (
              <div key={rec._id} style={{ backgroundColor: "#fff", borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.08)", border: "1px solid #eee", padding: "15px" }}>
                <video width="100%" controls style={{ background: "#000", borderRadius: "8px" }}>
                  <source src={rec.fileUrl} type="video/webm" />
                  Your browser does not support the video tag.
                </video>
                <p style={{ fontWeight: "600", marginTop: "10px" }}>{rec.title || rec.roomName}</p>
                <small style={{ color: "#888" }}>
                  {rec.createdAt ? new Date(rec.createdAt).toLocaleDateString() : ""}
                </small>
                <div style={{ marginTop: "10px", display: "flex", gap: "10px" }}>
                  <a 
                    href={rec.fileUrl} 
                    target="_blank" 
                    rel="noreferrer" 
                    style={{ 
                      color: "#3b82f6", 
                      fontSize: "14px", 
                      textDecoration: "none",
                      padding: "8px 12px",
                      border: "1px solid #3b82f6",
                      borderRadius: "4px",
                      cursor: "pointer"
                    }}
                  >
                    📥 Download
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
 
 
