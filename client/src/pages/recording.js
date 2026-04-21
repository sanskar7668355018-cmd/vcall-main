import { useEffect, useState } from "react";
import axios from "axios";

export default function Recordings() {
  const [data, setData] = useState([]);
  
  // ✅ Get the live API URL from environment variables
  const API_URL = process.env.REACT_APP_API_URL || "https://vcall-main.onrender.com";

  useEffect(() => {
    const fetchRecordings = async () => {
      try {
        const token = localStorage.getItem("authToken");
        
        // ✅ 1. Use the live API_URL
        // ✅ 2. Use the plural "recordings"
        // ✅ 3. Send the token in headers
        const res = await axios.get(`${API_URL}/api/recordings/all`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        console.log("DATA RECEIVED:", res.data);
        setData(res.data);
      } catch (err) {
        console.error("Error fetching recordings:", err);
      }
    };

    fetchRecordings();
  }, [API_URL]);

  return (
    <div style={{ padding: "20px", color: "white", backgroundColor: "#111", minHeight: "100vh" }}>
      <h2 style={{ borderBottom: "1px solid #333", paddingBottom: "10px" }}>🎥 Recordings</h2>

      {data.length === 0 ? (
        <p style={{ marginTop: "20px", color: "#888" }}>No recordings found</p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(400px, 1fr))", gap: "20px", marginTop: "20px" }}>
          {data.map((rec) => (
            <div key={rec._id} style={{ background: "#fff", padding: "15px", borderRadius: "12px", border: "1px solid #eee" ,boxShadow: "0 4px 12px rgba(0,0,0,0.08)"}}>
              
              <p style={{ fontWeight: "bold", marginBottom: "10px" }}>
                {rec.title || rec.roomName || "Unnamed Meeting"}
              </p>

              <video width="100%" controls style={{ borderRadius: "8px", background: "#000" }}>
                <source src={rec.fileUrl} type="video/webm" />
                Your browser does not support the video tag.
              </video>

              <div style={{ marginTop: "10px", display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: "12px", color: "#666" }}>
                  {new Date(rec.createdAt).toLocaleDateString()}
                </span>
                <a 
                  href={rec.fileUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ color: "#3b82f6", textDecoration: "none", fontSize: "14px" }}
                >
                  Download / Open
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}