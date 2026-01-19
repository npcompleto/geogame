import React, { useState, useEffect } from 'react';
import './Lobby.css';

export default function Lobby({ socket, players, isReady, onSetReady }) {
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

            <div className="lobby-footer">
                <p>Regole: Indovina la regione entro il tempo limite. Più veloce sei, più punti fai!</p>
            </div>
        </div>
    );
}
