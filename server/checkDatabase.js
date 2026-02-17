const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const User = require('./models/User');

const checkDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Get all users
    const users = await User.find({});
    console.log(`\nTotal users in database: ${users.length}`);

    // Group by email to find duplicates
    const emailMap = {};
    users.forEach(user => {
      const email = user.email.toLowerCase();
      if (!emailMap[email]) {
        emailMap[email] = [];
      }
      emailMap[email].push({
        id: user._id,
        username: user.username,
        email: user.email,
        isVerified: user.isVerified,
        createdAt: user.createdAt
      });
    });

    // Find duplicates
    const duplicates = Object.entries(emailMap).filter(([email, users]) => users.length > 1);
    
    if (duplicates.length > 0) {
      console.log('\n⚠️  DUPLICATE EMAILS FOUND:');
      duplicates.forEach(([email, users]) => {
        console.log(`\nEmail: ${email}`);
        users.forEach((user, index) => {
          console.log(`  ${index + 1}. ID: ${user.id}, Username: ${user.username}, Verified: ${user.isVerified}, Created: ${user.createdAt}`);
        });
      });
    } else {
      console.log('\n✅ No duplicate emails found');
    }

    // List all emails
    console.log('\n📧 All registered emails:');
    Object.keys(emailMap).sort().forEach(email => {
      const user = emailMap[email][0];
      console.log(`  - ${email} (${user.username}, verified: ${user.isVerified})`);
    });

    // Check indexes
    const indexes = await User.collection.getIndexes();
    console.log('\n📊 Database Indexes:');
    console.log(JSON.stringify(indexes, null, 2));

    mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
};

checkDatabase();
