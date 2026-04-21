const express = require("express");
const router = express.Router();
const multer = require("multer");
const Recording = require("../models/recording");
const authMiddleware = require("../middleware/auth"); // ✅ Ensure this is imported

// 📁 storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });

// 🎥 UPLOAD + SAVE
// ✅ Added authMiddleware to capture req.user.id
router.post("/upload", authMiddleware, upload.single("video"), async (req, res) => {
  try {
    const { roomName, duration, title } = req.body;

    // ✅ FIX: Use dynamic host instead of hardcoded localhost
    const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;

    const recording = new Recording({
      userId: req.user.id, // ✅ Link to the logged-in user
      roomName,
      title: title || `Meeting - ${roomName}`,
      fileUrl,
      duration: duration || 0,
    });

    await recording.save();
    res.json({ success: true, recording });

  } catch (err) {
    console.error("Upload Error:", err);
    res.status(500).json({ error: "Upload failed" });
  }
});

// 📂 GET ALL (Filtered by User)
// ✅ Changed route to '/all' and added authMiddleware
router.get("/all", authMiddleware, async (req, res) => {
  try {
    // ✅ ONLY find recordings belonging to the logged-in user
    const data = await Recording.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch recordings" });
  }
});

module.exports = router;