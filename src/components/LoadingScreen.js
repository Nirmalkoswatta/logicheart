import React, { useEffect, useState } from 'react';
import './LoadingScreen.scss';

const LOADING_MESSAGES = [
  'Syncing your profile',
  'Calibrating puzzle logic',
  'Finalizing game arena',
];

const LoadingScreen = ({ onLoaded }) => {
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const loadingDuration = 2800;
    const progressTick = 60;
    const totalTicks = Math.ceil(loadingDuration / progressTick);
    let currentTick = 0;

    const progressTimer = setInterval(() => {
      currentTick += 1;
      const nextProgress = Math.min(100, Math.round((currentTick / totalTicks) * 100));
      setProgress(nextProgress);
    }, progressTick);

    const textTimer = setInterval(() => {
      setMessageIndex((prevIndex) => (prevIndex + 1) % LOADING_MESSAGES.length);
    }, 950);

    const timer = setTimeout(() => {
      setLoading(false);
      setTimeout(onLoaded, 550);
    }, loadingDuration + 150);

    return () => {
      clearInterval(progressTimer);
      clearInterval(textTimer);
      clearTimeout(timer);
    };
  }, [onLoaded]);

  return (
    <div className={`loading-screen ${!loading ? 'fade-out' : ''}`}>
      <div className="loading-glow loading-glow-left" aria-hidden="true"></div>
      <div className="loading-glow loading-glow-right" aria-hidden="true"></div>

      <div className="loader-content" role="status" aria-live="polite">
        <div className="brand-pill">
          <span className="brand-mark">LH</span>
          <span className="brand-name">Logic Heart</span>
        </div>

        <h1 className="loading-title">Preparing Your Session</h1>
        <p className="loading-text">{LOADING_MESSAGES[messageIndex]}</p>

        <div
          className="loader-track"
          role="progressbar"
          aria-label="Loading progress"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
          style={{ '--progress-width': `${progress}%` }}
        >
          <div className="loader-progress"></div>
        </div>

        <div className="loading-footer">
          <span className="loading-percent">{progress}%</span>
          <div className="loading-dots" aria-hidden="true">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
