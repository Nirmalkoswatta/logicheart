const express = require('express');
const router = require('express').Router();
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const { sendOTP } = require('../utils/emailService');

const formatDuration = (secs) => {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
};

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'secret123', {
    expiresIn: '30d',
  });
};

const buildUserPayload = (user, { includeToken = false, extra = {} } = {}) => {
  const payload = {
    _id: user.id,
    username: user.username,
    email: user.email,
    score: user.score ?? 0,
    easyScore: user.easyScore ?? 0,
    mediumScore: user.mediumScore ?? 0,
    hardScore: user.hardScore ?? 0,
    attempts: user.attempts ?? 3,
    carrots: user.carrots ?? 0,
    hearts: user.hearts ?? 0,
    isAdmin: Boolean(user.isAdmin),
    isVerified: Boolean(user.isVerified),
    isOnline: Boolean(user.isOnline),
    lastLoginAt: user.lastLoginAt,
    lastLogoutAt: user.lastLogoutAt,
    lastSeenAt: user.lastSeenAt,
    lastPasswordChangedAt: user.lastPasswordChangedAt,
    ...extra,
  };

  if (includeToken) {
    payload.token = generateToken(user._id);
  }

  return payload;
};

const logUserActivity = async ({ actor, action, details, req, metadata, targetUser }) => {
  try {
    await ActivityLog.create({
      user: actor._id,
      username: actor.username,
      email: actor.email,
      action,
      details,
      metadata,
      targetId: targetUser?._id,
      targetUsername: targetUser?.username,
      targetEmail: targetUser?.email,
      ipAddress: req.ip,
    });
  } catch (_) {
  }
};

const protectUser = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret123');
      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        res.status(401);
        throw new Error('Not authorized');
      }

      req.user = user;
      next();
      return;
    } catch (error) {
      res.status(401);
      throw new Error('Not authorized, token failed');
    }
  }

  res.status(401);
  throw new Error('Not authorized, no token');
});

const authorizeSelfOrAdmin = (req, res, next) => {
  if (!req.user) {
    res.status(401);
    throw new Error('Not authorized');
  }

  if (req.user.isAdmin || req.user._id.toString() === req.params.id) {
    next();
    return;
  }

  res.status(403);
  throw new Error('Not authorized to manage this user');
};

