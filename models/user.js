const mongoose = require("mongoose");

const userSchema = mongoose.Schema({
  userName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user",
  },
  profilePhoto: {
    type: String,
    default: null,
  },
  googleId: {
    type: String,
    default: null,
  },
  facebookId: {
    type: String,
    default: null,
  },
  appleId: {
    type: String,
    default: null,
  },
  tokenVersion: {
    type: Number,
    default: 0,
  },
  refreshToken: {
    type: String,
    default: null,
  },
});

module.exports = mongoose.model("User", userSchema);
