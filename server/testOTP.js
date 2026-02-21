// Test script to verify OTP functionality
// Run this with: node testOTP.js

const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/logicheart')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

const User = require('./models/User');

async function testOTP() {
  try {
    // Get the most recent unverified user
    const user = await User.findOne({ isVerified: false }).sort({ createdAt: -1 });
    
    if (!user) {
      console.log('No unverified users found');
      process.exit(0);
    }

    console.log('\n=== User OTP Information ===');
    console.log('Email:', user.email);
    console.log('Username:', user.username);
    console.log('Stored OTP:', user.otp);
    console.log('OTP Type:', typeof user.otp);
    console.log('OTP Length:', user.otp?.length);
    console.log('OTP Expires:', user.otpExpires);
    console.log('Current Time:', new Date());
    console.log('Time Remaining:', Math.floor((user.otpExpires - Date.now()) / 1000), 'seconds');
    console.log('Is Expired:', user.otpExpires < Date.now());
    console.log('Is Verified:', user.isVerified);
    
    // Test OTP comparison
    const testOtp = user.otp;
    console.log('\n=== OTP Comparison Test ===');
    console.log('Test OTP:', testOtp);
    console.log('Strict equality (===):', user.otp === testOtp);
    console.log('Loose equality (==):', user.otp == testOtp);
    console.log('With trim:', user.otp === testOtp.trim());
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testOTP();
