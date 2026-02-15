const express = require('express');
const router = express.Router();
const User = require('../models/User');

// @desc    Register a new user
// @route   POST /api/users/register
// @access  Public
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create user
    const user = await User.create({
      username,
      email,
      password,
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        username: user.username,
        email: user.email,
        email: user.email,
        score: user.score,
        attempts: user.attempts,
        carrots: user.carrots,
        hearts: user.hearts,
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Login user
// @route   POST /api/users/login
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check for user email
    const user = await User.findOne({ email });

    if (user && (user.password === password)) {
      res.json({
        _id: user._id,
        username: user.username,
        email: user.email,
        score: user.score,
        attempts: user.attempts,
        carrots: user.carrots || 0,
        hearts: user.hearts || 0,
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Reset user stats (Game Over -> Restart)
// @route   PUT /api/users/:id/reset
// @access  Public
router.put('/:id/reset', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (user) {
      user.score = 0;
      user.attempts = 1; // "Sudden Death" - 1 attempt
      user.carrots = 0;
      user.hearts = 0;
      const updatedUser = await user.save();
      res.json(updatedUser);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Public
router.delete('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (user) {
      await user.remove(); // or User.deleteOne({ _id: req.params.id }) depending on mongoose version
      // safe bet:
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
    const users = await User.find({})
      .sort({ score: -1 })
      .limit(10)
      .select('username score carrots hearts');
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
      res.json({
        _id: user._id,
        username: user.username,
        email: user.email,
        score: user.score,
        attempts: user.attempts,
        carrots: user.carrots || 0,
        hearts: user.hearts || 0,
      });
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
    const { points, carrots, hearts } = req.body; 
    const user = await User.findById(req.params.id);

    if (user) {
      user.score += points || 0;
      user.carrots += carrots || 0;
      user.hearts += hearts || 0;
      const updatedUser = await user.save();
      res.json(updatedUser);
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
        user.attempts -= 1;
        const updatedUser = await user.save();
        res.json(updatedUser);
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



module.exports = router;
