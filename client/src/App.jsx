import React, { useState, useEffect } from 'react';
import socket from './socket';
import Lobby from './components/Lobby';
import GameInterface from './components/GameInterface';
import './index.css';

function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [playerState, setPlayerState] = useState({
    name: '',
    joined: false,
    ready: false,
    score: 0,
    id: null
  });
  const [gameState, setGameState] = useState({
    status: 'lobby', // lobby, playing, ended
    players: {},
    currentQuestion: null,
    winner: null
  });

  useEffect(() => {
    socket.connect();

    function onConnect() {
      setIsConnected(true);
      setPlayerState(prev => ({ ...prev, id: socket.id }));
    }

    function onDisconnect() {
      setIsConnected(false);
    }

    function onLobbyState(data) {
      setGameState(prev => ({ ...prev, players: data.players }));
    }

    function onGameStart(data) {
      setGameState(prev => ({ ...prev, status: 'playing', players: data.players }));
    }

    function onNewQuestion(data) {
      // data: { index, total, text, level }
      setGameState(prev => ({ ...prev, currentQuestion: data }));
    }

    function onPlayerUpdate(data) {
      // Updated score for a player
      setGameState(prev => {
        const newPlayers = { ...prev.players };
        if (newPlayers[data.id]) {
          newPlayers[data.id].score = data.score;
        }
        return { ...prev, players: newPlayers };
      });
    }

    function onGameOver(data) {
      setGameState(prev => ({ ...prev, status: 'ended', players: data.players }));
    }

    function onReset() {
      setGameState({
        status: 'lobby',
        players: {},
        currentQuestion: null,
        winner: null
      });
      setPlayerState(prev => ({ ...prev, joined: false, ready: false, score: 0 }));
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('lobby_state', onLobbyState);
    socket.on('game_start', onGameStart);
    socket.on('new_question', onNewQuestion);
    socket.on('player_update', onPlayerUpdate);
    socket.on('game_over', onGameOver);
    socket.on('reset', onReset);

    // Timer events handled in components usually, or globally? 
    // We can listen here or pass socket down.

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('lobby_state', onLobbyState);
      socket.off('game_start', onGameStart);
      socket.off('new_question', onNewQuestion);
      socket.off('player_update', onPlayerUpdate);
      socket.off('game_over', onGameOver);
      socket.off('reset', onReset);
      socket.disconnect();
    };
  }, []);

  return (
    <div className="app-container">
      {!isConnected && <div className="glass-panel">Connecting to server...</div>}

      {isConnected && !playerState.joined && (
        <Login onJoin={(name) => {
          socket.emit('join_game', name);
          setPlayerState(prev => ({ ...prev, name, joined: true }));
        }} />
      )}

      {isConnected && playerState.joined && gameState.status === 'lobby' && (
        <Lobby
          socket={socket}
          players={gameState.players}
          isReady={playerState.ready}
          onSetReady={() => {
            socket.emit('set_ready');
            setPlayerState(prev => ({ ...prev, ready: true }));
          }}
        />
      )}

      {isConnected && gameState.status === 'playing' && (
        <GameInterface socket={socket} gameState={gameState} myId={playerState.id} />
      )}

      {isConnected && gameState.status === 'ended' && (
        <GameOver players={gameState.players} myId={playerState.id} />
      )}
    </div>
  );
}

function Login({ onJoin }) {
  const [name, setName] = useState('');
  return (
    <div className="glass-panel fade-in" style={{ textAlign: 'center' }}>
      <h1>Benvenuto a GeoBattle IT</h1>
      <p>Inserisci il tuo nome per iniziare</p>
      <input
        className="input-field"
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="Il tuo nome"
        onKeyDown={e => e.key === 'Enter' && name && onJoin(name)}
      />
      <button className="btn" disabled={!name} onClick={() => onJoin(name)}>
        Entra nella Lobby
      </button>
    </div>
  );
}

function GameOver({ players, myId }) {
  const sorted = Object.values(players).sort((a, b) => b.score - a.score);
  const winner = sorted[0];

  return (
    <div className="glass-panel fade-in" style={{ textAlign: 'center', minWidth: '400px' }}>
      <h1>Partita Terminata!</h1>
      {winner && <h2>Vincitore: {winner.name} ({winner.score} pt)</h2>}

      <div style={{ marginTop: '2rem', textAlign: 'left' }}>
        <h3>Classifica Finale</h3>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {sorted.map((p, i) => (
            <li key={p.id} style={{ padding: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', color: p.id === myId ? '#3b82f6' : 'white', fontWeight: p.id === myId ? 'bold' : 'normal' }}>
              <span>{i + 1}. {p.name} {p.id === myId && '(Tu)'}</span>
              <span>{p.score}</span>
            </li>
          ))}
        </ul>
      </div>

      <p style={{ marginTop: '2rem', opacity: 0.7 }}>In attesa di reset del server...</p>
    </div>
  );
}

export default App;
