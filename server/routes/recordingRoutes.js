const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const Recording = require("../models/recording");
const authMiddleware = require("../middleware/auth");

// 📁 Ensure uploads directory exists
const uploadsDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// 📁 Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(7)}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

const upload = multer({ 
  storage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB limit
  fileFilter: (req, file, cb) => {
    // Only accept video files
    const allowedMimes = ['video/webm', 'video/mp4', 'video/quicktime'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only video files are allowed'), false);
    }
  }
});

// ✅ UPLOAD + SAVE RECORDING
router.post("/upload", authMiddleware, upload.single("video"), async (req, res) => {
  try {
    console.log("📹 Recording upload started");
    console.log("User ID:", req.user.id);
    console.log("File:", req.file?.filename);

    if (!req.file) {
      return res.status(400).json({ error: "No video file provided" });
    }

    const { roomName, title, duration } = req.body;

    // ✅ FIX: Use dynamic host instead of hardcoded localhost
    const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;

    console.log("Generated fileUrl:", fileUrl);

    const recording = new Recording({
      userId: req.user.id, // ✅ Link to logged-in user
      roomName: roomName || "Unknown Room",
      title: title || `Meeting - ${roomName || new Date().toLocaleString()}`,
      fileUrl,
      duration: duration || 0,
      createdAt: new Date(),
    });

    console.log("Recording object:", recording);

    await recording.save();
    console.log("✅ Recording saved successfully:", recording._id);

    res.json({ 
      success: true, 
      message: "Recording saved successfully",
      recording 
    });

  } catch (err) {
    console.error("❌ Upload Error:", err);
    res.status(500).json({ 
      error: "Upload failed", 
      details: err.message 
    });
  }
});

// ✅ GET ALL RECORDINGS (Filtered by User)
router.get("/all", authMiddleware, async (req, res) => {
  try {
    console.log("📂 Fetching recordings for user:", req.user.id);

    // ✅ ONLY find recordings belonging to the logged-in user
    const data = await Recording.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .lean(); // Use lean() for better performance

    console.log("✅ Found recordings:", data.length);
    console.log("Recordings:", data);

    // Return as direct array (not wrapped)
    res.json(data);

  } catch (err) {
    console.error("❌ Fetch Error:", err);
    res.status(500).json({ 
      error: "Failed to fetch recordings",
      details: err.message 
    });
  }
});

// ✅ GET SINGLE RECORDING
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const recording = await Recording.findOne({
      _id: req.params.id,
      userId: req.user.id // ✅ Security: Only user's own recordings
    });

    if (!recording) {
      return res.status(404).json({ error: "Recording not found" });
    }

    res.json(recording);

  } catch (err) {
    console.error("❌ Get Recording Error:", err);
    res.status(500).json({ error: "Failed to fetch recording" });
  }
});

// ✅ DELETE RECORDING
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const recording = await Recording.findOne({
      _id: req.params.id,
      userId: req.user.id // ✅ Security: Only user's own recordings
    });

    if (!recording) {
      return res.status(404).json({ error: "Recording not found" });
    }

    // Delete the file from disk
    const filename = recording.fileUrl.split('/').pop();
    const filePath = path.join(uploadsDir, filename);
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log("File deleted:", filename);
    }

    // Delete from database
    await Recording.deleteOne({ _id: req.params.id });

    res.json({ success: true, message: "Recording deleted" });

  } catch (err) {
    console.error("❌ Delete Error:", err);
    res.status(500).json({ error: "Failed to delete recording" });
  }
});

module.exports = router;