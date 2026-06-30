const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  requireTLS: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

const sendOTPEmail = async (email, otp) => {
  await transporter.sendMail({
    from: `"Inforvio" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `Your verification code is ${otp}`,
    html: `
      <div style="font-family:sans-serif;max-width:420px;margin:auto">
        <h2 style="color:#2563EB">Verify your email</h2>
        <p>Use the code below to complete your registration. It expires in <strong>10 minutes</strong>.</p>
        <div style="font-size:36px;font-weight:700;letter-spacing:10px;color:#1e40af;padding:20px 0">${otp}</div>
        <p style="color:#6B7280;font-size:13px">If you didn't sign up for Inforvio, ignore this email.</p>
      </div>
    `,
  });
};

module.exports = { sendOTPEmail };
