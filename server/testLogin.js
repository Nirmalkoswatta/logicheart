const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    const User = require('./models/User');
    const email = 'nirmalkoza@gmail.com';
    const user = await User.findOne({ email });
    
    if (!user) {
      console.log('User not found');
      process.exit(1);
    }

    console.log('isVerified:', user.isVerified);
    
    const passwords = ['123456789', 'Abcd@1234', 'password123'];
    
    for (const pwd of passwords) {
      const match = await bcrypt.compare(pwd, user.password);
      console.log(`Password "${pwd}": ${match ? 'MATCH' : 'NO MATCH'}`);
    }
    
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
  });
