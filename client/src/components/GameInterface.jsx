import React, { useState, useEffect } from 'react';
import Map from './Map';

export default function GameInterface({ socket, gameState, myId }) {
    const { players, currentQuestion } = gameState;
    const me = players[myId];

    // Feedback state
    const [feedback, setFeedback] = useState(null); // { type: 'correct' | 'wrong', msg: string, delta: number }

    useEffect(() => {
        function onAnswerResult(data) {
            // data: { correct, score, pointsAdded, attemptsLeft }
            if (data.correct) {
                setFeedback({ type: 'correct', msg: `Corretto! +${data.pointsAdded} pt`, delta: data.pointsAdded });
            } else {
                setFeedback({ type: 'wrong', msg: `Sbagliato! Tentativi rimasti: ${data.attemptsLeft}`, delta: 0 });
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
        //console.log("Clicked:", name); 
        // We might need to map map-names to server-names if they differ.
        // Assuming perfect match or close enough.
        socket.emit('answer', name);
    };

    if (!currentQuestion) return <div className="glass-panel">Caricamento domanda...</div>;

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
                <Map onRegionClick={handleRegionClick} />

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
            </div>

            {/* Question Footer */}
            <div className="glass-panel" style={{
                margin: '1rem',
                textAlign: 'center',
                background: 'linear-gradient(to right, rgba(30, 41, 59, 0.9), rgba(15, 23, 42, 0.9))',
                zIndex: 10
            }}>
                <h2 style={{ margin: 0 }} dangerouslySetInnerHTML={{ __html: currentQuestion.text }}></h2>
            </div>

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
