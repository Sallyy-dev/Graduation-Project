const nodemailer = require("nodemailer");

const sendEmail = async (to, subject, message) => {
  const email = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.USER_EMAIL,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: `"Auth System" <${process.env.USER_EMAIL}>`,
    to,
    subject,
    text: message,
  };

  await email.sendMail(mailOptions);
  console.log(`Email sent to ${to}`);
};
module.exports = sendEmail;
