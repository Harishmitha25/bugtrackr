const nodemailer = require("nodemailer");

const sendEmail = async ({ toEmail, subject, text, html }) => {
  try {
    // Email transporter setup
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER, //From dotenv
        pass: process.env.EMAIL_PASS, //From dotenv
      },
    });

    // Email options
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: Array.isArray(toEmail) ? toEmail.join(", ") : toEmail,
      subject,
      text,
      html,
    };

    // Send the email
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Error sending email:", error.message);
  }
};

module.exports = { sendEmail };
