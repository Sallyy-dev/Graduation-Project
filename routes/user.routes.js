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
router.post("/logout", userController.Logout);
router.post("/forgot-password", userController.forgetPassword);
router.post("/reset-password", userController.resetPassword);
router.get("/profile", authenticateToken, userController.getProfile);

module.exports = router;
