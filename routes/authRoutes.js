const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

// Multiple Admin Emails allowed list
const ALLOWED_ADMIN_EMAILS = [
    "rohitharuchamy11@gmail.com",
    "rohitha.24csc@kongu.edu"
]; 

// Temporary store for OTPs
const otpStorage = {};

// Nodemailer Transporter Setup
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER, // Your email
        pass: process.env.EMAIL_PASS  // Your Gmail App Password
    }
});

// Register Route
router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        
        const cleanEmail = email.trim().toLowerCase();
        if (!ALLOWED_ADMIN_EMAILS.includes(cleanEmail)) {
            return res.status(403).json({ message: "Registration is restricted! Unauthorized email ID." });
        }

        const existingUser = await User.findOne({ email: cleanEmail });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists with this email" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({ username, email: cleanEmail, password: hashedPassword });
        await newUser.save();
        res.status(201).json({ message: "User registered successfully!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Login Route
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const cleanEmail = email.trim().toLowerCase();
        if (!ALLOWED_ADMIN_EMAILS.includes(cleanEmail)) {
            return res.status(403).json({ message: "Access Denied: Unauthorized Email ID!" });
        }

        const user = await User.findOne({ email: cleanEmail });
        if (!user) {
            return res.status(400).json({ message: "Invalid email or password" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid email or password" });
        }

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '1d' });
        res.json({ token, username: user.username, message: "Login successful!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Change Password Route (Logged in)
router.post('/change-password', async (req, res) => {
    try {
        const { email, currentPassword, newPassword } = req.body;
        const cleanEmail = email.trim().toLowerCase();
        
        const user = await User.findOne({ email: cleanEmail });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Incorrect current password" });
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();

        res.json({ message: "Password changed successfully!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 1. Forgot Password: Send OTP
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        const cleanEmail = email.trim().toLowerCase();

        const user = await User.findOne({ email: cleanEmail });
        if (!user) {
            return res.status(404).json({ message: "User email not found in VKN Inventory records!" });
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        otpStorage[cleanEmail] = { otp, expires: Date.now() + 10 * 60 * 1000 }; // Valid for 10 mins

        // Send Email
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: cleanEmail,
            subject: 'VKN INVENTORY - Password Reset OTP',
            text: `Your OTP for resetting your VKN Inventory password is: ${otp}. It is valid for 10 minutes.`
        };

        await transporter.sendMail(mailOptions);
        res.json({ message: "OTP sent successfully to your email!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. Reset Password with OTP
router.post('/reset-password', async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;
        const cleanEmail = email.trim().toLowerCase();

        const storedData = otpStorage[cleanEmail];
        if (!storedData) {
            return res.status(400).json({ message: "OTP request not found or expired. Please request again." });
        }

        if (storedData.otp !== otp || Date.now() > storedData.expires) {
            return res.status(400).json({ message: "Invalid or expired OTP!" });
        }

        const user = await User.findOne({ email: cleanEmail });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();

        // Clear OTP
        delete otpStorage[cleanEmail];

        res.json({ message: "Password reset successfully! You can login now." });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;