// @desc    Register new user & Send OTP
// @route   POST /api/users
// @access  Public
router.post(
  '/',
  asyncHandler(async (req, res) => {
    try {
      const { username, email, password } = req.body;

      console.log('Registration attempt:', { username, email: email?.toLowerCase() });

      if (!username || !email || !password) {
        res.status(400);
        throw new Error('Please add all fields');
      }

      // Normalize email to lowercase
      const normalizedEmail = email.toLowerCase().trim();

      // Check if user exists (case-insensitive)
      const userExists = await User.findOne({ email: normalizedEmail });

      console.log('User exists check:', { email: normalizedEmail, exists: !!userExists });

      if (userExists) {
        res.status(400);
        throw new Error('User already exists');
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Generate OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

      console.log('Creating user with email:', normalizedEmail);

      // Create user
      const user = await User.create({
        username,
        email: normalizedEmail,
        password: hashedPassword,
        otp,
        otpExpires,
        isVerified: false,
      });

      console.log('User created successfully:', user._id);

      if (user) {
        // Send OTP Email
        try {
          await sendOTP(user.email, otp);
          console.log('OTP sent to:', user.email);
        } catch (emailError) {
          console.error('Email sending failed:', emailError.message);
          // Continue even if email fails - user is created
        }

        res.status(201).json({
          _id: user.id,
          username: user.username,
          email: user.email,
          message: 'Registration successful. OTP sent to email.',
          // TEMPORARY: Include OTP in response for testing (remove in production)
          otp: otp,
        });
      } else {
        res.status(400);
        throw new Error('Invalid user data');
      }
    } catch (error) {
      console.error('Registration error:', error.message);
      console.error('Error stack:', error.stack);
      throw error;
    }
  })
);

// @desc    Verify OTP
// @route   POST /api/users/verify-otp
// @access  Public
router.post(
  '/verify-otp',
  asyncHandler(async (req, res) => {
    const { email, otp } = req.body;

    console.log('=== OTP Verification Request ===');
    console.log('Received email:', email);
    console.log('Received OTP:', otp);
    console.log('OTP type:', typeof otp);
    console.log('OTP length:', otp?.length);

    const normalizedEmail = email.toLowerCase().trim();
    const trimmedOtp = otp.toString().trim();

    console.log('Normalized email:', normalizedEmail);
    console.log('Trimmed OTP:', trimmedOtp);

    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      console.log('User not found for email:', normalizedEmail);
      res.status(400);
      throw new Error('User not found');
    }

    console.log('User found:', user._id);
    console.log('Stored OTP:', user.otp);
    console.log('Stored OTP type:', typeof user.otp);
    console.log('OTP Expires:', user.otpExpires);
    console.log('Current time:', Date.now());
    console.log('Time remaining (ms):', user.otpExpires - Date.now());
    console.log('OTP match:', user.otp === trimmedOtp);
    console.log('Time valid:', user.otpExpires > Date.now());

    if (user.isVerified) {
      console.log('User already verified');
      const now = new Date();
      user.isOnline = true;
      user.lastLoginAt = now;
      user.lastSeenAt = now;
      await user.save();

      await logUserActivity({
        actor: user,
        action: 'USER_LOGIN',
        details: `${user.username} logged in`,
        req,
        metadata: {
          loginAt: now,
        },
      });

      res.status(200).json(buildUserPayload(user, {
        includeToken: true,
        extra: { message: 'User already verified' },
      }));
      return;
    }

    // Compare OTPs with trimming and ensure both are strings
    const otpMatch = user.otp === trimmedOtp;
    const timeValid = user.otpExpires > Date.now();

    if (otpMatch && timeValid) {
      console.log('OTP verification successful!');
      const now = new Date();
      user.isVerified = true;
      user.isOnline = true;
      user.lastLoginAt = now;
      user.lastSeenAt = now;
      user.otp = undefined;
      user.otpExpires = undefined;
      await user.save();

      await logUserActivity({
        actor: user,
        action: 'USER_REGISTERED',
        details: `${user.username} completed registration`,
        req,
        metadata: {
          loginAt: now,
        },
      });

      res.json(buildUserPayload(user, { includeToken: true }));
    } else {
      console.log('OTP verification failed!');
      console.log('Reason: OTP match =', otpMatch, ', Time valid =', timeValid);
      res.status(400);
      throw new Error('Invalid or expired OTP');
    }
  })
);

// @desc    Resend OTP
// @route   POST /api/users/resend-otp
// @access  Public
router.post(
  '/resend-otp',
  asyncHandler(async (req, res) => {
    const { email } = req.body;

    console.log('=== Resend OTP Request ===');
    console.log('Email:', email);

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      console.log('User not found for email:', normalizedEmail);
      res.status(404);
      throw new Error('User not found');
    }

    if (user.isVerified) {
      console.log('User already verified');
      res.status(400);
      throw new Error('User already verified');
    }

    // Generate new OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

    console.log('Generated new OTP:', otp);
    console.log('OTP expires at:', new Date(otpExpires));

    user.otp = otp;
    user.otpExpires = otpExpires;
    await user.save();

    console.log('OTP saved to database');

    try {
      await sendOTP(user.email, otp);
      console.log('OTP email sent successfully');
    } catch (emailError) {
      console.error('Email sending failed:', emailError.message);
      // Continue even if email fails
    }

    res.json({
      message: 'OTP resent successfully',
      // TEMPORARY: Include OTP in response for testing (remove in production)
      otp: otp
    });
  })
);

