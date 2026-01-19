import React, { useState, useEffect } from 'react';
import Map from './Map';
import './GameInterface.css';

export default function GameInterface({ socket, gameState, myId }) {
    const { players, currentQuestion } = gameState;
    const me = players[myId];

    // Feedback state
    const [feedback, setFeedback] = useState(null); // { type: 'correct' | 'wrong', msg: string, delta: number }
    const [finalResult, setFinalResult] = useState(null); // { correctAnswer: string, correct: boolean }

    useEffect(() => {
        // Reset per question
        setFinalResult(null);
    }, [currentQuestion]);

    useEffect(() => {
        function onAnswerResult(data) {
            // data: { correct, score, pointsAdded, attemptsLeft, correctAnswer, done }
            if (data.correct) {
                setFeedback({
                    type: 'correct',
                    title: 'CORRETTO!',
                    scoreStr: `+${data.pointsAdded}`,
                    subMsg: 'Ottimo lavoro!'
                });
            } else {
                setFeedback({
                    type: 'wrong',
                    title: 'SBAGLIATO!',
                    scoreStr: '',
                    subMsg: `Tentativi rimasti: ${data.attemptsLeft}`
                });
            }

            if (data.done) {
                setFinalResult({
                    correctAnswer: data.correctAnswer,
                    correct: data.correct
                });
            }

            // Clear feedback after 2s
            setTimeout(() => setFeedback(null), 2000);
        }

        function onPlayerMessage(data) {
            // data: { id, msg }
            if (data.id === myId) {
                setFeedback({ type: 'bonus', title: 'BONUS', scoreStr: '', subMsg: data.msg });
                setTimeout(() => setFeedback(null), 2000);
            }
        }

        socket.on('answer_result', onAnswerResult);
        socket.on('player_message', onPlayerMessage);

        return () => {
            socket.off('answer_result', onAnswerResult);
            socket.off('player_message', onPlayerMessage);
        };
    }, [socket, myId]);

    const handleRegionClick = (name) => {
        if (!currentQuestion) return;
        if (finalResult) return; // Already done
        //console.log("Clicked:", name); 
        socket.emit('answer', name);
    };

    // Level Rules Overlay
    const [levelRules, setLevelRules] = useState(null);
    useEffect(() => {
        if (currentQuestion && currentQuestion.levelRules) {
            setLevelRules(currentQuestion.levelRules);
            const timer = setTimeout(() => setLevelRules(null), 4000); // Show for 4 seconds
            return () => clearTimeout(timer);
        }
    }, [currentQuestion]);

    if (!currentQuestion) return <div className="glass-panel">Caricamento domanda...</div>;

    const showLabels = currentQuestion.level > 1;

    // Calculate rank
    const sortedPlayers = Object.values(players).sort((a, b) => b.score - a.score);
    const myRank = sortedPlayers.findIndex(p => p.id === myId) + 1;
    const totalPlayers = sortedPlayers.length;

    return (
        <div className="game-interface-container">
            {/* HUD Header */}
            <div className="glass-panel game-hud">
                <div className="game-hud-left">
                    <div className="game-level-indicator">Livello {currentQuestion.level}</div>
                </div>

                <div className="game-hud-center">
                    Domanda {currentQuestion.index}/{currentQuestion.total}
                </div>

                <div className="game-hud-right">
                    Punti: {me ? me.score : 0}
                </div>
            </div>

            {/* Map Area */}
            <div className="game-map-area">

                {/* Rank Badge */}
                <div className="glass-panel game-rank-badge">
                    <span className="game-rank-label">Sei il</span>
                    <span className="game-rank-value">{myRank}°</span>
                    <span className="game-rank-sublabel">in classifica</span>
                </div>

                <Map onRegionClick={handleRegionClick} showLabels={showLabels} />

                {/* Overlay Feedback */}
                {
                    feedback && (
                        <div className={`gamified-panel game-feedback-overlay ${feedback.type}`}>
                            <h2 className="game-feedback-title">{feedback.title}</h2>

                            {feedback.scoreStr && (
                                <div className="score-animation game-feedback-score">
                                    {feedback.scoreStr}
                                </div>
                            )}

                            <div className="game-feedback-submsg">
                                {feedback.subMsg}
                            </div>
                        </div>
                    )
                }

                {/* Level Rules Overlay */}
                {
                    levelRules && (
                        <div className="glass-panel fade-in game-rules-overlay">
                            <h1 className="game-rules-title">
                                Livello {currentQuestion.level}
                            </h1>
                            <h2 className="game-rules-text">
                                {levelRules}
                            </h2>
                        </div>
                    )
                }
            </div >

            {/* Result Table (if done) */}
            {
                finalResult && (
                    <div className={`glass-panel fade-in game-result-panel ${finalResult.correct ? 'correct' : 'wrong'}`}>
                        <table className="game-result-table">
                            <tbody>
                                <tr>
                                    <td className="game-result-cell-label">Risultato:</td>
                                    <td className="game-result-cell-value">{finalResult.correct ? 'RISPOSTA ESATTA' : 'RISPOSTA SBAGLIATA'}</td>
                                </tr>
                                <tr>
                                    <td className="game-result-cell-label">Risposta Corretta:</td>
                                    <td className="game-result-answer">{finalResult.correctAnswer}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                )
            }

            {/* Question Footer */}
            {
                !finalResult && (
                    <div className="glass-panel game-footer">
                        <h2 className="game-footer-text-container" dangerouslySetInnerHTML={{ __html: currentQuestion.text }}></h2>
                    </div>
                )
            }
        </div >
    );
}
