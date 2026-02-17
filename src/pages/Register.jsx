import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { registerUser, clearError } from '../redux/userSlice';
import { toast } from 'react-toastify';
import './Register.css';
import { API_BASE_URL } from '../config';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.user);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      alert('Passwords do not match!');
      return;
    }
    dispatch(clearError());
    const result = await dispatch(registerUser({ username: formData.name, email: formData.email, password: formData.password }));
    if (result.meta.requestStatus === 'fulfilled') {
      navigate('/verify-otp', { state: { email: formData.email } });
    } else if (result.meta.requestStatus === 'rejected') {
      // Show the actual error from the backend
      const errorMessage = result.payload || result.error?.message || "Registration failed";
      toast.error(errorMessage);
      console.error('Registration error:', errorMessage);
    }
  };

  return (
    <div className="register-container">
      <div className="register-background">
        <div className="register-card">
          <h1 className="register-title">REGISTER</h1>

          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <input
                type="text"
                name="name"
                placeholder="Full Name"
                value={formData.name}
                onChange={handleChange}
                required
                className="register-input"
              />
              <span className="input-icon">👤</span>
            </div>

            <div className="input-group">
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleChange}
                required
                className="register-input"
              />
              <span className="input-icon">✉</span>
            </div>

            <div className="input-group">
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                required
                className="register-input"
              />
              <span className="input-icon">🔒</span>
            </div>

            <div className="input-group">
              <input
                type="password"
                name="confirmPassword"
                placeholder="Confirm Password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                className="register-input"
              />
              <span className="input-icon">🔒</span>
            </div>

            <button type="submit" className="register-button">Register</button>

            <div className="login-link">
              Already have an Account?{' '}
              <span onClick={() => navigate('/login')} className="login-text">
                Login
              </span>
            </div>
          </form>
        </div>
        <div style={{ textAlign: 'center', marginTop: '10px', color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>
          Connecting to: {API_BASE_URL}
        </div>
      </div>
    </div>
  );
};

export default Register;

