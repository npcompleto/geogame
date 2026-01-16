import React, { useState, useEffect } from 'react';
import Map from './Map';

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
                setFeedback({ type: 'correct', msg: `Corretto! +${data.pointsAdded} pt`, delta: data.pointsAdded });
            } else {
                setFeedback({ type: 'wrong', msg: `Sbagliato! Tentativi rimasti: ${data.attemptsLeft}`, delta: 0 });
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
                setFeedback({ type: 'bonus', msg: data.msg, delta: 0 });
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

    return (
        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* HUD Header */}
            <div className="glass-panel" style={{
                padding: '1rem',
                margin: '1rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                zIndex: 10
            }}>
                <div style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>Livello {currentQuestion.level}</div>
                <div style={{ flex: 1, textAlign: 'center' }}>
                    Domanda {currentQuestion.index}/{currentQuestion.total}
                </div>
                <div style={{ fontWeight: 'bold', fontSize: '1.2rem', color: '#f59e0b' }}>
                    Punti: {me ? me.score : 0}
                </div>
            </div>

            {/* Map Area */}
            <div style={{ flex: 1, position: 'relative' }}>
                <Map onRegionClick={handleRegionClick} showLabels={showLabels} />

                {/* Overlay Feedback */}
                {feedback && (
                    <div className="glass-panel fade-in" style={{
                        position: 'absolute',
                        top: '50%', left: '50%',
                        transform: 'translate(-50%, -50%)',
                        background: feedback.type === 'correct' ? 'rgba(34, 197, 94, 0.9)' :
                            feedback.type === 'wrong' ? 'rgba(239, 68, 68, 0.9)' : 'rgba(245, 158, 11, 0.9)',
                        color: 'white',
                        fontSize: '1.5rem',
                        fontWeight: 'bold',
                        pointerEvents: 'none',
                        zIndex: 100
                    }}>
                        {feedback.msg}
                    </div>
                )}

                {/* Level Rules Overlay */}
                {levelRules && (
                    <div className="glass-panel fade-in" style={{
                        position: 'absolute',
                        top: '0', left: '0',
                        width: '100%', height: '100%',
                        background: 'rgba(0, 0, 0, 0.85)',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        flexDirection: 'column',
                        zIndex: 200, // Higher than everything
                        pointerEvents: 'none' // Let clicks pass through if user knows what to do? Maybe better to block slightly or just overlay
                    }}>
                        <h1 style={{ fontSize: '3rem', textAlign: 'center', color: '#60a5fa', marginBottom: '1rem' }}>
                            Livello {currentQuestion.level}
                        </h1>
                        <h2 style={{ fontSize: '2rem', textAlign: 'center', color: 'white', maxWidth: '80%' }}>
                            {levelRules}
                        </h2>
                    </div>
                )}
            </div>

            {/* Result Table (if done) */}
            {finalResult && (
                <div className="glass-panel fade-in" style={{
                    margin: '0 1rem 1rem 1rem',
                    textAlign: 'center',
                    backgroundColor: finalResult.correct ? 'rgba(20, 83, 45, 0.8)' : 'rgba(127, 29, 29, 0.8)'
                }}>
                    <table style={{ width: '100%', color: 'white' }}>
                        <tbody>
                            <tr>
                                <td style={{ padding: '0.5rem', fontWeight: 'bold' }}>Risultato:</td>
                                <td style={{ padding: '0.5rem' }}>{finalResult.correct ? 'RISPOSTA ESATTA' : 'RISPOSTA SBAGLIATA'}</td>
                            </tr>
                            <tr>
                                <td style={{ padding: '0.5rem', fontWeight: 'bold' }}>Risposta Corretta:</td>
                                <td style={{ padding: '0.5rem', fontSize: '1.2rem', fontWeight: "bold" }}>{finalResult.correctAnswer}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            )}

            {/* Question Footer */}
            {!finalResult && (
                <div className="glass-panel" style={{
                    margin: '1rem',
                    textAlign: 'center',
                    background: 'linear-gradient(to right, rgba(30, 41, 59, 0.9), rgba(15, 23, 42, 0.9))',
                    zIndex: 10
                }}>
                    <h2 style={{ margin: 0 }} dangerouslySetInnerHTML={{ __html: currentQuestion.text }}></h2>
                </div>
            )}

            {/* Leaderboard Sidebar (Optional, maybe small overlay) */}
            <div style={{
                position: 'absolute',
                right: '1rem',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '150px',
                fontSize: '0.8rem',
                opacity: 0.7
            }} className="glass-panel">
                <h4 style={{ margin: '0 0 0.5rem 0' }}>Classifica</h4>
                {Object.values(gameState.players)
                    .sort((a, b) => b.score - a.score)
                    .map(p => (
                        <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>{p.name}</span>
                            <span>{p.score}</span>
                        </div>
                    ))}
            </div>
        </div>
    );
}
