import { useEffect, useState } from "react";
import axios from "axios";

export default function Recordings() {
  const [data, setData] = useState([]);

  useEffect(() => {
    axios.get("http://localhost:5000/api/recording")
      .then(res => {
        console.log("DATA:", res.data); // 👈 DEBUG
        setData(res.data);
      })
      .catch(err => console.error(err));
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h2>🎥 Recordings</h2>

      {data.length === 0 ? (
        <p>No recordings found</p>
      ) : (
        data.map((rec) => (
          <div key={rec._id} style={{ marginBottom: "20px" }}>
            
            {/* Fix for missing roomName */}
            <p>{rec.roomName || "No Room Name"}</p>

            <video width="400" controls>
              <source src={rec.fileUrl} type="video/webm" />
            </video>

            <br />
            <a href={rec.fileUrl} download>Download</a>
          </div>
        ))
      )}
    </div>
  );
}