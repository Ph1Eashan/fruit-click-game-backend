// backend/controllers/authController.js
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const adminRegister = async (req, res) => {
  const { username, password } = req.body;

  // Only allow admins to register new admins
  // if (req.user.role !== "admin") {
  //   return res.status(403).json({ message: "Unauthorized to create admins" });
  // }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const adminUser = await User.create({
      username,
      password: hashedPassword,
      role: "admin",
    });
    res.status(201).json({ message: "Admin registered successfully" });
  } catch (error) {
    res.status(400).json({ message: "Admin registration failed" });
  }
};

const register = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .json({ message: "Username and password are required" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const newPlayer = await User.create({ username, password: hashedPassword });

    // Emit the new player creation event to all clients
    req.io.emit("playerCreated", newPlayer);

    res
      .status(201)
      .json({ message: "User registered successfully", newPlayer });
  } catch (error) {
    res.status(400).json({ message: "User registration failed" });
  }
};

const login = async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });

    // Check if user exists
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if the user is blocked
    if (user.status === "blocked") {
      return res.status(403).json({ message: "Your account has been blocked" });
    }

    // Check password match using bcrypt
    if (await bcrypt.compare(password, user.password)) {
      // Set status to "active" upon successful login
      user.status = "active";
      await user.save();

      // Generate JWT token if login is successful
      const token = jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
      );

      // Emit real-time update to all clients
      req.io.emit("updatePlayerStatus", user); // Emit to update player status on all connected clients

      res.json({
        message: `${user.username} Logged in successfully`,
        token,
        user: { id: user._id, username: user.username, role: user.role },
      });
    } else {
      return res.status(401).json({ message: "Invalid credentials" });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const logout = async (req, res) => {
  try {
    const token = req.headers.authorization.split(" ")[1]; // Extract token from the header

    if (!token) {
      return res.status(400).json({ message: "Token is required" });
    }

    // Decode the token to extract user info
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // jwt.verify decodes the token
    const { id } = decoded;

    // Find the user in the database
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Change status to inactive
    user.status = "inactive";
    await user.save(); // Ensure the user status is saved in the database

    // Send response
    res.json({ message: "User logged out successfully", user });

    // Optionally, emit a socket event to notify real-time updates
    req.io.emit("updatePlayerStatus", user); // Notify all clients of status change
  } catch (error) {
    console.error("Error in logout:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = { register, login, adminRegister, logout };
