const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendOTPEmail } = require('../utils/sendEmail');

const generateOTP = () => String(Math.floor(100000 + Math.random() * 900000));

// Register
router.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password are required' });

    const existing = await User.findOne({ email });
    if (existing && existing.isVerified) return res.status(409).json({ message: 'Email already registered' });

    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    if (existing) {
      existing.password = password;
      existing.otp = otp;
      existing.otpExpires = otpExpires;
      await existing.save();
    } else {
      await User.create({ email, password, otp, otpExpires });
    }

    await sendOTPEmail(email, otp);
    res.status(201).json({ message: 'OTP sent to your email.' });
  } catch (err) {
    console.error('Register error:', err.message);
    res.status(500).json({ message: err.message || 'Server error' });
  }
});

// Verify OTP
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });

    if (!user || !user.otp) return res.status(400).json({ message: 'No pending verification for this email' });
    if (user.otpExpires < Date.now()) return res.status(400).json({ message: 'OTP has expired. Please register again.' });
    if (user.otp !== otp) return res.status(400).json({ message: 'Incorrect OTP' });

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    res.json({ message: 'Email verified successfully!' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password are required' });

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid email or password' });

    const match = await user.comparePassword(password);
    if (!match) return res.status(401).json({ message: 'Invalid email or password' });

    if (!user.isVerified) return res.status(403).json({ message: 'Please verify your email before logging in' });

    const token = jwt.sign({ userId: user.userId, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, email: user.email });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
