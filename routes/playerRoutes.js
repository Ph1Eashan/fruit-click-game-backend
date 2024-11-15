// backend/routes/playerRoutes.js
const express = require("express");
const {
  getPlayers,
  toggleBlockPlayer,
  getUserData,
  updatePlayer,
  deletePlayer,
} = require("../controllers/playerController");
const { protect, admin } = require("../middleware/authMiddleware");
const router = express.Router();

router.get("/rankings", protect, getPlayers);
// Toggle block/unblock for players (admin-only route)
router.patch("/:id/block", protect, admin, toggleBlockPlayer);
router.get("/user/:userId", protect, getUserData); // New route for user data
router.put("/:id", protect, admin, updatePlayer); // Update player
router.delete("/:id", protect, admin, deletePlayer); // Delete player

module.exports = router;
