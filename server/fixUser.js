const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    const User = require('./models/User');
    
    // Option 1: Verify the existing user
    const existingUser = await User.findOne({ email: 'nirmalkoza@gmail.com' });
    if (existingUser) {
      existingUser.isVerified = true;
      existingUser.otp = undefined;
      existingUser.otpExpires = undefined;
      
      // Reset password to a known value
      const salt = await bcrypt.genSalt(10);
      existingUser.password = await bcrypt.hash('Test@1234', salt);
      
      await existingUser.save();
      console.log('✅ Updated existing user:');
      console.log('   Email: nirmalkoza@gmail.com');
      console.log('   Password: Test@1234');
      console.log('   isVerified: true');
    }
    
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
  });
