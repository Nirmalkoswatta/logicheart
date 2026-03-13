import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { updateScore, reduceAttempts, resetGame } from '../redux/userSlice';
import './Game.scss';
import { API_BASE_URL } from '../config';

// Import Audio Files
import correctGuessSound from '../assets/correctguess.mp3';
import gameOverSound from '../assets/Gameover.mp3';
import backgroundMusic from '../assets/gamebackground.mp3';

const Game = () => {
    const { currentUser } = useSelector((state) => state.user);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const DIFFICULTY_CONFIG = {
        easy: {
            label: 'Easy',
            secondsPerQuestion: 15,
            hint: 'Relaxed pace for warm up',
            icon: '🟢',
        },
        medium: {
            label: 'Medium',
            secondsPerQuestion: 10,
            hint: 'Balanced challenge and speed',
            icon: '🟡',
        },
        hard: {
            label: 'Hard',
            secondsPerQuestion: 5,
            hint: 'Fast mode for sharp focus',
            icon: '🔴',
        },
    };

    const [questionImage, setQuestionImage] = useState(null);
    const [solution, setSolution] = useState(null);
    const [carrotsCount, setCarrotsCount] = useState(0); // From API

    // Inputs
    const [inputCarrots, setInputCarrots] = useState('');
    const [inputHearts, setInputHearts] = useState('');

    const [loading, setLoading] = useState(true);
    const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', message: string }
    const [difficulty, setDifficulty] = useState(null); // 'easy' | 'medium' | 'hard'
    const [timeLeft, setTimeLeft] = useState(0);
    const [gameEnded, setGameEnded] = useState(false);
    const [gameOverReason, setGameOverReason] = useState(null); // 'attempts' | 'timeout'

    // Audio State
    const [isMuted, setIsMuted] = useState(false);
    const bgMusicRef = useRef(new Audio(backgroundMusic));

    // Initialize Background Music
    useEffect(() => {
        const bgMusic = bgMusicRef.current;
        bgMusic.loop = true;
        bgMusic.volume = 0.5;

        const playMusic = async () => {
            try {
                if (!isMuted) {
                    await bgMusic.play();
                } else {
                    bgMusic.pause();
                }
            } catch (err) {
                console.warn("Audio play failed (might need user interaction first):", err);
            }
        };

        playMusic();

        return () => {
            bgMusic.pause();
            bgMusic.currentTime = 0;
        };
    }, [isMuted]);

    // Handle Mute Toggle Effect specifically
    useEffect(() => {
        const bgMusic = bgMusicRef.current;
        if (isMuted) {
            bgMusic.pause();
        } else {
            bgMusic.play().catch(e => console.log("Playback prevented:", e));
        }
    }, [isMuted]);

    const playSoundEffect = (soundFile) => {
        if (!isMuted) {
            const audio = new Audio(soundFile);
            audio.play().catch(e => console.error("Error playing sound effect:", e));
        }
    };

    const fetchQuestion = async (difficultyOverride = null) => {
        const effectiveDifficulty = difficultyOverride || difficulty;
        if (!effectiveDifficulty) return;

        setLoading(true);
        setFeedback(null);
        setInputCarrots('');
        setInputHearts('');
        setTimeLeft(DIFFICULTY_CONFIG[effectiveDifficulty].secondsPerQuestion);
        try {
            const response = await axios.get(`${API_BASE_URL}/game/question`);
            setQuestionImage(response.data.question);
            setSolution(response.data.solution);
            setCarrotsCount(response.data.carrots);
        } catch (error) {
            console.error("Error fetching question:", error);
            setFeedback({ type: 'error', message: 'Failed to load question. Please try again.' });
        } finally {
            setLoading(false);
        }
    };

    const startGame = (selectedDifficulty) => {
        setDifficulty(selectedDifficulty);
        setGameEnded(false);
        setGameOverReason(null);
        fetchQuestion(selectedDifficulty);
    };

    useEffect(() => {
        if (!currentUser) {
            navigate('/login');
            return;
        }
        if (currentUser.attempts <= 0) {
            setGameEnded(true);
            setGameOverReason('attempts');
            playSoundEffect(gameOverSound);
            try { bgMusicRef.current.pause(); } catch { /* ignore */ }
            return;
        }

        if (difficulty && !gameEnded) {
            fetchQuestion();
        }
    }, [currentUser, navigate, difficulty, gameEnded]);

    // Countdown timer effect
    useEffect(() => {
        if (loading || !questionImage || gameEnded || feedback) return;

        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    handleTimeout();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [questionImage, loading, feedback, gameEnded]);

    const handleTimeout = () => {
        setFeedback({ type: 'error', message: "Time's up!" });
        setGameEnded(true);
        setGameOverReason('timeout');
        playSoundEffect(gameOverSound);
        try {
            bgMusicRef.current.pause();
        } catch {
            // ignore
        }
    };

    const handlePlayAgain = async () => {
        if (!currentUser) return;
        await dispatch(resetGame(currentUser._id));
        setFeedback(null);
        setGameEnded(false);
        setGameOverReason(null);
        fetchQuestion();
    };

    const handleChangeLevel = async () => {
        if (!currentUser) return;

        if (currentUser.attempts <= 0) {
            const result = await dispatch(resetGame(currentUser._id));
            if (result.meta.requestStatus !== 'fulfilled') {
                return;
            }
        }

        setFeedback(null);
        setQuestionImage(null);
        setInputCarrots('');
        setInputHearts('');
        setDifficulty(null);
        setTimeLeft(0);
        setGameEnded(false);
        setGameOverReason(null);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (inputCarrots === '' || inputHearts === '') return;

        const numCarrots = parseInt(inputCarrots, 10);
        const numHearts = parseInt(inputHearts, 10);

        const isCarrotsCorrect = numCarrots === carrotsCount;

        if (isCarrotsCorrect) {
            console.log('=== Correct Answer - Updating Score ===');
            console.log('Current difficulty:', difficulty);
            console.log('Points to add:', 10);

            setFeedback({ type: 'success', message: 'Correct! Great counting!' });
            playSoundEffect(correctGuessSound);
            dispatch(updateScore({
                userId: currentUser._id,
                points: 10,
                carrots: numCarrots,
                hearts: numHearts,
                difficulty: difficulty
            }));

            setTimeout(() => {
                fetchQuestion();
            }, 1500);
        } else {
            setFeedback({ type: 'error', message: `Incorrect! It was ${carrotsCount} carrots.` });
            dispatch(reduceAttempts(currentUser._id));
            // Auto-advance after showing error; game over is handled by the useEffect when attempts hit 0
            setTimeout(() => {
                fetchQuestion();
            }, 1500);
        }
    };

    if (!currentUser) return null;

    if (gameEnded || currentUser.attempts <= 0) {
        const gameOverIcon = gameOverReason === 'timeout' ? '⏳' : '💔';
        const gameOverBadge = gameOverReason === 'timeout' ? 'Time expired' : 'Attempts exhausted';

        return (
            <div className="game-container game-container--gameover">
                <div className="game-content game-content--gameover">
                    <div className="game-over-panel">
                        <div className="game-over-emblem" aria-hidden="true">{gameOverIcon}</div>
                        <span className={`game-over-badge ${gameOverReason === 'timeout' ? 'timeout' : 'attempts'}`}>
                            {gameOverBadge}
                        </span>

                        <h2 className="game-over-title">Game Over</h2>
                        <p className="game-over-reason">
                            {gameOverReason === 'timeout' ? 'Time Out!' : 'No attempts left!'}
                        </p>

                        <div className="game-over-summary">
                            <div className="game-over-card game-over-card--score">
                                <span className="game-over-label">Final Score</span>
                                <span className="game-over-value">{currentUser.score}</span>
                            </div>
                            <div className="game-over-card">
                                <span className="game-over-label">Mode</span>
                                <span className="game-over-value game-over-value--small">
                                    {difficulty ? DIFFICULTY_CONFIG[difficulty].label : 'Classic'}
                                </span>
                            </div>
                            <div className="game-over-card">
                                <span className="game-over-label">Attempts Left</span>
                                <span className="game-over-value game-over-value--small">{currentUser.attempts}</span>
                            </div>
                        </div>

                        <div className="game-over-actions">
                            <button
                                type="button"
                                className="submit-btn game-over-primary"
                                onClick={handlePlayAgain}
                            >
                                Play Again
                            </button>
                            <button
                                type="button"
                                className="secondary-btn game-over-secondary"
                                onClick={handleChangeLevel}
                            >
                                Change Level
                            </button>
                            <button
                                type="button"
                                className="game-over-link"
                                onClick={() => navigate('/home')}
                            >
                                Return Home
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="game-container">
            <div className="game-content">
                <header className="game-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <h2>Logic Heart Puzzle</h2>
                        <button
                            onClick={() => setIsMuted(!isMuted)}
                            className="mute-btn"
                            title={isMuted ? "Unmute Music" : "Mute Music"}
                        >
                            {isMuted ? '🔇' : '🔊'}
                        </button>
                    </div>
                    <div className="game-stats">
                        <div className="stat-item">
                            <span className="stat-label">Score</span>
                            <span className="stat-value">{currentUser.score}</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-label">Attempts Left</span>
                            <span className="stat-value">{currentUser.attempts}</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-label">Level</span>
                            <span className="stat-value">{difficulty ? DIFFICULTY_CONFIG[difficulty].label : '-'}</span>
                        </div>
                        <div className={`timer-display ${timeLeft > 8 ? 'safe' : timeLeft > 4 ? 'warning' : 'danger'}`}>
                            <span>⏱️</span>
                            <span>{timeLeft}s</span>
                        </div>
                    </div>
                </header>

                <main>
                    {!difficulty ? (
                        <div className="difficulty-select">
                            <div className="difficulty-head">
                                <h3 className="difficulty-title">Choose your level</h3>
                                <p className="difficulty-subtitle">Easy gives more time, Hard gives less time.</p>
                            </div>

                            <div className="difficulty-actions">
                                {Object.entries(DIFFICULTY_CONFIG).map(([key, config]) => (
                                    <button
                                        key={key}
                                        type="button"
                                        className={`difficulty-btn ${key}`}
                                        onClick={() => startGame(key)}
                                    >
                                        <span className="difficulty-emoji">{config.icon}</span>
                                        <span className="difficulty-name">{config.label}</span>
                                        <span className="difficulty-meta">{config.secondsPerQuestion}s per puzzle</span>
                                        <span className="difficulty-hint">{config.hint}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="game-image-container">
                            {loading ? (
                                <div className="loading-spinner"></div>
                            ) : questionImage ? (
                                <img src={questionImage} alt="Puzzle" className="game-puzzle-image" />
                            ) : (
                                <p>No image loaded</p>
                            )}
                        </div>
                    )}

                    {feedback && (
                        <div className={`feedback-message ${feedback.type}`}>
                            {feedback.message}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="game-input-section">
                        <div className="input-group">
                            <label className="input-label">Carrots 🥕</label>
                            <input
                                type="number"
                                value={inputCarrots}
                                onChange={(e) => setInputCarrots(e.target.value)}
                                placeholder="0"
                                className="game-input"
                                disabled={!difficulty || loading || !!feedback}
                                required
                            />
                        </div>

                        <div className="input-group">
                            <label className="input-label">Hearts ❤️</label>
                            <input
                                type="number"
                                value={inputHearts}
                                onChange={(e) => setInputHearts(e.target.value)}
                                placeholder="0"
                                className="game-input"
                                disabled={!difficulty || loading || !!feedback}
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className="submit-btn"
                            disabled={!difficulty || loading || !!feedback || (inputCarrots === '' || inputHearts === '')}
                        >
                            Submit
                        </button>
                    </form>
                </main>

                <footer>
                    <button className="back-btn" onClick={() => navigate('/home')}>Back to Dashboard</button>
                </footer>
            </div>
        </div>
    );
};

export default Game;
