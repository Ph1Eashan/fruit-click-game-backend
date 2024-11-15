// backend/controllers/playerController.js
const mongoose = require("mongoose");
const User = require("../models/User");
const bcrypt = require("bcryptjs"); // Import bcryptjs

// Fetch user data by ID
const getUserData = async (req, res) => {
  const { userId } = req.params;

  // Validate the user ID format
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ message: "Invalid user ID format" });
  }

  try {
    const user = await User.findById(userId);
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getPlayers = async (req, res) => {
  const players = await User.find({ role: "player" }).sort({
    bananaClickCount: -1,
  });
  res.json(players);
};

const toggleBlockPlayer = async (req, res) => {
  try {
    const { id } = req.params;
    const player = await User.findById(id);
    if (!player) {
      return res.status(404).json({ message: "Player not found" });
    }

    // Toggle the status
    player.status =
      player.status === "inactive"
        ? "blocked"
        : player.status === "active"
        ? "blocked"
        : "inactive";

    await player.save();

    // Emit updates
    req.io.emit("updatePlayerStatus", player);

    const players = await User.find({ role: "player" }).sort({
      clickCount: -1,
    });
    req.io.emit("updateRankings", players);

    res.status(200).json(player);
  } catch (error) {
    res.status(500).json({ message: "Failed to toggle block status" });
  }
};

// Update user details
const updatePlayer = async (req, res) => {
  const { id } = req.params;
  const { username, clickCount, password } = req.body;

  try {
    const player = await User.findById(id);
    if (!player) {
      return res.status(404).json({ message: "Player not found" });
    }

    if (username) player.username = username;
    if (typeof clickCount === "number") player.clickCount = clickCount;
    if (password) {
      const salt = await bcrypt.genSalt(10);
      player.password = await bcrypt.hash(password, salt);
    }

    await player.save();

    // Emit event to notify all clients of the update
    req.io.emit("updatePlayer", player); // Emitting updated player details

    res.status(200).json({ message: "Player updated successfully", player });
  } catch (error) {
    console.error("Error updating player:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Delete user
const deletePlayer = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid player ID format" });
  }

  try {
    const player = await User.findByIdAndDelete(id);

    if (player) {
      // Emit the deletion event to all connected clients
      req.io.emit("playerDeleted", id); // Emit the player ID to indicate deletion
      res.json({ message: "Player deleted successfully" });
    } else {
      res.status(404).json({ message: "Player not found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  getPlayers,
  toggleBlockPlayer,
  getUserData,
  updatePlayer,
  deletePlayer,
};
