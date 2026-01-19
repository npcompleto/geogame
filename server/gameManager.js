const { regions, capitals, provinces, comuni } = require('./data');

class GameManager {
    constructor(io, roomId, globalMethods = {}) {
        this.io = io;
        this.roomId = roomId;
        this.players = {}; // socketId -> { name, score, ready, joinedAt }
        this.status = 'lobby'; // lobby, playing, ended
        this.questions = [];
        this.currentQuestionIndex = 0;
        this.questionTimer = null;
        this.startTime = null;
        this.gameLength = 0; // Not used yet, maybe purely level based
        this.level = 1;
        this.maxLevels = 4;
        this.activeLevel = 0; // Track current active level context

        // Global methods (leaderboard)
        this.globalMethods = globalMethods;

        // Config
        this.waitingTime = 60; // seconds to start after first ready? Or just 1 minute countdown
        this.lobbyTimer = null;
    }

    // ... methods ...

    // ... methods ...


    addPlayer(socket, name) {
        // If game is playing, don't let them join as player, but send them the state to view leaderboard
        if (this.status !== 'lobby') {
            socket.emit('game_in_progress', { players: this.players });
            return false;
        }
        this.players[socket.id] = {
            id: socket.id,
            name,
            score: 0,
            ready: false,
        };
        this.broadcastLobbyState();
        return true;
    }

    removePlayer(socketId) {
        delete this.players[socketId];
        // If empty, game wrapper in index.js should handle cleanup of the manager itself optionally
        // But here we just broadcast update
        if (Object.keys(this.players).length === 0) {
            this.resetGame();
        } else {
            this.broadcastLobbyState();
        }
    }

    setReady(socketId) {
        if (this.players[socketId]) {
            this.players[socketId].ready = true;
            this.broadcastLobbyState();

            // Check if we should start the countdown
            // Logic: "Dopo 1 minuto partirà la partita con i soli giocatori che hanno cliccato su sono pronto"
            // Implication: The timer starts when? Maybe when the *first* person clicks ready? Or just a global lobby timer?
            // Let's implement: When first player is ready, start 60s countdown.
            const readyCount = Object.values(this.players).filter(p => p.ready).length;
            if (readyCount === 1 && !this.lobbyTimer) {
                this.startLobbyCountdown();
            }
        }
    }

    startLobbyCountdown() {
        let timeLeft = 10; // 1 minute
        this.io.to(this.roomId).emit('lobby_timer_start', timeLeft);

        this.lobbyTimer = setInterval(() => {
            timeLeft--;
            if (timeLeft > 0) {
                this.io.to(this.roomId).emit('lobby_timer_tick', timeLeft);
            } else {
                clearInterval(this.lobbyTimer);
                this.lobbyTimer = null;
                this.startGame();
            }
        }, 1000);
    }

