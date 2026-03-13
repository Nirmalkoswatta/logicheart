import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { deleteUser, updatePassword } from '../redux/userSlice';
import './Settings.scss';

const Settings = () => {
  const { currentUser } = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    if (!currentUser?._id) {
      return;
    }

    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      toast.error('Fill in all password fields.');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters long.');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New passwords do not match.');
      return;
    }

    const result = await dispatch(updatePassword({
      userId: currentUser._id,
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword,
    }));

    if (updatePassword.fulfilled.match(result)) {
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      toast.success(result.payload?.message || 'Password updated successfully.');
    } else {
      toast.error(result.payload || 'Failed to update password.');
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      if (currentUser) {
        const result = await dispatch(deleteUser(currentUser._id));

        if (deleteUser.fulfilled.match(result)) {
          toast.success('Your account was deleted permanently.');
          navigate('/login');
        } else {
          toast.error(result.payload || 'Failed to delete account.');
        }
      }
    }
  };

  return (
    <div className="settings-container">
      <div className="settings-content">
        <header className="settings-header">
          <h1>Settings</h1>
        </header>

        <section className="settings-section account-section">
          <div className="section-copy">
            <h2>Security Center</h2>
            <p className="warning-text">
              Update your password here. Each password change is recorded in the admin audit trail.
            </p>
          </div>

          <form className="password-form" onSubmit={handlePasswordSubmit}>
            <label className="settings-field">
              <span>Current Password</span>
              <input
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                placeholder="Enter current password"
              />
            </label>
            <label className="settings-field">
              <span>New Password</span>
              <input
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                placeholder="Enter new password"
              />
            </label>
            <label className="settings-field">
              <span>Confirm New Password</span>
              <input
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                placeholder="Confirm new password"
              />
            </label>

            <button className="save-password-btn" type="submit">
              Save New Password
            </button>
          </form>
        </section>

        <section className="settings-section">
          <h2>Danger Zone</h2>
          <p className="warning-text">
            Deleting your account is permanent. All your progress, scores, and badges will be lost immediately.
          </p>
          <button className="delete-account-btn" onClick={handleDeleteAccount}>
            Delete My Account
          </button>
        </section>

        <button className="back-btn" onClick={() => navigate('/home')}>
          Back to Dashboard
        </button>
      </div>
    </div>
  );
};

export default Settings;
