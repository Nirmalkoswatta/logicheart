const mongoose = require('mongoose');

const userSchema = mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Please add a username'],
    },
    email: {
      type: String,
      required: [true, 'Please add an email'],
      unique: true,
    },
    password: {
      type: String,
      required: [true, 'Please add a password'],
    },
    score: {
      type: Number,
      default: 0,
    },
    easyScore: {
      type: Number,
      default: 0,
    },
    mediumScore: {
      type: Number,
      default: 0,
    },
    hardScore: {
      type: Number,
      default: 0,
    },
    attempts: {
      type: Number,
      default: 3,
    },
    carrots: {
      type: Number,
      default: 0,
    },
    hearts: {
      type: Number,
      default: 0,
    },
    otp: {
      type: String,
    },
    otpExpires: {
      type: Date,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('User', userSchema);
