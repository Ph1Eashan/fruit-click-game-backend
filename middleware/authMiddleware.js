// backend/middleware/authMiddleware.js
const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Middleware to protect routes and check for valid JWT
const protect = async (req, res, next) => {
  let token = req.headers.authorization?.split(" ")[1];
  if (!token)
    return res.status(401).json({ message: "No token, authorization denied" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select("-password"); // Attaches user to request object
    next();
  } catch (err) {
    res.status(401).json({ message: "Token is not valid" });
  }
};

// Middleware to check if the user is an admin
const admin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next(); // If admin, proceed to the next middleware or route handler
  } else {
    res.status(403).json({ message: "Admin privileges required" });
  }
};

module.exports = { protect, admin };
