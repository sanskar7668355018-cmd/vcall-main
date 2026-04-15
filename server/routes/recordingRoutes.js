const express = require("express");
const router = express.Router();
const multer = require("multer");
const Recording = require("../models/recording");

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
router.post("/upload", upload.single("video"), async (req, res) => {
  try {
    const { roomName } = req.body;

    const fileUrl = `http://localhost:5000/uploads/${req.file.filename}`;

    const recording = new Recording({
      roomName,
      fileUrl,
      duration: 0,
    });

    await recording.save();

    res.json({
      success: true,
      recording,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Upload failed" });
  }
});


// 📂 GET ALL
router.get("/", async (req, res) => {
  const data = await Recording.find().sort({ createdAt: -1 });
  res.json(data);
});

module.exports = router;