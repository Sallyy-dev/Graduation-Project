const express = require("express");
const router = express.Router();
const passport = require("../config/passport");
const { handleSocialCallback } = require("../controllers/socialAuth.controller");

router.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"], session: false })
);

router.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/login", session: false }),
  handleSocialCallback
);

module.exports = router;