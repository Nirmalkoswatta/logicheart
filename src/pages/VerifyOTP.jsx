import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { verifyUser, resetUser, resendOtp } from '../redux/userSlice';
import { toast } from 'react-toastify';
import './VerifyOTP.css';

const VerifyOTP = () => {
    const [otp, setOtp] = useState('');
    const [email, setEmail] = useState('');
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const location = useLocation();

    const { loading, error, currentUser } = useSelector((state) => state.user);

    useEffect(() => {
        // Retrieve email from navigation state or local storage if needed
        // For now, rely on passed state from Register
        if (location.state && location.state.email) {
            setEmail(location.state.email);
        } else {
            // Unlikely to reach here without email in a real flow unless refreshed
            // Could redirect to login if no email found
            alert("No email found to verify. Please register or login.");
            navigate('/login');
        }
    }, [location, navigate]);

    // Redirect to dashboard on successful verification
    useEffect(() => {
        if (currentUser && currentUser.token) {
            toast.success('Email verified successfully! Welcome to LogicHeart! 🎉');
            // Redirect to dashboard/home after a brief delay
            setTimeout(() => {
                navigate('/');
            }, 1500);
        }
    }, [currentUser, navigate]);

    const handleSubmit = (e) => {
        e.preventDefault();
        // Trim OTP and normalize email to match backend processing
        const trimmedOtp = otp.trim();
        const normalizedEmail = email.toLowerCase().trim();

        console.log('Submitting OTP verification:', { email: normalizedEmail, otp: trimmedOtp });

        dispatch(verifyUser({ email: normalizedEmail, otp: trimmedOtp }));
    };

    const handleResend = async () => {
        if (!email) {
            toast.error("Email not found");
            return;
        }
        const result = await dispatch(resendOtp(email));
        if (result.meta.requestStatus === 'fulfilled') {
            // Check if OTP is included in the response (for development/testing)
            if (result.payload?.otp) {
                toast.success(`OTP resent successfully! Your OTP is: ${result.payload.otp}`, {
                    autoClose: 10000, // Show for 10 seconds
                    position: 'top-center'
                });
                console.log('🔐 Resent OTP Code:', result.payload.otp);
            } else {
                toast.success("OTP sent successfully!");
            }
        } else {
            toast.error(result.payload || "Failed to resend OTP");
        }
    };

    return (
        <div className="verify-container">
            <div className="verify-box">
                <h2 className="verify-title">Verify Your Email</h2>
                <p className="verify-subtitle">Enter the 6-digit code sent to <strong>{email}</strong></p>
                {error && <div className="error-message">{error}</div>}
                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <input
                            type="text"
                            placeholder="Enter 6-digit OTP"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            maxLength="6"
                            className="verify-input"
                            required
                        />
                    </div>
                    <button type="submit" className="verify-btn" disabled={loading}>
                        {loading ? 'Verifying...' : 'Verify'}
                    </button>

                    <button type="button" className="resend-link" onClick={handleResend}>
                        Didn't receive code? Resend
                    </button>

                    <button type="button" className="back-link" onClick={() => navigate('/login')}>
                        Back to Login
                    </button>
                </form>
            </div>
        </div>
    );
};

export default VerifyOTP;
