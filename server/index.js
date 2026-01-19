require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const GameManager = require('./gameManager');

const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());

// Leaderboard Management
const LEADERBOARD_FILE = path.join(__dirname, 'leaderboard.json');
let globalLeaderboard = [];

// Load leaderboard
try {
    if (fs.existsSync(LEADERBOARD_FILE)) {
        globalLeaderboard = JSON.parse(fs.readFileSync(LEADERBOARD_FILE, 'utf8'));
    }
} catch (e) {
    console.error("Failed to load leaderboard", e);
}

function getLeaderboard() {
    return globalLeaderboard;
}

function updateLeaderboard(gamePlayers) {
    const playersArr = Object.values(gamePlayers);
    for (const p of playersArr) {
        globalLeaderboard.push({
            name: p.name,
            score: p.score,
            date: new Date().toISOString()
        });
    }

    // Sort and keep top 20
    globalLeaderboard.sort((a, b) => b.score - a.score);
    globalLeaderboard = globalLeaderboard.slice(0, 20);

    // Save
    try {
        fs.writeFileSync(LEADERBOARD_FILE, JSON.stringify(globalLeaderboard, null, 2));
    } catch (e) {
        console.error("Failed to save leaderboard", e);
    }
}

const globalMethods = { getLeaderboard, updateLeaderboard };

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // Allow all for dev simplicity, restrict in prod
        methods: ["GET", "POST"]
    }
});

const games = {}; // roomId -> GameManager

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Basic acknowledgment
    socket.emit('connected', { id: socket.id });

    // Pass events to game manager
    socket.on('join_game', ({ name, gameId }) => {
        // Normalize gameId
        const room = gameId ? gameId.toString().toUpperCase() : 'DEFAULT';

        if (!games[room]) {
            console.log(`Creating new game room: ${room}`);
            games[room] = new GameManager(io, room, globalMethods);
        }

        const game = games[room];

        // Join socket room
        socket.join(room);

        // Store game reference on socket
        socket.data.gameId = room;

        const success = game.addPlayer(socket, name);
        if (success) {
            console.log(`Player ${name} joined room ${room} (${socket.id})`);
        }
    });

    socket.on('set_ready', () => {
        const room = socket.data.gameId;
        if (room && games[room]) {
            games[room].setReady(socket.id);
        }
    });

    socket.on('answer', (regionName) => {
        const room = socket.data.gameId;
        if (room && games[room]) {
            games[room].handleAnswer(socket.id, regionName);
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        const room = socket.data.gameId;
        if (room && games[room]) {
            games[room].removePlayer(socket.id);

            // Cleanup empty games if needed, or leave them for reuse
            // if (Object.keys(games[room].players).length === 0) {
            //     delete games[room];
            //     console.log(`Room ${room} deleted (empty)`);
            // }
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});
