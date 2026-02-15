import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { deleteUser } from '../redux/userSlice';
import './Settings.css';

const Settings = () => {
  const { currentUser } = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleDeleteAccount = () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      if (currentUser) {
        dispatch(deleteUser(currentUser._id)).then(() => {
            navigate('/login');
        });
      }
    }
  };

  return (
    <div className="settings-container">
      <div className="settings-content">
        <header className="settings-header">
          <h1>Settings</h1>
        </header>

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
