import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchAllUsers, adminUpdateUser, adminDeleteUser, fetchActivityLogs } from '../redux/userSlice';
import { toast } from 'react-toastify';
import './AdminDashboard.scss';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { adminUsers, activityLogs, loading, currentUser } = useSelector((state) => state.user);

  useEffect(() => {
    if (!currentUser || !currentUser.isAdmin) {
      navigate('/login');
      return;
    }
    dispatch(fetchAllUsers());
    dispatch(fetchActivityLogs());
  }, [dispatch, currentUser, navigate]);

  const stats = {
    totalUsers: adminUsers.length,
    verifiedUsers: adminUsers.filter(u => u.isVerified).length,
    admins: adminUsers.filter(u => u.isAdmin).length,
    topScore: adminUsers.length > 0 ? Math.max(...adminUsers.map(u => u.score || 0)) : 0,
  };

  const handleDeleteUser = async (id) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      const result = await dispatch(adminDeleteUser(id));
      if (result.meta.requestStatus === 'fulfilled') {
        toast.success('User deleted successfully');
      } else {
        toast.error(result.payload || 'Failed to delete user');
      }
    }
  };

  const handleUpdateUser = async (user) => {
    const newUsername = window.prompt('Enter new username:', user.username);
    if (newUsername === null) return;
    
    const newScore = window.prompt('Enter new score:', user.score);
    if (newScore === null) return;

    const result = await dispatch(adminUpdateUser({ 
      userId: user._id, 
      userData: { username: newUsername, score: parseInt(newScore) } 
    }));

    if (result.meta.requestStatus === 'fulfilled') {
      toast.success('User updated successfully');
    } else {
      toast.error(result.payload || 'Failed to update user');
    }
  };

  return (
    <div className="admin-dashboard-container">
      <div className="admin-sidebar">
        <h2 className="admin-logo">Admin Panel</h2>
        <nav>
          <button 
            className={activeTab === 'overview' ? 'active' : ''} 
            onClick={() => setActiveTab('overview')}
          >
            Dashboard
          </button>
          <button 
            className={activeTab === 'users' ? 'active' : ''} 
            onClick={() => setActiveTab('users')}
          >
            User Management
          </button>
          <button 
            className={activeTab === 'logs' ? 'active' : ''} 
            onClick={() => setActiveTab('logs')}
          >
            Activity Logs
          </button>
          <button onClick={() => navigate('/home')}>Back to Home</button>
        </nav>
      </div>

      <div className="admin-main">
        <header className="admin-header">
          <h1>
            {activeTab === 'overview' && 'Dashboard Overview'}
            {activeTab === 'users' && 'User Management'}
            {activeTab === 'logs' && 'Activity Logs'}
          </h1>
          <div className="admin-user-info">
            <span>Welcome, {currentUser?.username}</span>
          </div>
        </header>

        <section className="admin-content">
          {loading && <div className="loading-spinner">Loading...</div>}

          {!loading && activeTab === 'overview' && (
            <div className="admin-overview">
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-value">{stats.totalUsers}</div>
                  <div className="stat-label">Total Users</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{stats.verifiedUsers}</div>
                  <div className="stat-label">Verified Users</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{stats.admins}</div>
                  <div className="stat-label">Administrators</div>
                </div>
                <div className="stat-card highlight">
                  <div className="stat-value">{stats.topScore}</div>
                  <div className="stat-label">Highest Score</div>
                </div>
              </div>

              <div className="recent-activity-preview">
                <h3>Recent Activity</h3>
                <div className="preview-list">
                  {activityLogs.slice(0, 5).map(log => (
                    <div className="preview-item" key={log._id}>
                      <span className="dot"></span>
                      <span className="action">{log.action}:</span>
                      <span className="details">{log.details}</span>
                      <span className="time">{new Date(log.createdAt).toLocaleDateString()}</span>
                    </div>
                  ))}
                  {activityLogs.length === 0 && <p>No recent activity.</p>}
                </div>
              </div>
            </div>
          )}

          {!loading && activeTab === 'users' && (
            <div className="users-table-container">
              <table className="users-table">
                <thead>
                  <tr>
                    <th>Username</th>
                    <th>Email</th>
                    <th>Score</th>
                    <th>Verified</th>
                    <th>Admin</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {adminUsers.map((user) => (
                    <tr key={user._id}>
                      <td>{user.username}</td>
                      <td>{user.email}</td>
                      <td>{user.score}</td>
                      <td>{user.isVerified ? '✅' : '❌'}</td>
                      <td>{user.isAdmin ? '👑' : '👤'}</td>
                      <td className="actions">
                        <button className="edit-btn" onClick={() => handleUpdateUser(user)}>Edit</button>
                        <button 
                          className="delete-btn" 
                          onClick={() => handleDeleteUser(user._id)}
                          disabled={user.username === 'admin'}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!loading && activeTab === 'logs' && (
            <div className="logs-list">
              {activityLogs.map((log) => (
                <div key={log._id} className="log-item">
                  <span className="log-time">{new Date(log.createdAt).toLocaleString()}</span>
                  <span className="log-user"><strong>{log.username}</strong></span>
                  <span className="log-action">{log.action}</span>
                  <span className="log-details">{log.details}</span>
                </div>
              ))}
              {activityLogs.length === 0 && <p>No logs found.</p>}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default AdminDashboard;
