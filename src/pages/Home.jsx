import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logoutUser } from '../redux/userSlice';
import { toast } from 'react-toastify';
import './Home.scss';

const NAV_ITEMS = [
  { label: 'Home', icon: '🏠', path: '/home' },
  { label: 'Leaderboard', icon: '🏆', path: '/leaderboard' },
  { label: 'Settings', icon: '⚙️', path: '/settings' },
];

const Home = () => {
  const { currentUser } = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser) navigate('/login');
  }, [currentUser, navigate]);

  const handleLogout = async () => {
    await dispatch(logoutUser());
    toast.info('Logged out successfully.');

    navigate('/login');
  };

  if (!currentUser) return null;

  const rawScore = typeof currentUser.score === 'number' ? currentUser.score : Number(currentUser.score);
  const scoreValue = Number.isFinite(rawScore) ? rawScore : null;
  const rawAttempts = typeof currentUser.attempts === 'number' ? currentUser.attempts : Number(currentUser.attempts);
  const attemptsValue = Number.isFinite(rawAttempts) ? rawAttempts : 0;
  const levelValue = scoreValue === null ? 'N/A' : Math.floor(scoreValue / 50) + 1;

  return (
    <div className="hd-root">

      {/* ── Header ── */}
      <header className="hd-header">
        <div className="hd-logo">Logic<span>Heart</span></div>
        <div className="hd-header-right">
          <span className="hd-greeting">👋 {currentUser.username || 'Explorer'}</span>
          <button className="hd-logout" onClick={handleLogout}>Logout</button>
        </div>
      </header>

      <div className="hd-shell">

        {/* ── Sidebar ── */}
        <aside className="hd-sidebar">
          <nav>
            {NAV_ITEMS.map(({ label, icon, path }) => (
              <button
                key={label}
                className={`hd-nav-item ${path === '/home' ? 'active' : ''}`}
                onClick={() => navigate(path)}
              >
                <span className="hd-nav-icon">{icon}</span>
                <span className="hd-nav-label">{label}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* ── Main ── */}
        <main className="hd-main">

          {/* Welcome banner */}
          <div className="hd-banner">
            <div>
              <h2 className="hd-banner-title">Welcome back, {currentUser.username || 'Explorer'}!</h2>
              <p className="hd-banner-sub">Ready to sharpen your counting skills today?</p>
            </div>
            <div className="hd-banner-icon">🧩</div>
          </div>

          {/* Stats */}
          <section className="hd-stats">
            <div className="hd-stat-card hd-stat--level">
              <div className="hd-stat-icon">🎯</div>
              <div className="hd-stat-info">
                <span className="hd-stat-label">Level</span>
                <span className="hd-stat-value">{levelValue}</span>
              </div>
            </div>
            <div className="hd-stat-card hd-stat--score">
              <div className="hd-stat-icon">⭐</div>
              <div className="hd-stat-info">
                <span className="hd-stat-label">Score</span>
                <span className="hd-stat-value">{scoreValue ?? 0}</span>
              </div>
            </div>
            <div className="hd-stat-card hd-stat--attempts">
              <div className="hd-stat-icon">❤️</div>
              <div className="hd-stat-info">
                <span className="hd-stat-label">Attempts</span>
                <span className="hd-stat-value">{attemptsValue}</span>
              </div>
            </div>
          </section>

          {/* CTA */}
          <section className="hd-cta">
            <button className="hd-start-btn" onClick={() => navigate('/game')}>
              🚀 Start Mission
            </button>
          </section>

          {/* How to Play */}
          <section className="hd-rules">
            <h3 className="hd-rules-title">📖 How to Play</h3>
            <ul className="hd-rules-list">
              <li><span>🖼️</span> Analyze the puzzle image carefully.</li>
              <li><span>🥕</span> Count the number of Carrots.</li>
              <li><span>❤️</span> Count the number of Hearts.</li>
              <li><span>✅</span> Submit your counts to earn points!</li>
            </ul>
          </section>

        </main>
      </div>

    </div>
  );
};

export default Home;
