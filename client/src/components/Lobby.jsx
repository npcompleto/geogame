import React, { useState, useEffect } from 'react';
import './Lobby.css';

export default function Lobby({ socket, players, isReady, onSetReady, globalLeaderboard = [] }) {
    const [timeLeft, setTimeLeft] = useState(null);

    useEffect(() => {
        function onTimerStart(t) {
            setTimeLeft(t);
        }
        function onTimerTick(t) {
            setTimeLeft(t);
        }

        socket.on('lobby_timer_start', onTimerStart);
        socket.on('lobby_timer_tick', onTimerTick);

        return () => {
            socket.off('lobby_timer_start', onTimerStart);
            socket.off('lobby_timer_tick', onTimerTick);
        };
    }, [socket]);

    const playerList = Object.values(players);

    return (
        <div className="glass-panel fade-in lobby-container">
            <div className="lobby-header">
                <h1>Lobby di Attesa</h1>
                {timeLeft !== null && (
                    <div className="glass-panel lobby-timer-badge">
                        Inizio in: {timeLeft}s
                    </div>
                )}
            </div>

            <div className="lobby-grid">
                {playerList.map(p => (
                    <div key={p.id} className={`lobby-player-card ${p.ready ? 'ready' : ''}`}>
                        <span>{p.name} {p.id === socket.id && '(Tu)'}</span>
                        {p.ready && <span className="lobby-check-icon">✓</span>}
                    </div>
                ))}
            </div>

            <div className="lobby-actions">
                {!isReady ? (
                    <button className="btn lobby-ready-btn" onClick={onSetReady}>
                        Sono pronto a giocare!
                    </button>
                ) : (
                    <p className="lobby-waiting-text">In attesa di altri giocatori...</p>
                )}
            </div>

            {/* Global Leaderboard Section */}
            {globalLeaderboard && globalLeaderboard.length > 0 && (
                <div style={{ marginTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem' }}>
                    <h3 style={{ textAlign: 'center', marginBottom: '1rem' }}>Classifica Globale (Top 20)</h3>
                    <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                            <tbody>
                                {globalLeaderboard.map((p, i) => (
                                    <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                        <td style={{ padding: '0.5rem' }}>{i + 1}.</td>
                                        <td style={{ padding: '0.5rem', fontWeight: 'bold' }}>{p.name}</td>
                                        <td style={{ padding: '0.5rem', textAlign: 'right' }}>{p.score} pt</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <div className="lobby-footer">
                <p>Regole: Indovina la regione entro il tempo limite. Più veloce sei, più punti fai!</p>
            </div>
        </div>
    );
}
