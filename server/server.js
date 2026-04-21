const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const livekitRoutes = require("./routes/livekitRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const recordingRoutes = require("./routes/recordingRoutes");

const app = express();
const PORT = process.env.PORT || 5000;


// ✅ 1. CORS FIRST (VERY IMPORTANT)
app.use(
  cors({
    origin: ["https://vcall-main.vercel.app", "http://localhost:3000"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);


// ✅ 2. BODY PARSING
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// ✅ 3. STATIC FILES (UPLOADS)
app.use("/uploads", express.static("uploads"));


// ✅ 4. ROOT ROUTE
app.get("/", (req, res) => {
  res.send("✅ Backend running successfully");
});


// ✅ 5. API ROUTES (ONLY ONCE)
app.use("/api/auth", authRoutes);
app.use("/api/livekit", livekitRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/recordings", recordingRoutes);


// ✅ 6. DATABASE CONNECTION
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error(err));


// ✅ 7. START SERVER
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
});