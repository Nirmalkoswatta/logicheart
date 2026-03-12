import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchAllUsers, adminUpdateUser, adminDeleteUser, fetchActivityLogs, logout } from '../redux/userSlice';
import { toast } from 'react-toastify';
import './AdminDashboard.scss';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUser, setEditingUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ 
    username: '', 
    score: 0, 
    carrots: 0, 
    hearts: 0, 
    isAdmin: false 
  });

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

  const filteredUsers = adminUsers.filter(user => 
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    totalUsers: adminUsers.length,
    verifiedUsers: adminUsers.filter(u => u.isVerified).length,
    admins: adminUsers.filter(u => u.isAdmin).length,
    topScore: adminUsers.length > 0 ? Math.max(...adminUsers.map(u => u.score || 0)) : 0,
  };

  const handleDeleteUser = async (id) => {
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      const result = await dispatch(adminDeleteUser(id));
      if (result.meta.requestStatus === 'fulfilled') {
        toast.success('User purged from database');
      } else {
        toast.error(result.payload || 'Failed to delete user');
      }
    }
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      score: user.score || 0,
      carrots: user.carrots || 0,
      hearts: user.hearts || 0,
      isAdmin: user.isAdmin || false
    });
    setIsModalOpen(true);
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    const result = await dispatch(adminUpdateUser({ 
      userId: editingUser._id, 
      userData: formData 
    }));

    if (result.meta.requestStatus === 'fulfilled') {
      toast.success('User metadata updated');
      setIsModalOpen(false);
    } else {
      toast.error(result.payload || 'Failed to update user');
    }
  };
  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
    toast.info('Session terminated');
  };

  return (
    <div className="admin-dashboard-container">
      <div className="admin-sidebar">
        <div className="admin-brand">
          <div className="brand-icon">LH</div>
          <h2 className="admin-logo">Admin Panel</h2>
        </div>
        <nav>
          <button 
            className={activeTab === 'overview' ? 'active' : ''} 
            onClick={() => setActiveTab('overview')}
          >
            <span className="icon">📊</span> Dashboard
          </button>
          <button 
            className={activeTab === 'users' ? 'active' : ''} 
            onClick={() => setActiveTab('users')}
          >
            <span className="icon">👥</span> User Manager
          </button>
          <button 
            className={activeTab === 'logs' ? 'active' : ''} 
            onClick={() => setActiveTab('logs')}
          >
            <span className="icon">📜</span> Audit Logs
          </button>
          <div className="nav-divider"></div>
          <button className="logout-btn" onClick={handleLogout}>
            <span className="icon">🚪</span> Sign Out
          </button>
        </nav>
      </div>

      <div className="admin-main">
        <header className="admin-header">
          <div className="header-left">
            <h1>
              {activeTab === 'overview' && 'System Overview'}
              {activeTab === 'users' && 'User Management'}
              {activeTab === 'logs' && 'System Audit Logs'}
            </h1>
          </div>
          <div className="admin-user-info">
            <div className="avatar">{currentUser?.username?.charAt(0).toUpperCase()}</div>
            <div className="details">
              <span className="name">{currentUser?.username}</span>
              <span className="role">Root Administrator</span>
            </div>
          </div>
        </header>

        <section className="admin-content">
          {loading && (
            <div className="loading-container">
              <div className="spinner"></div>
              <p>Fetching encrypted data...</p>
            </div>
          )}

          {!loading && activeTab === 'overview' && (
            <div className="admin-overview animate-fade-in">
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon users">👥</div>
                  <div className="stat-content">
                    <div className="stat-value">{stats.totalUsers}</div>
                    <div className="stat-label">Total Users</div>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon verified">✔️</div>
                  <div className="stat-content">
                    <div className="stat-value">{stats.verifiedUsers}</div>
                    <div className="stat-label">Verified Accounts</div>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon security">🛡️</div>
                  <div className="stat-content">
                    <div className="stat-value">{stats.admins}</div>
                    <div className="stat-label">Admin Entities</div>
                  </div>
                </div>
                <div className="stat-card highlight">
                  <div className="stat-icon score">🔥</div>
                  <div className="stat-content">
                    <div className="stat-value">{stats.topScore}</div>
                    <div className="stat-label">System High Score</div>
                  </div>
                </div>
              </div>

              <div className="overview-row">
                <div className="recent-activity-preview card">
                  <div className="card-header">
                    <h3>System Timeline</h3>
                    <button className="view-all" onClick={() => setActiveTab('logs')}>View All</button>
                  </div>
                  <div className="preview-list">
                    {activityLogs.slice(0, 6).map(log => (
                      <div className="preview-item" key={log._id}>
                        <div className="indicator"></div>
                        <div className="action-info">
                          <span className="action">{log.action}</span>
                          <span className="log-msg">{log.details}</span>
                        </div>
                        <span className="time">{new Date(log.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                      </div>
                    ))}
                    {activityLogs.length === 0 && <p className="no-logs">No recent activity.</p>}
                  </div>
                </div>
                
                <div className="quick-stats card">
                  <h3>User Health</h3>
                  <div className="health-bar">
                    <div className="fill" style={{width: `${(stats.verifiedUsers / (stats.totalUsers || 1)) * 100}%`}}></div>
                  </div>
                  <p>{Math.round((stats.verifiedUsers / (stats.totalUsers || 1)) * 100)}% Verification Rate</p>
                </div>
              </div>
            </div>
          )}

          {!loading && activeTab === 'users' && (
            <div className="users-view animate-fade-in">
              <div className="table-controls">
                <div className="search-bar">
                  <span className="search-icon">🔍</span>
                  <input 
                    type="text" 
                    placeholder="Search users by name or email..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              <div className="users-table-container card">
                <table className="users-table">
                  <thead>
                    <tr>
                      <th>User Profile</th>
                      <th>Score</th>
                      <th>Inventory</th>
                      <th>Status</th>
                      <th>Permissions</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr key={user._id}>
                        <td className="user-cell">
                          <div className="user-avatar">{user.username.charAt(0)}</div>
                          <div className="user-info">
                            <span className="username">{user.username}</span>
                            <span className="email">{user.email}</span>
                          </div>
                        </td>
                        <td className="score-cell">
                          <span className="score-badge">{user.score}</span>
                        </td>
                        <td className="inventory-cell">
                          <span className="item">🥕 {user.carrots || 0}</span>
                          <span className="item">❤️ {user.hearts || 0}</span>
                        </td>
                        <td>
                          <span className={`status-badge ${user.isVerified ? 'verified' : 'pending'}`}>
                            {user.isVerified ? 'Verified' : 'Pending'}
                          </span>
                        </td>
                        <td>
                          <span className={`role-badge ${user.isAdmin ? 'admin' : 'user'}`}>
                            {user.isAdmin ? 'Admin' : 'Regular'}
                          </span>
                        </td>
                        <td className="actions">
                          <button className="action-btn edit" onClick={() => openEditModal(user)} title="Edit User">
                            ✏️
                          </button>
                          <button 
                            className="action-btn delete" 
                            onClick={() => handleDeleteUser(user._id)}
                            disabled={user.username === 'admin'}
                            title="Delete User"
                          >
                            🗑️
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredUsers.length === 0 && <div className="no-results">No security entities match your search parameters.</div>}
              </div>
            </div>
          )}

          {!loading && activeTab === 'logs' && (
            <div className="logs-view animate-fade-in">
              <div className="logs-container card">
                <div className="logs-header">
                  <h3>Audit Trail</h3>
                  <span className="log-count">Last {activityLogs.length} entries</span>
                </div>
                <div className="logs-list">
                  {activityLogs.map((log) => (
                    <div key={log._id} className="log-row">
                      <div className="log-stamp">
                        <span className="date">{new Date(log.createdAt).toLocaleDateString()}</span>
                        <span className="time">{new Date(log.createdAt).toLocaleTimeString()}</span>
                      </div>
                      <div className="log-identity">
                        <span className="prefix">@</span>
                        <span className="user">{log.username}</span>
                      </div>
                      <div className="log-payload">
                        <span className="type">{log.action}</span>
                        <span className="msg">{log.details}</span>
                      </div>
                    </div>
                  ))}
                  {activityLogs.length === 0 && <div className="no-logs">System logs are empty.</div>}
                </div>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Edit User Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content animate-pop-in">
            <div className="modal-header">
              <div className="title-area">
                <span className="modal-icon">👤</span>
                <div>
                  <h2>Edit Security Entity</h2>
                  <p>Modifying credentials for <strong>{editingUser?.username}</strong></p>
                </div>
              </div>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}>&times;</button>
            </div>
            
            <form onSubmit={handleUpdateUser}>
              <div className="form-sections">
                <div className="form-section">
                  <h4 className="section-title">Identity & Access</h4>
                  <div className="form-group">
                    <label>System Username</label>
                    <div className="input-wrapper">
                      <span className="input-icon">@</span>
                      <input 
                        type="text" 
                        value={formData.username}
                        onChange={(e) => setFormData({...formData, username: e.target.value})}
                        required
                        placeholder="Enter username"
                      />
                    </div>
                  </div>
                </div>

                <div className="form-section">
                  <h4 className="section-title">In-Game Economy & Stats</h4>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Lifetime Score</label>
                      <div className="input-wrapper">
                        <span className="input-icon">🔥</span>
                        <input 
                          type="number" 
                          value={formData.score}
                          onChange={(e) => setFormData({...formData, score: parseInt(e.target.value) || 0})}
                          required
                        />
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Admin Privilege</label>
                      <div className="switch-wrapper">
                        <label className="switch">
                          <input 
                            type="checkbox" 
                            checked={formData.isAdmin}
                            onChange={(e) => setFormData({...formData, isAdmin: e.target.checked})}
                          />
                          <span className="slider round"></span>
                        </label>
                        <span className="switch-label">{formData.isAdmin ? 'Enabled' : 'Disabled'}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label>Fruits (Carrots)</label>
                      <div className="input-wrapper">
                        <span className="input-icon">🥕</span>
                        <input 
                          type="number" 
                          value={formData.carrots}
                          onChange={(e) => setFormData({...formData, carrots: parseInt(e.target.value) || 0})}
                        />
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Hearts Remaining</label>
                      <div className="input-wrapper">
                        <span className="input-icon">❤️</span>
                        <input 
                          type="number" 
                          value={formData.hearts}
                          onChange={(e) => setFormData({...formData, hearts: parseInt(e.target.value) || 0})}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="cancel-btn" onClick={() => setIsModalOpen(false)}>Discard</button>
                <button type="submit" className="save-btn">Commit Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
