import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { registerUser, clearError } from '../redux/userSlice';
import { toast } from 'react-toastify';
import './Register.scss';
import { API_BASE_URL } from '../config';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
    console.log('Form submitted');

    if (formData.password !== formData.confirmPassword) {
      alert('Passwords do not match!');
      return;
    }

    dispatch(clearError());
    console.log('Dispatching registerUser with:', { username: formData.name, email: formData.email });

    const result = await dispatch(registerUser({ username: formData.name, email: formData.email, password: formData.password }));

    console.log('Registration result:', JSON.stringify(result, null, 2));
    console.log('Request status:', result.meta.requestStatus);
    console.log('Result payload:', result.payload);
    console.log('Result error:', result.error);

    if (result.meta.requestStatus === 'fulfilled') {
      console.log('Registration successful, navigating to verify-otp');

      if (result.payload?.otp) {
        console.log('🔐 OTP Code:', result.payload.otp);
      }

      toast.success('Registration successful! Check your email for OTP.');
      navigate('/verify-otp', { state: { email: formData.email } });
    } else if (result.meta.requestStatus === 'rejected') {
      // Show the actual error from the backend
      const errorMessage = result.payload || result.error?.message || "Registration failed";
      console.error('Registration rejected. Payload:', result.payload);
      console.error('Error object:', result.error);
      toast.error(errorMessage);
    } else {
      console.warn('Unexpected registration status:', result.meta.requestStatus);
      toast.error('Unexpected error occurred');
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
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                required
                className="register-input"
              />
              <button
                type="button"
                className="eye-toggle"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>

            <div className="input-group">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                placeholder="Confirm Password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                className="register-input"
              />
              <button
                type="button"
                className="eye-toggle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                tabIndex={-1}
              >
                {showConfirmPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
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
      </div>
    </div>
  );
};

export default Register;

