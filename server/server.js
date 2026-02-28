const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const userRoutes = require('./routes/userRoutes');

// Load environment variables
dotenv.config();

// Connect to MongoDB
// In serverless (Vercel), avoid connecting at module load time.
// We'll connect lazily per-request with caching in connectDB().

const app = express();

// Middleware
app.use(cors({
  origin: '*', // Allow all origins
  credentials: true,
}));
app.use(express.json());

// Ensure database is connected before handling API routes
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('Database connection unavailable:', err.message);
    res.status(500).json({
      message: 'Database connection unavailable. Check MONGO_URI / MONGODB_URI in environment.',
      code: '500',
    });
  }
});

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('Request body:', req.body);
  }
  next();
});

// Routes
app.use('/api/users', userRoutes);
app.use('/api/game', require('./routes/gameRoutes'));

app.get('/', (req, res) => {
  res.send('LogicHeart API is running...');
});

// Error handling middleware (must be after routes)
app.use((err, req, res, next) => {
  console.error('Error caught by middleware:', err.message);
  console.error('Stack:', err.stack);

  const statusCode = res.statusCode !== 200 ? res.statusCode : 500;
  res.status(statusCode);
  res.json({
    message: err.message,
    error: err.message,
    code: statusCode.toString(),
    stack: process.env.NODE_ENV === 'production' ? '🥞' : err.stack,
  });
});

if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;
