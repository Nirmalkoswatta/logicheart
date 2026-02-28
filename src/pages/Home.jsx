import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout } from '../redux/userSlice';
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

  if (!currentUser) return null;

  const rawScore = typeof currentUser.score === 'number' ? currentUser.score : Number(currentUser.score);
  const scoreValue = Number.isFinite(rawScore) ? rawScore : null;
  const rawAttempts = typeof currentUser.attempts === 'number' ? currentUser.attempts : Number(currentUser.attempts);
  const attemptsValue = Number.isFinite(rawAttempts) ? rawAttempts : 0;
  const levelValue = scoreValue === null ? 'N/A' : Math.floor(scoreValue / 50) + 1;

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
      </header>

      <div className="dashboard-shell">
        <aside className="dashboard-sidebar" aria-label="Dashboard navigation">
          <button className="side-item active" type="button" onClick={() => navigate('/home')}>Home</button>
          <button className="side-item side-item--wide" type="button" onClick={() => navigate('/leaderboard')}>Leaderboard</button>
          <button className="side-item" type="button" onClick={() => navigate('/settings')}>Settings</button>
        </aside>

        <main className="dashboard-main">
          <section className="stats-section">
            <div className="stat-card level-card">
              <h3>Level</h3>
              <div className="stat-value">{levelValue}</div>
            </div>
            <div className="stat-card score-card">
              <h3>Score</h3>
              <div className="stat-value">{scoreValue ?? 0}</div>
            </div>
            <div className="stat-card attempts-card">
              <h3>Attempts</h3>
              <div className="stat-value">{attemptsValue}</div>
            </div>
          </section>

          <section className="game-controls-section">
            <button className="start-game-btn" onClick={() => navigate('/game')}>
              Start Mission
            </button>
          </section>

          <footer className="dashboard-footer">
            <button className="rules-link glowing" onClick={() => setShowRules(!showRules)}>
              How to Play
            </button>
          </footer>
        </main>
      </div>

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
    </div>
  );
};

export default Home;
