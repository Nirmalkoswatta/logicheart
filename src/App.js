import { useState, useEffect } from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyOTP from './pages/VerifyOTP';
import Home from './pages/Home';
import Game from './pages/Game';
import Leaderboard from './pages/Leaderboard';
import Settings from './pages/Settings';
import LoadingScreen from './components/LoadingScreen';
import AdminDashboard from './pages/AdminDashboard';
import { syncPresence } from './redux/userSlice';
import './App.scss';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { currentUser } = useSelector((state) => state.user);
  return currentUser ? children : <Navigate to="/login" />;
};

// Admin Route Component
const AdminRoute = ({ children }) => {
  const { currentUser } = useSelector((state) => state.user);
  return currentUser && currentUser.isAdmin ? children : <Navigate to="/home" />;
};

// Public Route Component (Redirects authenticated users)
const PublicRoute = ({ children }) => {
  const { currentUser } = useSelector((state) => state.user);

  if (currentUser) {
    return currentUser.isAdmin ? <Navigate to="/admin" /> : <Navigate to="/home" />;
  }

  return children;
};

function App() {
  const [loading, setLoading] = useState(true);
  const dispatch = useDispatch();
  const { currentUser } = useSelector((state) => state.user);

  useEffect(() => {
    if (!currentUser?._id) {
      return undefined;
    }

    dispatch(syncPresence(currentUser._id));

    const intervalId = window.setInterval(() => {
      dispatch(syncPresence(currentUser._id));
    }, 60000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [currentUser?._id, dispatch]);

  if (loading) {
    return <LoadingScreen onLoaded={() => setLoading(false)} />;
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          }
        />
        <Route
          path="/verify-otp"
          element={
            <PublicRoute>
              <VerifyOTP />
            </PublicRoute>
          }
        />
        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />
        <Route
          path="/game"
          element={
            <ProtectedRoute>
              <Game />
            </ProtectedRoute>
          }
        />
        <Route
          path="/leaderboard"
          element={
            <ProtectedRoute>
              <Leaderboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        />
      </Routes>
      <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
    </Router>
  );
}

export default App;
