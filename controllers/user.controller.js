const User = require("../models/user"); // Import User model
const bcrypt = require("bcryptjs"); // For hashing passwords
const { generateTokens } = require("../utils/user"); // Function to generate access & refresh tokens
const sendEmail = require("../utils/sendEmail"); // Utility for sending emails
const jwt = require("jsonwebtoken"); // JWT package
const multer = require("multer"); // Middleware for handling file uploads
const path = require("path"); // Node.js path module
const fs = require("fs"); // File system module

// ==========================
// Multer Configuration
// Configure storage location and file naming
const storage = multer.diskStorage({
  // Set upload destination folder
  destination: (req, file, cb) => {
    const uploadDir = "uploads/profiles";

    // Create folder if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    cb(null, uploadDir);
  },

  // Generate unique filename for uploaded photo
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);

    cb(null, `profile_${req.user.id}_${Date.now()}${ext}`);
  },
});

// Filter allowed image types
const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];

  // Accept valid image types only
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed (jpeg, png, jpg, webp)"), false);
  }
};

// Initialize multer upload configuration
const upload = multer({
  storage,
  fileFilter,
  // Limit file size to 5MB
  limits: { fileSize: 5 * 1024 * 1024 },
});

// Middleware for uploading single profile photo
const uploadProfilePhoto = upload.single("photo");

// Register Controller
const Register = async (req, res) => {
  try {
    // Get user data from request body
    const { userName, email, password, role } = req.body;

    // Check if user already exists
    const exist = await User.findOne({ email });

    if (exist) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    // Hash password before saving
    const hashPassword = await bcrypt.hash(password, 10);

    // Create new user document
    const user = new User({
      userName,
      email,
      password: hashPassword,
      role: role || "user",
    });

    // Save user in database
    const newUser = await user.save();

    // Generate JWT tokens
    const { accessToken, refreshToken } = generateTokens(newUser);

    // Store refresh token in HTTP-only cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "Strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // Send success response
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
    // Handle server errors
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// Login Controller
const Login = async (req, res) => {
  try {
    // Extract email & password from request body
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        message: "Invalid Email",
      });
    }

    // Compare entered password with hashed password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(400).json({
        message: "Invalid password",
      });
    }

    // Generate access & refresh tokens
    const { accessToken, refreshToken } = generateTokens(user);

    // Save refresh token in cookies
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "Strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Return login success response
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
    // Handle server errors
    res.status(500).json({
      error: err.message,
    });
  }
};

// Logout From All Devices
const logoutAllDevices = async (req, res) => {
  try {
    // Increase token version to invalidate old tokens
    await User.findByIdAndUpdate(req.user.id, {
      $inc: { tokenVersion: 1 },
    });

    // Remove refresh token cookie
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: true,
      sameSite: "Strict",
    });

    // Success response
    res.json({
      success: true,
      message: "Logged out from all devices successfully",
    });
  } catch (err) {
    // Handle server errors
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// Forget Password
const forgetPassword = async (req, res) => {
  try {
    // Get email from request body
    const { email } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // Generate access token for password reset
    const { accessToken } = generateTokens(user);

    // Create password reset link
    const resetLink = `http://localhost:5173/reset-password?token=${accessToken}`;

    // Send reset email to user
    await sendEmail(
      email,
      "Password Reset",
      `Click here to reset your password: ${resetLink}`,
    );

    // Success response
    res.json({
      message: "Password reset link sent to your email",
    });
  } catch (err) {
    // Handle server errors
    res.status(500).json({
      error: err.message,
    });
  }
};

// Reset Password
const resetPassword = async (req, res) => {
  try {
    // Get token from query params
    const { token } = req.query;

    // Check if token exists
    if (!token) {
      return res.status(400).json({
        message: "Token is required",
      });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    // Find user by decoded token ID
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // Get new password from request body
    const { newPassword } = req.body;

    // Validate password length
    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters",
      });
    }

    // Hash new password
    user.password = await bcrypt.hash(newPassword, 10);

    // Save updated password
    await user.save();

    // Success response
    res.json({
      message: "Password reset successful",
    });
  } catch (err) {
    // Handle invalid or expired token
    res.status(400).json({
      message: "Invalid or expired token",
    });
  }
};

// Get User Profile
const getProfile = async (req, res) => {
  try {
    // Find user by authenticated user ID
    const user = await User.findById(req.user.id).select(
      "-password -refreshToken",
    );

    // Check if user exists
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Return user profile data
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
    // Handle server errors
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// Update Profile Username
const updateProfile = async (req, res) => {
  try {
    // Get updated username from request body
    const { userName } = req.body;

    // Update user profile
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { userName },
      { new: true, runValidators: true },
    ).select("-password -refreshToken");

    // Success response
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
    // Handle server errors
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// Update Profile Photo
const updatePhoto = async (req, res) => {
  try {
    // Check if image file exists
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No image file provided",
      });
    }

    // Find authenticated user
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Delete old profile photo if exists
    if (user.profilePhoto) {
      const oldPhotoPath = path.join(__dirname, "..", user.profilePhoto);

      if (fs.existsSync(oldPhotoPath)) {
        fs.unlinkSync(oldPhotoPath);
      }
    }

    // Save new photo path
    const photoPath = `uploads/profiles/${req.file.filename}`;

    user.profilePhoto = photoPath;

    // Save updated user
    await user.save();

    // Success response
    res.json({
      success: true,
      message: "Profile photo updated successfully",
      profilePhoto: photoPath,
    });
  } catch (err) {
    // Handle server errors
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
// Remove Profile Photo
const removePhoto = async (req, res) => {
  try {
    // Find authenticated user
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if profile photo exists
    if (!user.profilePhoto) {
      return res.status(400).json({
        success: false,
        message: "No profile photo to remove",
      });
    }

    // Delete photo file from server
    const photoPath = path.join(__dirname, "..", user.profilePhoto);

    if (fs.existsSync(photoPath)) {
      fs.unlinkSync(photoPath);
    }

    // Remove photo path from database
    user.profilePhoto = null;

    await user.save();

    // Success response
    res.json({
      success: true,
      message: "Profile photo removed successfully",
    });
  } catch (err) {
    // Handle server errors
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// Delete User Account
const deleteAccount = async (req, res) => {
  try {
    // Find authenticated user
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Delete profile photo if exists
    if (user.profilePhoto) {
      const photoPath = path.join(__dirname, "..", user.profilePhoto);

      if (fs.existsSync(photoPath)) {
        fs.unlinkSync(photoPath);
      }
    }

    // Delete user account from database
    await User.findByIdAndDelete(req.user.id);

    // Remove refresh token cookie
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: true,
      sameSite: "Strict",
    });

    // Success response
    res.json({
      success: true,
      message: "Account deleted successfully",
    });
  } catch (err) {
    // Handle server errors
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// Export Controllers & Middleware
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
