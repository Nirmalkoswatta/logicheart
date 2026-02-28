import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Leaderboard.scss';
import { API_BASE_URL } from '../config';

const MEDALS = ['🥇', '🥈', '🥉'];

const Leaderboard = () => {
  const navigate = useNavigate();
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/users/leaderboard/top`);
        setLeaders(response.data);
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  const getDifficultyLabel = (score) => {
    const level = Math.floor(score / 50) + 1;
    if (level <= 3) return 'easy';
    if (level <= 7) return 'medium';
    return 'hard';
  };

  const getInitials = (name = '') =>
    name.slice(0, 2).toUpperCase() || '??';

  const filteredLeaders = leaders.filter((player) =>
    filter === 'all' ? true : getDifficultyLabel(player.score) === filter
  );

  return (
    <div className="lb-page">
      <div className="lb-card">

        {/* Header */}
        <div className="lb-header">
          <h1 className="lb-title">🏆 Mission Scoreboard</h1>
          <p className="lb-subtitle">See how explorers rank across all missions</p>
        </div>

        {/* Filters */}
        <div className="lb-filters">
          {['all', 'easy', 'medium', 'hard'].map((f) => (
            <button
              key={f}
              className={`lb-filter lb-filter--${f} ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? 'All' : f === 'easy' ? '🟢 Easy' : f === 'medium' ? '🟡 Medium' : '🔴 Hard'}
            </button>
          ))}
        </div>

        {/* List */}
        {loading ? (
          <div className="lb-loading">
            <div className="lb-spinner" />
            <span>Loading scores...</span>
          </div>
        ) : filteredLeaders.length === 0 ? (
          <div className="lb-empty">No players found for this filter.</div>
        ) : (
          <div className="lb-list">
            {/* Column headers */}
            <div className="lb-list-header">
              <span>Rank</span>
              <span>Player</span>
              <span>Level</span>
              <span>🥕 Fruits</span>
              <span>❤️ Hearts</span>
              <span>Score</span>
            </div>

            {filteredLeaders.map((player, index) => {
              const diff = getDifficultyLabel(player.score);
              const isTop3 = index < 3;
              return (
                <div
                  key={player._id}
                  className={`lb-row ${isTop3 ? `lb-row--top${index + 1}` : ''}`}
                >
                  <div className="lb-rank">
                    {isTop3
                      ? <span className="lb-medal">{MEDALS[index]}</span>
                      : <span className="lb-rank-num">{index + 1}</span>
                    }
                  </div>

                  <div className="lb-player">
                    <div className={`lb-avatar lb-avatar--${diff}`}>
                      {getInitials(player.username)}
                    </div>
                    <span className="lb-username">{player.username}</span>
                  </div>

                  <div className="lb-level">
                    <span className={`lb-badge lb-badge--${diff}`}>
                      {diff.charAt(0).toUpperCase() + diff.slice(1)}
                    </span>
                  </div>

                  <div className="lb-stat">{player.carrots || 0}</div>
                  <div className="lb-stat">{player.hearts || 0}</div>

                  <div className="lb-score">
                    <span className={isTop3 ? 'lb-score--highlight' : ''}>{player.score}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="lb-footer">
          <button className="lb-back-btn" onClick={() => navigate('/home')}>
            ← Back to Dashboard
          </button>
        </div>

      </div>
    </div>
  );
};

export default Leaderboard;
