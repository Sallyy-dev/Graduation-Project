const Contact = require("../models/contactus");
const sendEmail = require("../utils/sendEmail");

// ==========================
// Send Contact Message
const sendContact = async (req, res) => {
  try {
    // Extract data from request body
    const { userName, email, comment } = req.body;

    // Validate required fields
    if (!userName || !email || !comment) {
      return res.status(400).json({
        success: false,
        message: "userName, email, and comment are required",
      });
    }

    // Create new contact message in database
    const contact = await Contact.create({
      user: req.user.id,
      userName,
      email,
      comment,
    });

    // Send email notification to admin
    await sendEmail(
      process.env.ADMIN_EMAIL,
      `New Contact Message from ${userName}`,
      `
        You have a new contact message:

        Name    : ${userName}
        Email   : ${email}
        Comment : ${comment}

        Submitted at: ${new Date().toLocaleString()}
      `,
    );

    // Return success response
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
    // Handle server errors
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// Get All Contact Messages
// (Admin Only)
const getAllContacts = async (req, res) => {
  try {
    // Check if authenticated user is admin
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admins only.",
      });
    }

    // Fetch all contacts with user info
    const contacts = await Contact.find()
      .populate("user", "userName email")
      .sort({ createdAt: -1 });

    // Return contacts list
    res.json({
      success: true,
      total: contacts.length,
      contacts,
    });
  } catch (err) {
    // Handle server errors
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// Mark Contact as Reviewed
// (Admin Only)
const markAsReviewed = async (req, res) => {
  try {
    // Check admin authorization
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admins only.",
      });
    }

    // Update contact status to reviewed
    const contact = await Contact.findByIdAndUpdate(
      req.params.id,
      { status: "reviewed" },
      { new: true },
    );

    // Check if contact message exists
    if (!contact) {
      return res.status(404).json({
        success: false,
        message: "Contact message not found",
      });
    }

    // Return success response
    res.json({
      success: true,
      message: "Marked as reviewed",
      contact,
    });
  } catch (err) {
    // Handle server errors
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

module.exports = {
  sendContact,
  getAllContacts,
  markAsReviewed,
};
