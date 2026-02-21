import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout, updateScore, reduceAttempts } from '../redux/userSlice';
import './Home.scss';

const Home = () => {
  const { currentUser } = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [showRules, setShowRules] = useState(false);

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
    }
  }, [currentUser, navigate]);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const handleAddScore = () => {
    if (currentUser) {
      // Mocking carrots/hearts for the "test" button action if needed, or just score
      dispatch(updateScore({ userId: currentUser._id, points: 10, carrots: 1, hearts: 1 }));
    }
  };

  const handleWrongAnswer = () => {
    if (currentUser) {
      dispatch(reduceAttempts(currentUser._id));
    }
  };

  if (!currentUser) return null;

  return (
    <div className="dashboard-container">

      <header className="dashboard-header">
        <div className="header-top">
          <div className="header-logo">Logic Heart</div>
          <div className="header-user-actions">
            <span className="user-greeting">Welcome, {currentUser.username || 'Explorer'}</span>
            <button onClick={handleLogout} className="logout-btn">Logout</button>
          </div>
        </div>

        <nav className="dashboard-nav-bar">
          <button className="nav-item active">Home</button>
          <button className="nav-item" onClick={() => navigate('/leaderboard')}>Leaderboard</button>
          <button className="nav-item" onClick={() => navigate('/settings')}>Settings</button>
        </nav>
      </header>

      <main className="dashboard-content">
        <section className="stats-section">
          <div className="stat-card level-card">
            <h3>Level</h3>
            <div className="stat-value">{Math.floor(currentUser.score / 50) + 1}</div>
          </div>
          <div className="stat-card score-card">
            <h3>Score</h3>
            <div className="stat-value">{currentUser.score}</div>
          </div>
          <div className="stat-card attempts-card">
            <h3>Attempts</h3>
            <div className="stat-value">{currentUser.attempts}</div>
          </div>
        </section>

        <section className="game-controls-section">
          <button className="start-game-btn" onClick={() => navigate('/game')}>
            Start Mission
          </button>


        </section>

        <footer className="dashboard-footer">
          <button className="rules-link" onClick={() => setShowRules(!showRules)}>
            How to Play
          </button>
        </footer>

        {showRules && (
          <div className="rules-modal">
            <div className="rules-content">
              <h2>How to Play</h2>
              <ul>
                <li>Analyze the puzzle image.</li>
                <li>Count quantity of Carrots and Hearts.</li>
                <li>Submit your counts.</li>
                <li>Correct answers earn points and fruits!</li>
              </ul>
              <button className="close-rules" onClick={() => setShowRules(false)}>Close</button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Home;
