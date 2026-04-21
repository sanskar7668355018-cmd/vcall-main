import { useEffect, useState } from "react";
import axios from "axios";

export default function Recordings() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // ✅ Ensure this is your Render URL
  const API_URL = process.env.REACT_APP_API_URL || "https://vcall-main.onrender.com";

  useEffect(() => {
    const fetchRecordings = async () => {
      try {
        const token = localStorage.getItem("authToken");
        
        // ✅ Use plural 'recordings' and production API_URL
        const res = await axios.get(`${API_URL}/api/recordings/all`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        console.log("RECORDINGS_FETCH_SUCCESS:", res.data);
        setData(res.data);
      } catch (err) {
        console.error("RECORDINGS_FETCH_ERROR:", err.response?.data || err.message);
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
        ) : data.length === 0 ? (
          <div style={{ textAlign: "center", padding: "50px", border: "2px dashed #e0e0e0", borderRadius: "12px" }}>
            <p style={{ color: "#888" }}>No recordings found in your account.</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))", gap: "25px" }}>
            {data.map((rec) => (
              <div key={rec._id} style={{ backgroundColor: "#fff", borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.08)", border: "1px solid #eee", padding: "15px" }}>
                <video width="100%" controls style={{ background: "#000", borderRadius: "8px" }}>
                  <source src={rec.fileUrl} type="video/webm" />
                </video>
                <p style={{ fontWeight: "600", marginTop: "10px" }}>{rec.title || rec.roomName}</p>
                <a href={rec.fileUrl} target="_blank" rel="noreferrer" style={{ color: "#3b82f6", fontSize: "14px", textDecoration: "none" }}>Download</a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}