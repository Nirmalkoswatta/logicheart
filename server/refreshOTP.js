// Script to refresh OTP for testing
// Run this with: node refreshOTP.js <email>

const mongoose = require('mongoose');
require('dotenv').config();

const email = process.argv[2];

if (!email) {
  console.error('Please provide an email address');
  console.log('Usage: node refreshOTP.js <email>');
  process.exit(1);
}

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/logicheart')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

const User = require('./models/User');

async function refreshOTP() {
  try {
    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });
    
    if (!user) {
      console.log('User not found with email:', normalizedEmail);
      process.exit(1);
    }

    // Generate new OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

    user.otp = otp;
    user.otpExpires = otpExpires;
    await user.save();

    console.log('\n=== OTP Refreshed Successfully ===');
    console.log('Email:', user.email);
    console.log('Username:', user.username);
    console.log('New OTP:', otp);
    console.log('Expires at:', new Date(otpExpires));
    console.log('Valid for:', '10 minutes');
    console.log('\nUse this OTP to verify your account!');
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

refreshOTP();
