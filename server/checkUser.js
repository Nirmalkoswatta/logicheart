const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const checkEmail = process.argv[2];

if (!checkEmail) {
  console.log('Please provide an email to check. Usage: node checkUser.js <email>');
  process.exit(1);
}

const checkUser = async () => {
  try {
    const user = await User.findOne({ email: checkEmail });
    if (user) {
      console.log(`❌ User with email "${checkEmail}" ALREADY EXISTS.`);
      console.log('ID:', user._id);
      console.log('Username:', user.username);
      console.log('Verified:', user.isVerified);
    } else {
      console.log(`✅ User with email "${checkEmail}" does NOT exist. You can register.`);
    }
    process.exit(0);
  } catch (error) {
    console.error('Error checking user:', error);
    process.exit(1);
  }
};

checkUser();
