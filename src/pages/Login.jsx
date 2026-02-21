import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser, clearError } from '../redux/userSlice';
import { toast } from 'react-toastify';
import './Login.scss';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.user);

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(clearError());
    const result = await dispatch(loginUser({ email, password }));
    if (result.meta.requestStatus === 'fulfilled') {
      navigate('/home');
    } else if (result.meta.requestStatus === 'rejected') {
      if (result.payload === 'Please verify your email first.') {
        toast.info("Please verify your email. Redirecting...");
        setTimeout(() => navigate('/verify-otp', { state: { email } }), 2000);
      } else {
        toast.error(result.payload || "Login failed");
      }
    }
  };


  return (
    <div className="login-container">
      <div className="login-background">
        <h1 className="main-header">Logic Heart</h1>
        <div className="login-card">
          <h1 className="login-title">Login</h1>
          {error && <div className="error-message">{error}</div>}
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

