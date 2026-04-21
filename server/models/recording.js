const mongoose = require("mongoose");

const recordingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true, // ✅ Index for faster queries
    },
    roomName: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      default: "Untitled Recording",
    },
    fileUrl: {
      type: String,
      required: true,
    },
    duration: {
      type: Number,
      default: 0, // Duration in seconds
    },
    fileSize: {
      type: Number,
      default: 0, // File size in bytes
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true, // ✅ Index for sorting by date
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
    isPublic: {
      type: Boolean,
      default: false, // Private by default
    },
    description: {
      type: String,
      default: "",
    },
    participants: {
      type: [String], // Array of participant names
      default: [],
    },
  },
  { timestamps: true }
);

// ✅ TTL Index: Auto-delete recordings after 90 days (optional)
// recordingSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 });

module.exports = mongoose.model("Recording", recordingSchema);