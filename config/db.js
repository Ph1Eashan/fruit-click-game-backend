// config/db.js
const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {});
    console.log("Database connected successfully");
  } catch (error) {
    console.log("error while connecting to database", error);
  }
};

module.exports = connectDB;
