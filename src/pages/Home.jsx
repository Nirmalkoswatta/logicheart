import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout } from '../store/authSlice';
import './Home.css';

const Home = () => {
  const user = useSelector((state) => state.auth.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <div className="home-container">
      <div className="home-header">
        <h1>Welcome to LogicHeart</h1>
        <button onClick={handleLogout} className="logout-button">Logout</button>
      </div>
      <div className="home-content">
        <h2>Hello, {user?.email || 'User'}!</h2>
        <p>You have successfully logged in.</p>
      </div>
    </div>
  );
};

export default Home;

