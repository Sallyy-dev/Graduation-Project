const express = require("express");
const router = express.Router();
const {
  sendContact,
  getAllContacts,
  markAsReviewed,
} = require("../controllers/contact.controller");
const { authenticateToken } = require("../middlewares/auth");

// ─── User ─────────────────────────────────────────────────────────────────────
router.post("/", authenticateToken, sendContact);

// ─── Admin ────────────────────────────────────────────────────────────────────
router.get("/", authenticateToken, getAllContacts);
router.patch("/:id", authenticateToken, markAsReviewed);

module.exports = router;