// @desc    Authenticate a user
// @route   POST /api/users/login
// @access  Public
router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { email, password } = req.body; // 'email' field might contain username

    // Normalize input
    const loginIdentifier = email.toLowerCase().trim();

    // Check for user by email OR username
    const user = await User.findOne({
      $or: [
        { email: loginIdentifier },
        { username: { $regex: new RegExp('^' + loginIdentifier + '$', 'i') } }
      ]
    });

    if (user && (await bcrypt.compare(password, user.password))) {
      if (!user.isVerified) {
        res.status(401);
        throw new Error('Please verify your email first.');
      }

      const now = new Date();
      user.isOnline = true;
      user.lastLoginAt = now;
      user.lastSeenAt = now;
      await user.save();

      await logUserActivity({
        actor: user,
        action: 'USER_LOGIN',
        details: `${user.username} logged in`,
        req,
        metadata: {
          loginAt: now,
        },
      });

      res.json(buildUserPayload(user, { includeToken: true }));
    } else {
      res.status(400);
      throw new Error('Invalid credentials');
    }
  })
);

// @desc    Mark user presence as active
// @route   PUT /api/users/:id/presence
// @access  Private
router.put(
  '/:id/presence',
  protectUser,
  authorizeSelfOrAdmin,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);

    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    user.isOnline = true;
    user.lastSeenAt = new Date();
    await user.save();

    res.json(buildUserPayload(user));
  })
);

// @desc    Logout current user
// @route   POST /api/users/:id/logout
// @access  Private
router.post(
  '/:id/logout',
  protectUser,
  authorizeSelfOrAdmin,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);

    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    const now = new Date();
    const sessionDurationSecs = Number.isFinite(req.body?.sessionDurationSecs)
      ? Math.max(0, Math.floor(req.body.sessionDurationSecs))
      : null;

    user.isOnline = false;
    user.lastLogoutAt = now;
    user.lastSeenAt = now;
    await user.save();

    await logUserActivity({
      actor: user,
      action: 'USER_LOGOUT',
      details: `${user.username} logged out`,
      req,
      metadata: {
        sessionDurationSecs,
        sessionDurationLabel: sessionDurationSecs ? formatDuration(sessionDurationSecs) : null,
      },
    });

    res.json({ message: 'Logout recorded' });
  })
);

// @desc    Update current user password
// @route   PUT /api/users/:id/password
// @access  Private
router.put(
  '/:id/password',
  protectUser,
  authorizeSelfOrAdmin,
  asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    if (!newPassword || newPassword.trim().length < 6) {
      res.status(400);
      throw new Error('New password must be at least 6 characters');
    }

    if (req.user._id.toString() === user._id.toString()) {
      if (!currentPassword) {
        res.status(400);
        throw new Error('Current password is required');
      }

      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        res.status(400);
        throw new Error('Current password is incorrect');
      }
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.lastPasswordChangedAt = new Date();
    user.lastSeenAt = new Date();
    await user.save();

    await logUserActivity({
      actor: req.user,
      action: 'PASSWORD_UPDATED',
      details: req.user._id.toString() === user._id.toString()
        ? `${user.username} updated their password`
        : `${req.user.username} updated password for ${user.username}`,
      req,
      metadata: {
        updatedAt: user.lastPasswordChangedAt,
        changedByAdmin: req.user._id.toString() !== user._id.toString(),
      },
      targetUser: req.user._id.toString() === user._id.toString() ? null : user,
    });

    res.json({
      message: 'Password updated successfully',
      user: buildUserPayload(user),
    });
  })
);

