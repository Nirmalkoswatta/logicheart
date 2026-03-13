const express = require('express');
const router = express.Router();
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const asyncHandler = require('express-async-handler');
const jwt = require('jsonwebtoken');

// Middleware to protect admin routes
const adminOnly = asyncHandler(async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret123');
      const user = await User.findById(decoded.id).select('-password');

      if (user && user.isAdmin) {
        req.user = user;
        next();
      } else {
        res.status(403);
        throw new Error('Not authorized as an admin');
      }
    } catch (error) {
      res.status(401);
      throw new Error('Not authorized, token failed');
    }
  }

  if (!token) {
    res.status(401);
    throw new Error('Not authorized, no token');
  }
});

// Helper for logging admin actions
const logAction = async (userId, username, action, details, extra = {}) => {
  await ActivityLog.create({
    user: userId,
    username,
    action,
    details,
    ...extra,
  });
};

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
router.get('/users', adminOnly, asyncHandler(async (req, res) => {
  const users = await User.find({}).select('-password').sort({ createdAt: -1 });
  res.json(users);
}));

// @desc    Update user
// @route   PUT /api/admin/users/:id
// @access  Private/Admin
router.put('/users/:id', adminOnly, asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (user) {
    user.username = req.body.username || user.username;
    user.email = req.body.email || user.email;
    user.isAdmin = req.body.isAdmin !== undefined ? req.body.isAdmin : user.isAdmin;
    user.score = req.body.score !== undefined ? req.body.score : user.score;
    user.carrots = req.body.carrots !== undefined ? req.body.carrots : user.carrots;
    user.hearts = req.body.hearts !== undefined ? req.body.hearts : user.hearts;

    const updatedUser = await user.save();

    await logAction(
      req.user._id,
      req.user.username,
      'UPDATE_USER',
      `Updated user ${user.username} (${user.email})`,
      {
        email: req.user.email || '',
        targetId: user._id,
        targetUsername: user.username,
        targetEmail: user.email,
        ipAddress: req.ip,
      }
    );

    res.json(updatedUser);
  } else {
    res.status(404);
    throw new Error('User not found');
  }
}));

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
router.delete('/users/:id', adminOnly, asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (user) {
    if (user.isAdmin && user.username === 'admin') {
      res.status(400);
      throw new Error('Cannot delete protected admin account');
    }

    await User.deleteOne({ _id: req.params.id });

    await logAction(
      req.user._id,
      req.user.username,
      'DELETE_USER',
      `Admin deleted user ${user.username} (${user.email})`,
      {
        email: req.user.email || '',
        targetId: user._id,
        targetUsername: user.username,
        targetEmail: user.email,
        metadata: {
          score: user.score,
          carrots: user.carrots,
          hearts: user.hearts,
          wasOnline: user.isOnline,
          lastLoginAt: user.lastLoginAt,
          lastSeenAt: user.lastSeenAt,
        },
        ipAddress: req.ip,
      }
    );

    res.json({ message: 'User removed' });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
}));

// @desc    Get activity logs
// @route   GET /api/admin/logs
// @access  Private/Admin
router.get('/logs', adminOnly, asyncHandler(async (req, res) => {
  const logs = await ActivityLog.find({}).sort({ createdAt: -1 }).limit(300);
  res.json(logs);
}));

module.exports = router;
