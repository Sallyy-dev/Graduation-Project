const { check } = require("express-validator");

const validateUsername = [
  check("userName")
    .notEmpty()
    .withMessage("Username is required")
    .isAlphanumeric()
    .withMessage("Username must be alphanumeric")
    .isLength({ min: 3, max: 15 })
    .withMessage("Username must be between 3 and 15 characters")
    .trim()
    .customSanitizer((value) => {
      if (typeof value !== "string" || value.length === 0) return value;
      return value.charAt(0).toUpperCase() + value.slice(1);
    }),
];

const validateEmail = [
  check("email")
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid email address")
    .normalizeEmail(),
];

const validatePassword = [
  check("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 8 })
    .withMessage("Password must be more than 8 characters")
    .custom((value) => {
      const symbol = /[!@#$%^&*]/;
      if (!symbol.test(value)) {
        throw new Error("Password must include at least one symbol (!@#$%^&*)");
      }
      return true;
    }),
];

module.exports = { validateUsername, validateEmail, validatePassword };
