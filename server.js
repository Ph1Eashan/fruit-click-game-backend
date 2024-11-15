// backend/server.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const http = require("http");
const mongoose = require("mongoose");
const { Server } = require("socket.io");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const playerRoutes = require("./routes/playerRoutes");
const User = require("./models/User");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// Middleware to attach io to the request object
app.use((req, res, next) => {
  req.io = io; // Attach io instance to req
  next();
});

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
connectDB();

// Routes
app.get("/", (req, res) => {
  res.send("Welcome to the Fruits Click Game Backend!");
});
app.use("/api/auth", authRoutes);
app.use("/api/players", playerRoutes);

// Handle socket connections
io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Send initial rankings to the connected client
  const sendInitialRankings = async () => {
    try {
      const players = await User.find({ role: "player" }).sort({
        clickCount: -1,
      });
      io.to(socket.id).emit("updateRankings", players); // Emit rankings to the newly connected client
    } catch (error) {
      console.error("Error sending initial rankings:", error);
    }
  };

  sendInitialRankings();

  socket.on("clickBanana", async (userId) => {
    // Handle the click and update the user’s click count
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return socket.emit("error", "Invalid user ID");
    }

    try {
      const user = await User.findById(userId);

      if (user && user.status === "active") {
        user.clickCount += 1;
        await user.save();

        // Emit the click count update to the specific user
        io.to(socket.id).emit("updateClickCount", {
          userId,
          newClickCount: user.clickCount,
          status: user.status,
        });

        // Emit ranking updates to all connected clients (both admin and players)
        const players = await User.find({ role: "player" }).sort({
          clickCount: -1,
        });
        io.emit("updateRankings", players); // Broadcast to all clients
      } else {
        socket.emit("error", "User is blocked or not found");
      }
    } catch (error) {
      console.error("Error updating click count:", error);
      socket.emit("error", "An error occurred while updating click count");
    }
  });

  socket.on("toggleBlockPlayer", async (playerId) => {
    try {
      const player = await User.findById(playerId);

      if (player) {
        // Toggle the player's block status
        player.status = player.status === "active" ? "blocked" : "active";
        await player.save();

        // Emit the updated player status to all connected clients
        io.emit("updatePlayerStatus", player);
      } else {
        socket.emit("error", "Player not found");
      }
    } catch (error) {
      console.error("Error updating player status:", error);
      socket.emit("error", "An error occurred while updating player status");
    }
  });

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
