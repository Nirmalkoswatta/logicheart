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

  const getInitials = (name = '') =>
    name.slice(0, 2).toUpperCase() || '??';

  const getScoreForFilter = (player, filterType) => {
    if (filterType === 'easy') return player.easyScore || 0;
    if (filterType === 'medium') return player.mediumScore || 0;
    if (filterType === 'hard') return player.hardScore || 0;
    return player.score || 0; // 'all' uses total score
  };

  const getDifficultyLabel = (player, filterType) => {
    // For filtered view, return the filter difficulty
    if (filterType !== 'all' && filterType) return filterType;
    
    // For 'all' view, determine player's primary difficulty based on highest score
    const easy = player.easyScore || 0;
    const medium = player.mediumScore || 0;
    const hard = player.hardScore || 0;
    
    if (hard >= easy && hard >= medium && hard > 0) return 'hard';
    if (medium >= easy && medium > 0) return 'medium';
    if (easy > 0) return 'easy';
    return 'easy'; // default
  };

  // Filter and sort leaders based on selected difficulty
  const filteredLeaders = leaders
    .map(player => ({
      ...player,
      displayScore: getScoreForFilter(player, filter),
      difficultyLabel: getDifficultyLabel(player, filter)
    }))
    .sort((a, b) => b.displayScore - a.displayScore) // Sort by display score
    .slice(0, 10); // Top 10 only

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
              const diff = player.difficultyLabel;
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
                    <span className={isTop3 ? 'lb-score--highlight' : ''}>{player.displayScore}</span>
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
