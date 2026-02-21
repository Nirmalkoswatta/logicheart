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
      
      // Check if OTP is included in the response (for development/testing)
      if (result.payload?.otp) {
        toast.success(`Registration successful! Your OTP is: ${result.payload.otp}`, {
          autoClose: 10000, // Show for 10 seconds
          position: 'top-center'
        });
        console.log('🔐 OTP Code:', result.payload.otp);
      } else {
        toast.success('Registration successful! Check your email for OTP.');
      }
      
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
      </div>
    </div>
  );
};

export default Register;

