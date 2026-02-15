import React, { useEffect, useState } from 'react';
import './LoadingScreen.css';

const LoadingScreen = ({ onLoaded }) => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
      setTimeout(onLoaded, 500); // Allow fade out animation to finish
    }, 3000); // 3 seconds loading simulation

    return () => clearTimeout(timer);
  }, [onLoaded]);

  return (
    <div className={`loading-screen ${!loading ? 'fade-out' : ''}`}>
      <div className="loader-content">
        <h1 className="loading-title">Logic Heart</h1>
        <div className="loader-bar">
          <div className="loader-progress"></div>
        </div>
        <p className="loading-text">Loading Game...</p>
      </div>
    </div>
  );
};

export default LoadingScreen;
