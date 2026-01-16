require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const GameManager = require('./gameManager');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // Allow all for dev simplicity, restrict in prod
        methods: ["GET", "POST"]
    }
});

const gameManager = new GameManager(io);

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Basic acknowledgment
    socket.emit('connected', { id: socket.id });

    // Pass events to game manager
    socket.on('join_game', (name) => {
        const success = gameManager.addPlayer(socket, name);
        if (success) {
            console.log(`Player ${name} joined (${socket.id})`);
        }
    });

    socket.on('set_ready', () => {
        gameManager.setReady(socket.id);
    });

    socket.on('answer', (regionName) => {
        gameManager.handleAnswer(socket.id, regionName);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        gameManager.removePlayer(socket.id);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
