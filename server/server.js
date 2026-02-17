const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const userRoutes = require('./routes/userRoutes');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
app.use(cors({
  origin: true, // Reflect the request origin
  credentials: true,
}));
app.use(express.json());

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
