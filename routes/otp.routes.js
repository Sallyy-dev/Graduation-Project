const express = require("express");

const router = express.Router();

const {
  sendOTP,
  verifyOTP,
} = require("../controllers/otp.controller");

// send otp
router.post("/send-otp", sendOTP);

// verify otp
router.post("/verify-otp", verifyOTP);

module.exports = router;