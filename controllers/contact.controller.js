const Contact = require("../models/contactus");
const sendEmail = require("../utils/sendEmail");

// ─── Send Contact Message (authenticated only) ────────────────────────────────
const sendContact = async (req, res) => {
  try {
    const { userName, email, comment } = req.body;

    // Validation
    if (!userName || !email || !comment) {
      return res.status(400).json({
        success: false,
        message: "userName, email, and comment are required",
      });
    }

    // حفظ في الـ Database
    const contact = await Contact.create({
      user: req.user.id,
      userName,
      email,
      comment,
    });

    // بعت إيميل للأدمن
    await sendEmail(
      process.env.ADMIN_EMAIL,
      `New Contact Message from ${userName}`,
      `
        You have a new contact message:

        Name    : ${userName}
        Email   : ${email}
        Comment : ${comment}

        Submitted at: ${new Date().toLocaleString()}
      `
    );

    res.status(201).json({
      success: true,
      message: "Your message has been sent successfully",
      contact: {
        id: contact._id,
        userName: contact.userName,
        email: contact.email,
        comment: contact.comment,
        createdAt: contact.createdAt,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Get All Contacts (admin only) ───────────────────────────────────────────
const getAllContacts = async (req, res) => {
  try {
    // التأكد إن اليوزر admin
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admins only.",
      });
    }

    const contacts = await Contact.find()
      .populate("user", "userName email")
      .sort({ createdAt: -1 }); // الأحدث أول

    res.json({
      success: true,
      total: contacts.length,
      contacts,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Mark as Reviewed (admin only) ───────────────────────────────────────────
const markAsReviewed = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admins only.",
      });
    }

    const contact = await Contact.findByIdAndUpdate(
      req.params.id,
      { status: "reviewed" },
      { new: true }
    );

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: "Contact message not found",
      });
    }

    res.json({
      success: true,
      message: "Marked as reviewed",
      contact,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { sendContact, getAllContacts, markAsReviewed };