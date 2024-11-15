const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["admin", "player"], default: "player" },
  clickCount: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ["active", "blocked", "inactive"],
    default: "inactive",
  }, // Changed to "inactive" default
});

module.exports = mongoose.model("User", userSchema);
