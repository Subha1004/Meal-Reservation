const nodemailer = require('nodemailer');

let transporter = null;

function getTransporter() {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;
  if (!user || !pass) return null;

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: { user, pass }
    });
  }
  return transporter;
}

async function sendMail({ to, subject, text, html }) {
  const mailer = getTransporter();
  if (!mailer) {
    throw new Error('Email is not configured. Set EMAIL_USER and EMAIL_PASS in .env');
  }

  return mailer.sendMail({
    from: process.env.EMAIL_FROM || `"Meal Reservation" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    text,
    html
  });
}

module.exports = { sendMail, getTransporter };
