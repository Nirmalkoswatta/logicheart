const mongoose = require('mongoose');

let cachedPromise;

const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI || process.env.MONGODB_URI;

    console.log('Attempting to connect to MongoDB...');
    console.log('MONGO_URI exists:', !!process.env.MONGO_URI);
    console.log('MONGODB_URI exists:', !!process.env.MONGODB_URI);

    if (mongoose.connection.readyState === 1) {
      return mongoose.connection;
    }

    if (!uri) {
      throw new Error('MongoDB URI is not defined. Set MONGO_URI (or MONGODB_URI on Vercel).');
    }

    if (!cachedPromise) {
      cachedPromise = mongoose.connect(uri);
    }

    const conn = await cachedPromise;
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    console.error('Full error:', error);
    // Don't exit on Vercel, just log the error
    if (process.env.VERCEL) {
      console.error('Running on Vercel - not exiting process');
    } else {
      process.exit(1);
    }
    cachedPromise = undefined;
    throw error;
  }
};

module.exports = connectDB;
