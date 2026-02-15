// @desc    Get leaderboard
// @route   GET /api/users/leaderboard
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