// @desc    Reset user stats (Game Over -> Restart)
// @route   PUT /api/users/:id/reset
// @access  Public
router.put('/:id/reset', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (user) {
      const finalScore = user.score;
      const finalCarrots = user.carrots;
      const finalHearts = user.hearts;
      const playtime = req.body && req.body.playtime ? req.body.playtime : null;
      user.isOnline = true;
      user.lastSeenAt = new Date();

      // Log game session end
      await logUserActivity({
        actor: user,
        action: 'GAME_PLAYED',
        details: `Game over - final score: ${finalScore}` +
          (playtime ? ` · session: ${formatDuration(playtime)}` : ''),
        req,
        metadata: {
          finalScore,
          carrots: finalCarrots,
          hearts: finalHearts,
          playtimeSecs: playtime,
        },
      });

      user.score = 0;
      user.attempts = 3;
      user.carrots = 0;
      user.hearts = 0;
      // Don't reset difficulty scores on play again - those are lifetime achievements
      const updatedUser = await user.save();
      res.json(buildUserPayload(updatedUser));
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Delete user (self-delete)
// @route   DELETE /api/users/:id
// @access  Private
router.delete('/:id', protectUser, authorizeSelfOrAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (user) {
      const sessionDurationSecs = Number.isFinite(req.body?.sessionDurationSecs)
        ? Math.max(0, Math.floor(req.body.sessionDurationSecs))
        : null;
      const deletedBySelf = req.user._id.toString() === user._id.toString();

      await logUserActivity({
        actor: req.user,
        action: deletedBySelf ? 'USER_DELETED_SELF' : 'DELETE_USER',
        details: deletedBySelf
          ? `${user.username} deleted their own account`
          : `${req.user.username} deleted user ${user.username}`,
        req,
        metadata: {
          score: user.score,
          carrots: user.carrots,
          hearts: user.hearts,
          wasOnline: user.isOnline,
          lastLoginAt: user.lastLoginAt,
          lastSeenAt: user.lastSeenAt,
          sessionDurationSecs,
          sessionDurationLabel: sessionDurationSecs ? formatDuration(sessionDurationSecs) : null,
        },
        targetUser: user,
      });

      await User.deleteOne({ _id: req.params.id });
      res.json({ message: 'User removed' });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get leaderboard
// @route   GET /api/users/leaderboard/top
// @access  Public
router.get('/leaderboard/top', async (req, res) => {
  try {
    const users = await User.find({ isAdmin: { $ne: true } })
      .sort({ score: -1 })
      .limit(10)
      .select('username score easyScore mediumScore hardScore carrots hearts');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get user info
// @route   GET /api/users/:id
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (user) {
      res.json(buildUserPayload(user));
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Add points to user score
// @route   PUT /api/users/:id/score
// @access  Public
router.put('/:id/score', async (req, res) => {
  try {
    const { points, carrots, hearts, difficulty } = req.body;
    console.log('=== Score Update Request ===');
    console.log('Points:', points);
    console.log('Difficulty:', difficulty);
    console.log('Request body:', req.body);

    const user = await User.findById(req.params.id);

    if (user) {
      user.isOnline = true;
      user.lastSeenAt = new Date();
      user.score += points || 0;
      user.carrots += carrots || 0;
      user.hearts += hearts || 0;

      // Update difficulty-specific score
      if (difficulty === 'easy') {
        console.log('Updating easyScore');
        user.easyScore += points || 0;
      } else if (difficulty === 'medium') {
        console.log('Updating mediumScore');
        user.mediumScore += points || 0;
      } else if (difficulty === 'hard') {
        console.log('Updating hardScore');
        user.hardScore += points || 0;
      } else {
        console.log('No matching difficulty:', difficulty);
      }

      const updatedUser = await user.save();
      console.log('Updated scores:', {
        total: updatedUser.score,
        easy: updatedUser.easyScore,
        medium: updatedUser.mediumScore,
        hard: updatedUser.hardScore
      });
      res.json(buildUserPayload(updatedUser));
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Reduce attempts by 1
// @route   PUT /api/users/:id/wrong
// @access  Public
router.put('/:id/wrong', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (user) {
      if (user.attempts > 0) {
        user.isOnline = true;
        user.lastSeenAt = new Date();
        user.attempts -= 1;
        const updatedUser = await user.save();
        res.json(buildUserPayload(updatedUser));
      } else {
        res.status(400).json({ message: 'No attempts left' });
      }
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Test Email Service
// @route   GET /api/users/test-email
// @access  Public
router.get(
  '/test-email',
  asyncHandler(async (req, res) => {
    const isProd = process.env.NODE_ENV === 'production';
    if (isProd) {
      res.status(404);
      throw new Error('Not found');
    }

    const testEmail = (req.query.email || 'test@example.com').toString().trim();
    const testOtp = '123456';

    try {
      await sendOTP(testEmail, testOtp);
      res.status(200).json({ message: 'Test email sent successfully.' });
    } catch (error) {
      console.error('Test email failed:', error.message);
      res.status(500).json({ message: 'Failed to send test email.', error: error.message });
    }
  })
);

module.exports = router;
