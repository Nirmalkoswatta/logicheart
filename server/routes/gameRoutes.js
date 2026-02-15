const express = require('express');
const router = express.Router();
const axios = require('axios');

// @desc    Get a game question
// @route   GET /api/game/question
// @access  Public (or Private if we want to restrict)
router.get('/question', async (req, res) => {
  try {
    const response = await axios.get('http://marcconrad.com/uob/heart/api.php?out=json');
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching game question:', error);
    res.status(500).json({ message: 'Failed to fetch game question' });
  }
});

module.exports = router;
