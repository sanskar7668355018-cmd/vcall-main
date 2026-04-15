const mongoose = require("mongoose");

const recordingSchema = new mongoose.Schema({
  roomName: String,
  fileUrl: String,
  duration: Number,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Recording", recordingSchema);