import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { login, setRememberMe } from '../store/authSlice';
import './Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const rememberMe = useSelector((state) => state.auth.rememberMe);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Here you would typically validate credentials with an API
    dispatch(login({ email }));
    navigate('/home');
  };

  const handleRememberMe = (e) => {
    dispatch(setRememberMe(e.target.checked));
  };

  return (
    <div className="login-container">
      <div className="login-background">
        <div className="login-card">
          <h1 className="login-title">LOGIN</h1>
          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="login-input"
              />
              <span className="input-icon">✉</span>
            </div>

            <div className="input-group">
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="login-input"
              />
              <span className="input-icon">🔒</span>
              <a href="#" className="forgot-password">Forgot Password?</a>
            </div>

            <div className="remember-me">
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={handleRememberMe}
              />
              <label htmlFor="rememberMe">Remember Me</label>
            </div>

            <button type="submit" className="login-button">Login</button>

            <div className="register-link">
              Don't have an Account?{' '}
              <span onClick={() => navigate('/register')} className="register-text">
                Register
              </span>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;

