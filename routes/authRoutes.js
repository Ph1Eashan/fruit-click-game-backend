// backend/routes/authRoutes.js
const express = require("express");
const {
  register,
  login,
  adminRegister,
  logout,
} = require("../controllers/authController");
const { protect, admin } = require("../middleware/authMiddleware");
const router = express.Router();

router.post("/register", register); // Regular user registration
router.post("/login", login); // Login route
router.post("/logout", logout); // logout route
router.post("/admin/register", protect, admin, adminRegister); // Admin-only registration route

module.exports = router;
