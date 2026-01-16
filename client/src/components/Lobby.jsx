import React, { useState, useEffect } from 'react';

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
        <div className="glass-panel fade-in" style={{ width: '80%', maxWidth: '800px', margin: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1>Lobby di Attesa</h1>
                {timeLeft !== null && (
                    <div className="glass-panel" style={{ padding: '0.5rem 1rem', background: 'var(--primary)', fontWeight: 'bold' }}>
                        Inizio in: {timeLeft}s
                    </div>
                )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                {playerList.map(p => (
                    <div key={p.id} style={{
                        padding: '1rem',
                        background: 'rgba(255,255,255,0.05)',
                        borderRadius: '8px',
                        border: p.ready ? '2px solid #22c55e' : '1px solid var(--glass-border)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <span>{p.name} {p.id === socket.id && '(Tu)'}</span>
                        {p.ready && <span style={{ color: '#22c55e' }}>✓</span>}
                    </div>
                ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'center' }}>
                {!isReady ? (
                    <button className="btn" style={{ fontSize: '1.2rem' }} onClick={onSetReady}>
                        Sono pronto a giocare!
                    </button>
                ) : (
                    <p style={{ opacity: 0.8, fontStyle: 'italic' }}>In attesa di altri giocatori...</p>
                )}
            </div>

            <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.9rem', opacity: 0.6 }}>
                <p>Regole: Indovina la regione entro il tempo limite. Più veloce sei, più punti fai!</p>
            </div>
        </div>
    );
}
