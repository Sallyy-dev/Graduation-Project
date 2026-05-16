const OTP = require("../models/otpModel");
const otpGenerator = require("otp-generator");
const sendEmail = require("../utils/sendEmail");

// ================= SEND OTP =================
const sendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    // validation
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    // generate 4-digit otp
    const otp = otpGenerator.generate(4, {
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false,
    });

    // 🔥 delete old OTPs (important for resend)
    await OTP.deleteMany({ email });

    // save new OTP
    await OTP.create({
      email,
      otp,
    });

    // send email
    await sendEmail(email, otp);

    return res.status(200).json({
      success: true,
      message: "OTP sent successfully",
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// VERIFY OTP
const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    // validation
    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required",
      });
    }

    // find OTP
    const existingOTP = await OTP.findOne({
      email,
      otp,
    });

    // invalid OTP
    if (!existingOTP) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    // delete OTP after success
    await OTP.deleteMany({ email });

    return res.status(200).json({
      success: true,
      message: "OTP verified successfully",
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

module.exports = {
  sendOTP,
  verifyOTP,
};
