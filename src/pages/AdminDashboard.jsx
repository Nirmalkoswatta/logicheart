import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchAllUsers, adminUpdateUser, adminDeleteUser, fetchActivityLogs, logoutUser } from '../redux/userSlice';
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
  const [logFilter, setLogFilter] = useState('all');
  const [logSearch, setLogSearch] = useState('');

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { adminUsers, activityLogs, loading, currentUser } = useSelector((state) => state.user);

  const getActionCategory = (action) => {
    if (!action) return 'other';
    if (action.includes('LOGIN') || action.includes('LOGOUT')) return 'session';
    if (action.includes('PASSWORD')) return 'password';
    if (action.includes('REGISTER') || action.includes('VERIFIED')) return 'register';
    if (action.includes('DELETE')) return 'delete';
    if (action.includes('GAME') || action.includes('PLAYED')) return 'game';
    if (action.includes('UPDATE')) return 'update';
    return 'other';
  };

  const getActionIcon = (action) => {
    if (!action) return '📝';
    if (action.includes('LOGOUT')) return '🚪';
    if (action.includes('LOGIN')) return '🔑';
    if (action.includes('PASSWORD')) return '🔐';
    if (action.includes('REGISTER') || action.includes('VERIFIED')) return '✅';
    if (action.includes('DELETE')) return '🗑️';
    if (action.includes('GAME') || action.includes('PLAYED')) return '🎮';
    if (action.includes('UPDATE')) return '✏️';
    return '📝';
  };

  const formatActionLabel = (action) => action?.replace(/_/g, ' ') || 'Activity';

  const formatDateTime = (dateStr) => {
    if (!dateStr) return 'Not available';

    return new Date(dateStr).toLocaleString([], {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getRelativeTime = (dateStr) => {
    const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const formatPlaytime = (secs) => {
    if (!secs) return null;
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  const hasOpenSession = (user) => {
    if (!user?.lastLoginAt) {
      return false;
    }

    if (!user.lastLogoutAt) {
      return true;
    }

    return new Date(user.lastLoginAt).getTime() > new Date(user.lastLogoutAt).getTime();
  };

  const onlineUsers = [...adminUsers]
    .filter((user) => Boolean(user.isOnline) || hasOpenSession(user))
    .sort((left, right) => {
      const leftSeen = left.lastSeenAt
        ? new Date(left.lastSeenAt).getTime()
        : (left.lastLoginAt ? new Date(left.lastLoginAt).getTime() : 0);
      const rightSeen = right.lastSeenAt
        ? new Date(right.lastSeenAt).getTime()
        : (right.lastLoginAt ? new Date(right.lastLoginAt).getTime() : 0);
      return rightSeen - leftSeen;
    });

  const auditStats = {
    onlineUsers: onlineUsers.length,
    sessionEvents: activityLogs.filter((log) => getActionCategory(log.action) === 'session').length,
    passwordEvents: activityLogs.filter((log) => getActionCategory(log.action) === 'password').length,
    deleteEvents: activityLogs.filter((log) => getActionCategory(log.action) === 'delete').length,
  };

  const filteredLogs = activityLogs.filter(log => {
    const cat = getActionCategory(log.action);
    const matchesFilter = logFilter === 'all' || cat === logFilter;
    const term = logSearch.toLowerCase();
    const matchesSearch = !logSearch ||
      log.action?.toLowerCase().includes(term) ||
      log.username?.toLowerCase().includes(term) ||
      log.email?.toLowerCase().includes(term) ||
      log.targetUsername?.toLowerCase().includes(term) ||
      log.targetEmail?.toLowerCase().includes(term) ||
      log.details?.toLowerCase().includes(term);
    return matchesFilter && matchesSearch;
  });

  useEffect(() => {
    if (!currentUser || !currentUser.isAdmin) {
      navigate('/login');
      return;
    }

    const loadAdminData = () => {
      dispatch(fetchAllUsers());
      dispatch(fetchActivityLogs());
    };

    loadAdminData();

    const refreshId = window.setInterval(loadAdminData, 10000);

    return () => {
      window.clearInterval(refreshId);
    };
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
    onlineUsers: onlineUsers.length,
  };

  const handleDeleteUser = async (id) => {
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      const result = await dispatch(adminDeleteUser(id));
      if (result.meta.requestStatus === 'fulfilled') {
        dispatch(fetchActivityLogs());
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
      dispatch(fetchActivityLogs());
      toast.success('User metadata updated');
      setIsModalOpen(false);
    } else {
      toast.error(result.payload || 'Failed to update user');
    }
  };
  const handleLogout = async () => {
    await dispatch(logoutUser());
    toast.info('Session terminated');

    navigate('/login');
  };

  const handleRefreshLogs = () => {
    dispatch(fetchAllUsers());
    dispatch(fetchActivityLogs());
    toast.info('Live audit data refreshed');
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
              {activeTab === 'logs' && 'System Audit & Presence'}
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
                <div className="stat-card">
                  <div className="stat-icon verified">🟢</div>
                  <div className="stat-content">
                    <div className="stat-value">{stats.onlineUsers}</div>
                    <div className="stat-label">Online Right Now</div>
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
                        <div className={`indicator indicator-${getActionCategory(log.action)}`}></div>
                        <div className="action-info">
                          <span className="action">{getActionIcon(log.action)} {log.action?.replace(/_/g, ' ')}</span>
                          <span className="log-msg">{log.username && `@${log.username} · `}{log.details}</span>
                        </div>
                        <span className="time">{getRelativeTime(log.createdAt)}</span>
                      </div>
                    ))}
                    {activityLogs.length === 0 && <p className="no-logs">No recent activity.</p>}
                  </div>
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
              <div className="logs-hero card">
                <div className="logs-hero-copy">
                  <span className="logs-eyebrow">Live oversight</span>
                  <h3>Audit Trail & Online Users</h3>
                  <p>
                    Review active users, login and logout activity, password changes, deleted accounts,
                    and gameplay sessions from one live console.
                  </p>
                </div>

                <div className="logs-hero-stats">
                  <div className="hero-stat-card">
                    <span>Online now</span>
                    <strong>{auditStats.onlineUsers}</strong>
                  </div>
                  <div className="hero-stat-card">
                    <span>Session events</span>
                    <strong>{auditStats.sessionEvents}</strong>
                  </div>
                  <div className="hero-stat-card">
                    <span>Password updates</span>
                    <strong>{auditStats.passwordEvents}</strong>
                  </div>
                  <div className="hero-stat-card">
                    <span>Deleted users</span>
                    <strong>{auditStats.deleteEvents}</strong>
                  </div>
                </div>
              </div>

              <div className="online-users-panel card">
                <div className="online-users-header">
                  <div>
                    <h4>Online Users</h4>
                    <p>Users with active sessions. Last seen updates automatically.</p>
                  </div>
                  <span className="online-users-pill">{onlineUsers.length} active</span>
                </div>

                {onlineUsers.length > 0 ? (
                  <div className="online-users-grid">
                    {onlineUsers.map((user) => (
                      <div className="online-user-card" key={user._id}>
                        <div className="online-user-main">
                          <div className="online-user-avatar">{user.username?.charAt(0).toUpperCase()}</div>
                          <div className="online-user-copy">
                            <span className="online-user-name">@{user.username}</span>
                            <span className="online-user-email">{user.email}</span>
                          </div>
                        </div>
                        <div className="online-user-meta">
                          <span className="online-user-status">Online now</span>
                          {user.lastSeenAt && (
                            <span>Last seen {getRelativeTime(user.lastSeenAt)}</span>
                          )}
                          {user.lastSeenAt && (
                            <span>Last seen at {formatDateTime(user.lastSeenAt)}</span>
                          )}
                          {user.lastLoginAt && (
                            <span>
                              Logged in at {formatDateTime(user.lastLoginAt)}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="online-empty-state">
                    No users are active right now. Live users will appear here automatically.
                  </div>
                )}
              </div>

              <div className="logs-controls card">
                <div className="logs-controls-top">
                  <div className="logs-title-group">
                    <h3>Audit Trail</h3>
                    <span className="log-count-badge">{filteredLogs.length} shown / {activityLogs.length} total</span>
                  </div>
                  <button className="refresh-logs-btn" onClick={handleRefreshLogs}>
                    🔄 Refresh
                  </button>
                </div>

                <div className="log-filter-tabs">
                  {[
                    { key: 'all', label: '🌐 All' },
                    { key: 'session', label: '🟢 Session' },
                    { key: 'register', label: '✅ Register' },
                    { key: 'game', label: '🎮 Game' },
                    { key: 'delete', label: '🗑️ Deleted' },
                    { key: 'update', label: '✏️ Updated' },
                    { key: 'password', label: '🔐 Password' },
                  ].map(f => (
                    <button
                      key={f.key}
                      className={`filter-tab filter-tab-${f.key} ${logFilter === f.key ? 'active' : ''}`}
                      onClick={() => setLogFilter(f.key)}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                <div className="log-search-bar">
                  <span className="search-icon">🔍</span>
                  <input
                    type="text"
                    placeholder="Search by user, email, action or details..."
                    value={logSearch}
                    onChange={(e) => setLogSearch(e.target.value)}
                  />
                  {logSearch && (
                    <button className="clear-search-btn" onClick={() => setLogSearch('')}>✕</button>
                  )}
                </div>
              </div>

              {/* Log Entries */}
              <div className="log-entries">
                {filteredLogs.map((log) => {
                  const cat = getActionCategory(log.action);
                  const pt = formatPlaytime(log.metadata?.playtimeSecs || log.metadata?.sessionDurationSecs);
                  return (
                    <div key={log._id} className={`log-entry log-cat-${cat}`}>

                      <div className="log-entry-left">
                        <span className={`action-pill action-pill-${cat}`}>
                          {getActionIcon(log.action)}{' '}
                          {formatActionLabel(log.action)}
                        </span>
                        <div className="log-actor">
                          <div className="log-actor-avatar">{log.username?.charAt(0).toUpperCase()}</div>
                          <div className="log-actor-info">
                            <span className="log-actor-name">@{log.username}</span>
                            {log.email && <span className="log-actor-email">{log.email}</span>}
                          </div>
                        </div>
                      </div>

                      <div className="log-entry-middle">
                        <p className="log-detail-text">{log.details}</p>

                        {log.targetUsername && (
                          <div className={`log-target ${cat === 'delete' ? 'log-target-deleted' : ''}`}>
                            <span className="log-target-label">
                              {cat === 'delete' ? '🗑️ Deleted:' : 'Acting on:'}
                            </span>
                            <span className="log-target-name">@{log.targetUsername}</span>
                            {log.targetEmail && (
                              <span className="log-target-email">{log.targetEmail}</span>
                            )}
                            {log.metadata?.score !== undefined && (
                              <span className="log-target-score">🔥 Score: {log.metadata.score}</span>
                            )}
                          </div>
                        )}

                        <div className="log-metadata-chips">
                          {log.metadata?.finalScore !== undefined && (
                            <span className="meta-chip chip-score">🔥 {log.metadata.finalScore} pts</span>
                          )}
                          {pt && (
                            <span className="meta-chip chip-time">⏱ {pt}</span>
                          )}
                          {log.metadata?.wasOnline && (
                            <span className="meta-chip chip-online">🟢 Was online</span>
                          )}
                          {log.metadata?.changedByAdmin && (
                            <span className="meta-chip chip-admin">🛡 Admin action</span>
                          )}
                          {log.metadata?.carrots > 0 && (
                            <span className="meta-chip chip-carrots">🥕 {log.metadata.carrots}</span>
                          )}
                          {log.metadata?.hearts > 0 && (
                            <span className="meta-chip chip-hearts">❤️ {log.metadata.hearts}</span>
                          )}
                          {log.ipAddress && (
                            <span className="meta-chip chip-ip">📡 {log.ipAddress}</span>
                          )}
                        </div>
                      </div>

                      <div className="log-entry-right">
                        <span className="log-time-rel">{getRelativeTime(log.createdAt)}</span>
                        <span className="log-time-full">
                          {new Date(log.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                        <span className="log-time-clock">
                          {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  );
                })}

                {filteredLogs.length === 0 && (
                  <div className="no-logs-state">
                    <div className="no-logs-icon">📭</div>
                    <p className="no-logs-title">No audit entries found</p>
                    <span className="no-logs-sub">
                      {logFilter !== 'all' || logSearch
                        ? 'Try adjusting your filters'
                        : 'User presence and security events will appear here once recorded'}
                    </span>
                  </div>
                )}
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
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
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
                          onChange={(e) => setFormData({ ...formData, score: parseInt(e.target.value) || 0 })}
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
                            onChange={(e) => setFormData({ ...formData, isAdmin: e.target.checked })}
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
                          onChange={(e) => setFormData({ ...formData, carrots: parseInt(e.target.value) || 0 })}
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
                          onChange={(e) => setFormData({ ...formData, hearts: parseInt(e.target.value) || 0 })}
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
