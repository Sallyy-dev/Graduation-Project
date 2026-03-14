const User = require("../models/user");
const bcrypt = require("bcryptjs");
const { generateTokens } = require("../utils/user");
const sendEmail = require("../utils/sendEmail");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
 


// ─── Multer Config for Profile Photo ────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = "uploads/profiles";
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `profile_${req.user.id}_${Date.now()}${ext}`);
  },
});
 
const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed (jpeg, png, jpg, webp)"), false);
  }
};
 
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, 
});
 
// Export the upload middleware so you can use it in routes
const uploadProfilePhoto = upload.single("photo");

// Register
const Register = async (req, res) => {
  try {
    const { userName, email, password, role } = req.body;

    const exist = await User.findOne({ email });
    if (exist) {
      return res
        .status(400)
        .json({ success: false, message: "User already exists" });
    }

    const hashPassword = await bcrypt.hash(password, 10);

    const user = new User({
      userName,
      email,
      password: hashPassword,
      role: role || "user",
    });

    const newUser = await user.save();
    const { accessToken, refreshToken } = generateTokens(newUser);

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "Strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({
      success: true,
      user: {
        id: newUser._id,
        userName: newUser.userName,
        email: newUser.email,
        role: newUser.role,
      },
      accessToken,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

//  Login
const Login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid Email" });

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid)
      return res.status(400).json({ message: "Invalid password" });

    const { accessToken, refreshToken } = generateTokens(user);

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "Strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      message: "Login successfully",
      user: {
        id: user._id,
        userName: user.userName,
        email: user.email,
        role: user.role,
        profilePhoto: user.profilePhoto || null,
      },
      accessToken,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Logout
const logoutAllDevices = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user.id, {
      $inc: { tokenVersion: 1 },
    });
 
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: true,
      sameSite: "Strict",
    });
 
    res.json({
      success: true,
      message: "Logged out from all devices successfully",
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Forget Password
const forgetPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const { accessToken } = generateTokens(user);
    const resetLink = `http://localhost:3000/api/user/reset-password?token=${accessToken}`;

    await sendEmail(
      email,
      "Password Reset",
      `Click here to reset your password: ${resetLink}`
    );
    res.json({ message: "Password reset link sent to your email" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Reset Password
const resetPassword = async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json({ message: "Token is required" });

    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 8) {
      return res
        .status(400)
        .json({ message: "Password must be at least 8 characters" });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ message: "Password reset successful" });
  } catch (err) {
    res.status(400).json({ message: "Invalid or expired token" });
  }
};

// Get Profile
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select(
      "-password -refreshToken"
    );
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
 
    res.json({
      success: true,
      user: {
        id: user._id,
        userName: user.userName,
        email: user.email,
        role: user.role,
        profilePhoto: user.profilePhoto || null,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Update Profile UserName
const updateProfile = async (req, res) => {
  try {
    const { userName } = req.body; 

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { userName },
      { new: true, runValidators: true }
    ).select("-password -refreshToken");

    res.json({
      success: true,
      message: "Profile updated successfully",
      user: {
        id: updatedUser._id,
        userName: updatedUser.userName,
        email: updatedUser.email,
        role: updatedUser.role,
        profilePhoto: updatedUser.profilePhoto || null,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Update Profile Photo ────────────────────────────────────────────────────
const updatePhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "No image file provided" });
    }
 
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
 
    // Delete old photo from disk if it exists
    if (user.profilePhoto) {
      const oldPhotoPath = path.join(__dirname, "..", user.profilePhoto);
      if (fs.existsSync(oldPhotoPath)) {
        fs.unlinkSync(oldPhotoPath);
      }
    }
 
    // Save new photo path (relative, so the frontend can build the full URL)
    const photoPath = `uploads/profiles/${req.file.filename}`;
    user.profilePhoto = photoPath;
    await user.save();
 
    res.json({
      success: true,
      message: "Profile photo updated successfully",
      profilePhoto: photoPath,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Remove Profile Photo ────────────────────────────────────────────────────
const removePhoto = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
 
    if (!user.profilePhoto) {
      return res
        .status(400)
        .json({ success: false, message: "No profile photo to remove" });
    }
 
    // Delete photo file from disk
    const photoPath = path.join(__dirname, "..", user.profilePhoto);
    if (fs.existsSync(photoPath)) {
      fs.unlinkSync(photoPath);
    }
 
    user.profilePhoto = null;
    await user.save();
 
    res.json({
      success: true,
      message: "Profile photo removed successfully",
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Delete Account ──────────────────────────────────────────────────────────
const deleteAccount = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
 
    // Delete profile photo from disk if exists
    if (user.profilePhoto) {
      const photoPath = path.join(__dirname, "..", user.profilePhoto);
      if (fs.existsSync(photoPath)) {
        fs.unlinkSync(photoPath);
      }
    }
 
    await User.findByIdAndDelete(req.user.id);
 
    // Clear the refresh token cookie
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: true,
      sameSite: "Strict",
    });
 
    res.json({
      success: true,
      message: "Account deleted successfully",
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
 

module.exports = {
  Register,
  Login,
  logoutAllDevices,
  forgetPassword,
  resetPassword,
  getProfile,
  updateProfile,
  updatePhoto,
  removePhoto,
  deleteAccount,
  logoutAllDevices,
  uploadProfilePhoto,
};
