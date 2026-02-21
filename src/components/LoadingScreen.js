import React, { useEffect, useState } from 'react';
import './LoadingScreen.scss';

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
        <div className="loader-orbs" aria-hidden="true">
          <span className="orb o1"></span>
          <span className="orb o2"></span>
          <span className="orb o3"></span>
        </div>
        <h1 className="loading-title">Logic Heart</h1>
        <div className="loader-bar">
          <div className="loader-progress"></div>
        </div>
        <p className="loading-text">Loading Game</p>
        <div className="loading-dots" aria-hidden="true">
          <span></span><span></span><span></span>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