    generateQuestions() {
        const qs = [];

        // Helper to shuffle array
        const shuffle = (array) => {
            let currentIndex = array.length, randomIndex;
            while (currentIndex != 0) {
                randomIndex = Math.floor(Math.random() * currentIndex);
                currentIndex--;
                [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
            }
            return array;
        };

        // Level 1: Find Region (6 questions unique)
        const allRegions = shuffle([...regions]); // Clone then shuffle
        const selectedRegions = allRegions.slice(0, 6);
        for (const target of selectedRegions) {
            qs.push({
                level: 1,
                text: `Dove si trova la regione "${target}"?`,
                target: target,
                attempts: {}
            });
        }

        // Level 2: Region of Capital (6 questions unique)
        const allCapitals = shuffle(Object.keys(capitals));
        const selectedCapitals = allCapitals.slice(0, 6);
        for (const capital of selectedCapitals) {
            const region = capitals[capital];
            qs.push({
                level: 2,
                text: `In quale regione si trova "${capital}"?`,
                target: region,
                attempts: {}
            });
        }

        // Level 3: Region of Province (6 unique questions)
        const allProvinces = shuffle(Object.keys(provinces));
        const selectedProvinces = allProvinces.slice(0, 6);

        for (const prov of selectedProvinces) {
            const region = provinces[prov];
            qs.push({
                level: 3,
                text: `In quale regione si trova la provincia di "${prov}"?`,
                target: region,
                attempts: {}
            });
        }

        // Level 4: Region of Comune (6 unique questions)
        // Ensure we have 'comuni' loaded (it might be undefined if not in data.js yet, but we added it)
        if (comuni) {
            const allComuni = shuffle(Object.keys(comuni));
            const selectedComuni = allComuni.slice(0, 6);

            for (const com of selectedComuni) {
                const region = comuni[com];
                qs.push({
                    level: 4,
                    text: `In quale regione si trova il comune di "${com}"?`,
                    target: region,
                    attempts: {}
                });
            }
        }

        return qs;
    }

    startGame() {
        // Filter non-ready players? "partirà la partita con i soli giocatori che hanno cliccato su sono pronto"
        // So we assume anyone NOT ready is kicked or just spectating? Let's kick them or ignore them.
        // For simplicity, we just keep ready players.

        const readyPlayers = {};
        for (const [id, p] of Object.entries(this.players)) {
            if (p.ready) {
                readyPlayers[id] = p;
            } else {
                // notify them?
                this.io.to(id).emit('game_started_without_you');
            }
        }
        this.players = readyPlayers;

        if (Object.keys(this.players).length === 0) {
            this.resetGame();
            return;
        }

        this.status = 'playing';
        this.questions = this.generateQuestions();
        this.currentQuestionIndex = 0;

        this.io.to(this.roomId).emit('game_start', { players: this.players });
        this.askQuestion();
    }

    askQuestion() {
        if (this.currentQuestionIndex >= this.questions.length) {
            this.endGame();
            return;
        }

        const q = this.questions[this.currentQuestionIndex];
        // Reset attempts for this question
        q.startTime = Date.now();
        q.solvedBy = []; // list of socketIds who solved it

        let levelRules = null;
        if (q.level > this.activeLevel) {
            this.activeLevel = q.level;
            const rules = {
                1: "Adesso devi trovare la regione indicata sulla mappa!",
                2: "Adesso devi indovinare in quale regione si trova il capoluogo indicato!",
                3: "Adesso devi indovinare in quale regione si trova la provincia indicata!",
                4: "Adesso devi indovinare in quale regione si trova il comune indicato!"
            };
            levelRules = rules[q.level] || `Livello ${q.level}`;
        }

        this.io.to(this.roomId).emit('new_question', {
            index: this.currentQuestionIndex + 1,
            total: this.questions.length,
            text: q.text,
            level: q.level,
            levelRules: levelRules
        });
    }

    handleAnswer(socketId, regionName) {
        if (this.status !== 'playing') return;

        const q = this.questions[this.currentQuestionIndex];
        const player = this.players[socketId];
        if (!player) return;

        if (q.solvedBy.includes(socketId)) return; // Already answered correctly

        // Initialize attempts for this player if not present
        if (!q.attempts[socketId]) q.attempts[socketId] = 0;

        if (q.attempts[socketId] >= 3) return; // Max attempts reached

        q.attempts[socketId]++;
        const attemptNum = q.attempts[socketId];

        if (regionName.toLowerCase() === q.target.toLowerCase()) {
            // Correct!
            q.solvedBy.push(socketId);

            let points = 0;
            if (attemptNum === 1) points = 3;
            else if (attemptNum === 2) points = 2;
            else if (attemptNum === 3) points = 1;

            // Speed bonus (First player)
            if (q.solvedBy.length === 1) {
                points += 3; // First one!
                this.io.to(this.roomId).emit('player_message', { id: socketId, msg: 'Fastest!' });
            }

            // Time Bonus
            // Calculate time taken in seconds
            const timeTaken = (Date.now() - q.startTime) / 1000;
            let timeBonus = 0;
            if (timeTaken < 5) {
                timeBonus = 2;
            } else if (timeTaken < 10) {
                timeBonus = 1;
            }
            points += timeBonus;

            player.score += points;

            this.io.to(socketId).emit('answer_result', {
                correct: true,
                score: player.score,
                pointsAdded: points,
                timeBonus: timeBonus,
                correctAnswer: q.target,
                attemptsLeft: 3 - attemptNum, // Should generally be > 0 here
                done: true
            });
            this.io.to(this.roomId).emit('player_update', { id: socketId, score: player.score });

            this.checkQuestionEnd();
        } else {
            // Wrong
            const done = attemptNum >= 3;
            this.io.to(socketId).emit('answer_result', {
                correct: false,
                attemptsLeft: 3 - attemptNum,
                correctAnswer: done ? q.target : null,
                done: done
            });
            if (done) {
                this.checkQuestionEnd();
            }
        }
    }

    checkQuestionEnd() {
        // Check if all active players have either solved it or used all attempts
        const activePlayers = Object.keys(this.players);
        const allDone = activePlayers.every(id => {
            const solved = this.questions[this.currentQuestionIndex].solvedBy.includes(id);
            const attempts = this.questions[this.currentQuestionIndex].attempts[id] || 0;
            return solved || attempts >= 3;
        });

        if (allDone) {
            // Move to next question after delay
            setTimeout(() => {
                this.currentQuestionIndex++;
                this.askQuestion();
            }, 2000);
        }
    }

    endGame() {
        this.status = 'ended';

        // Update global leaderboard if callback exists
        if (this.globalMethods && this.globalMethods.updateLeaderboard) {
            this.globalMethods.updateLeaderboard(this.players);
        }

        const globalLeaderboard = this.globalMethods && this.globalMethods.getLeaderboard ? this.globalMethods.getLeaderboard() : [];

        this.io.to(this.roomId).emit('game_over', {
            players: this.players,
            globalLeaderboard: globalLeaderboard
        });
        // Reset after some time?
        setTimeout(() => this.resetGame(), 10000);
    }

    resetGame() {
        this.status = 'lobby';
        this.players = {};
        this.questions = [];
        this.activeLevel = 0; // Reset active level
        if (this.lobbyTimer) clearInterval(this.lobbyTimer);
        this.lobbyTimer = null;
        this.io.to(this.roomId).emit('reset');
    }

    broadcastLobbyState() {
        const globalLeaderboard = this.globalMethods && this.globalMethods.getLeaderboard ? this.globalMethods.getLeaderboard() : [];
        this.io.to(this.roomId).emit('lobby_state', {
            players: this.players,
            globalLeaderboard: globalLeaderboard
        });
    }
}

module.exports = GameManager;
