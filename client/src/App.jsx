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

    function onGameInProgress(data) {
      setGameState(prev => ({ ...prev, status: 'inprogress_view', players: data.players }));
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('lobby_state', onLobbyState);
    socket.on('game_start', onGameStart);
    socket.on('new_question', onNewQuestion);
    socket.on('player_update', onPlayerUpdate);
    socket.on('game_over', onGameOver);
    socket.on('reset', onReset);
    socket.on('game_in_progress', onGameInProgress);

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
      socket.off('game_in_progress', onGameInProgress);
      socket.disconnect();
    };
  }, []);

  return (
    <div className="app-container">
      {!isConnected && <div className="glass-panel">Connecting to server...</div>}

      {isConnected && !playerState.joined && (
        <Login onJoin={(name, gameId) => {
          socket.emit('join_game', { name, gameId });
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

      {isConnected && gameState.status === 'inprogress_view' && (
        <GameInProgress players={gameState.players} />
      )}
    </div>
  );
}

function Login({ onJoin }) {
  const [name, setName] = useState('');
  // Get gameId from URL or default
  const gameId = window.location.pathname.substring(1) || 'DEFAULT';

  return (
    <div className="glass-panel fade-in login-container">
      <h1>Benvenuto a GeoBattle IT</h1>
      <p>Partita: <strong>{gameId}</strong></p>
      <p>Inserisci il tuo nome per iniziare</p>
      <input
        className="input-field"
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="Il tuo nome"
        onKeyDown={e => e.key === 'Enter' && name && onJoin(name, gameId)}
      />
      <button className="btn" disabled={!name} onClick={() => onJoin(name, gameId)}>
        Entra nella Lobby
      </button>
    </div>
  );
}

function GameOver({ players, myId }) {
  const sorted = Object.values(players).sort((a, b) => b.score - a.score);
  const winner = sorted[0];

  return (
    <div className="glass-panel fade-in gameover-container">
      <h1>Partita Terminata!</h1>
      {winner && <h2>Vincitore: {winner.name} ({winner.score} pt)</h2>}

      <div className="gameover-leaderboard">
        <h3>Classifica Finale</h3>
        <ul className="gameover-list">
          {sorted.map((p, i) => (
            <li key={p.id} className={`gameover-list-item ${p.id === myId ? 'is-me' : ''}`}>
              <span>{i + 1}. {p.name} {p.id === myId && '(Tu)'}</span>
              <span>{p.score}</span>
            </li>
          ))}
        </ul>
      </div>

      <p className="gameover-wait-text">In attesa di reset del server...</p>
    </div>
  );
}

function GameInProgress({ players }) {
  const sorted = Object.values(players).sort((a, b) => b.score - a.score);

  return (
    <div className="glass-panel fade-in inprogress-container">
      <h1>La partita è attualmente in corso</h1>

      <div className="inprogress-leaderboard">
        <h3>Classifica Attuale</h3>
        <ul className="inprogress-list">
          {sorted.map((p, i) => (
            <li key={p.id} className="inprogress-list-item">
              <span>{i + 1}. {p.name}</span>
              <span>{p.score}</span>
            </li>
          ))}
        </ul>
      </div>

      <p className="inprogress-wait-text">Attendi il termine della partita per unirti alla prossima.</p>
    </div>
  );
}

export default App;

