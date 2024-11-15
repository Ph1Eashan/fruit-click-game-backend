// HashPassword.js
const bcrypt = require("bcryptjs");

async function generateHashedPassword() {
  const plainTextPassword = "admin"; // Replace with the desired admin password
  const hashedPassword = await bcrypt.hash(plainTextPassword, 10);
  console.log("Hashed Password:", hashedPassword);
}

generateHashedPassword();
