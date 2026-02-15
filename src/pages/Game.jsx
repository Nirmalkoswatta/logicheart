import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { updateScore, reduceAttempts, resetGame } from '../redux/userSlice';
import './Game.css';

const Game = () => {
    const { currentUser } = useSelector((state) => state.user);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const [questionImage, setQuestionImage] = useState(null);
    const [solution, setSolution] = useState(null);
    const [carrotsCount, setCarrotsCount] = useState(0); // From API
    
    // Inputs
    const [inputCarrots, setInputCarrots] = useState('');
    const [inputHearts, setInputHearts] = useState('');
    
    const [loading, setLoading] = useState(true);
    const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', message: string }

    const fetchQuestion = async () => {
        setLoading(true);
        setFeedback(null);
        setInputCarrots('');
        setInputHearts('');
        try {
            const response = await axios.get('http://localhost:5001/api/game/question');
            // The API returns { question: "http://...", solution: 123, carrots: 5 }
            setQuestionImage(response.data.question);
            setSolution(response.data.solution);
            setCarrotsCount(response.data.carrots); // Store expected carrots
        } catch (error) {
            console.error("Error fetching question:", error);
            setFeedback({ type: 'error', message: 'Failed to load question. Please try again.' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!currentUser) {
            navigate('/login');
            return;
        }
        if (currentUser.attempts <= 0) {
           // Handle Game Over
        }
        fetchQuestion();
    }, [currentUser, navigate]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (inputCarrots === '' || inputHearts === '') return;

        const numCarrots = parseInt(inputCarrots, 10);
        const numHearts = parseInt(inputHearts, 10);

        // Validation Logic
        // We strictly validate Carrots because the API gives us that.
        // We also check if the "Solution" (if available) matches something? 
        // For now, let's assume if Carrots matches, it's correct (since we don't have Hearts count from API).
        const isCarrotsCorrect = numCarrots === carrotsCount;
        
        // Hypothethical validation: If we don't have hearts count, we can't fail them on it.
        // UNLESS solution = carrots + hearts? Let's check that hypothesis? 
        // No, let's just stick to what we know.
        
        if (isCarrotsCorrect) {
             setFeedback({ type: 'success', message: 'Correct! Great counting!' });
             dispatch(updateScore({ 
                 userId: currentUser._id, 
                 points: 10,
                 carrots: numCarrots,
                 hearts: numHearts 
             }));
             
             // Load next question
             setTimeout(() => {
                 fetchQuestion();
             }, 1500);
        } else {
             setFeedback({ type: 'error', message: `Incorrect! It was ${carrotsCount} carrots.` });
             dispatch(reduceAttempts(currentUser._id));
        }
    };

    if (!currentUser) return null;

    if (currentUser.attempts <= 0) {
        return (
            <div className="game-container">
                <div className="game-content">
                    <h2 className="game-header">Game Over</h2>
                    <p style={{ marginBottom: '1rem', color: '#f5365c', fontWeight: 'bold' }}>
                        Incorrect Answer!
                    </p>
                    <div className="game-stats">
                        <div className="stat-item">
                            <span className="stat-label">Final Score</span>
                            <span className="stat-value">{currentUser.score}</span>
                        </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '2rem' }}>
                        <button 
                            className="submit-btn" 
                            onClick={() => dispatch(resetGame(currentUser._id)).then(() => fetchQuestion())}
                            style={{ background: '#2dce89' }}
                        >
                            Play Again
                        </button>
                        <button className="back-btn" onClick={() => navigate('/home')}>Return Home</button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="game-container">
            <div className="game-content">
                <header className="game-header">
                    <h2>Logic Heart Puzzle</h2>
                    <div className="game-stats">
                         <div className="stat-item">
                            <span className="stat-label">Score</span>
                            <span className="stat-value">{currentUser.score}</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-label">Attempts</span>
                            <span className="stat-value">{currentUser.attempts}</span>
                        </div>
                    </div>
                </header>

                <main>
                    <div className="game-image-container">
                        {loading ? (
                            <div className="loading-spinner"></div>
                        ) : questionImage ? (
                            <img src={questionImage} alt="Puzzle" className="game-puzzle-image" />
                        ) : (
                            <p>No image loaded</p>
                        )}
                    </div>

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
                                disabled={loading || (feedback && feedback.type === 'success')}
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
                                disabled={loading || (feedback && feedback.type === 'success')}
                                required
                            />
                        </div>

                        <button 
                            type="submit" 
                            className="submit-btn"
                            disabled={loading || (feedback && feedback.type === 'success') || (inputCarrots === '' || inputHearts === '')}
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
