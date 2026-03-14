const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller");
const { validationResult } = require("express-validator");
const { validationErrorFormatter } = require("../middlewares/errorHandeling");
const {
  validateUsername,
  validateEmail,
  validatePassword,
} = require("../middlewares/userValidation");
const { authenticateToken } = require("../middlewares/auth");
router.post(
  "/register",
  [...validateUsername, ...validateEmail, ...validatePassword],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .json({ errors: validationErrorFormatter(errors.array()) });
    }
    next();
  },
  userController.Register
);

router.post("/login", userController.Login);
// router.post("/logout", userController.Logout);
router.post("/forgot-password", userController.forgetPassword);
router.post("/reset-password", userController.resetPassword);
router.get("/profile", authenticateToken, userController.getProfile);

// update name only
router.put("/profile", authenticateToken, userController.updateProfile);

// change photo  
router.put(
  "/profile/photo",
  authenticateToken,
  userController.uploadProfilePhoto,
  userController.updatePhoto
);

// remove photo
router.delete("/profile/photo", authenticateToken, userController.removePhoto);

// delete account
router.delete("/profile", authenticateToken, userController.deleteAccount);

// logout from all devices
router.post("/logout-all", authenticateToken, userController.logoutAllDevices);

module.exports = router;
