import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Leaderboard.css';
import { API_BASE_URL } from '../config';

const Leaderboard = () => {
  const navigate = useNavigate();
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="leaderboard-container">
      <div className="leaderboard-content">
        <header className="leaderboard-header">
          <h1>Mission Scoreboard</h1>
          <p>Check your latest mission summary and see how other explorers are doing.</p>
        </header>

        {loading ? (
          <div style={{textAlign: 'center'}}>Loading scores...</div>
        ) : (
          <div className="leaderboard-table-container">
            <table className="leaderboard-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Player</th>
                  <th>Fruit Points</th>
                  <th>Heart Points</th>
                  <th>Total Score</th>
                </tr>
              </thead>
              <tbody>
                {leaders.map((player, index) => (
                  <tr key={player._id} className={`rank-${index + 1}`}>
                    <td><span className="rank-badge">{index + 1}</span></td>
                    <td>{player.username}</td>
                    <td>{player.carrots || 0}</td>
                    <td>{player.hearts || 0}</td>
                    <td>{player.score}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div style={{textAlign: 'center'}}>
            <button className="back-btn" onClick={() => navigate('/home')}>Back to Dashboard</button>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
