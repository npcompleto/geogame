const { regions, capitals, provinces } = require('./data');

class GameManager {
    constructor(io) {
        this.io = io;
        this.players = {}; // socketId -> { name, score, ready, joinedAt }
        this.status = 'lobby'; // lobby, playing, ended
        this.questions = [];
        this.currentQuestionIndex = 0;
        this.questionTimer = null;
        this.startTime = null;
        this.gameLength = 0; // Not used yet, maybe purely level based
        this.level = 1;
        this.maxLevels = 3;

        // Config
        this.waitingTime = 60; // seconds to start after first ready? Or just 1 minute countdown
        this.lobbyTimer = null;
    }

    addPlayer(socket, name) {
        if (this.status !== 'lobby') {
            socket.emit('error', 'Game in progress');
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
        let timeLeft = 60; // 1 minute
        this.io.emit('lobby_timer_start', timeLeft);

        this.lobbyTimer = setInterval(() => {
            timeLeft--;
            if (timeLeft > 0) {
                this.io.emit('lobby_timer_tick', timeLeft);
            } else {
                clearInterval(this.lobbyTimer);
                this.lobbyTimer = null;
                this.startGame();
            }
        }, 1000);
    }

    generateQuestions() {
        // Generate simple questions for now
        // Level 1: 3 questions
        // Level 2: 3 questions
        // Level 3: 3 questions
        // Total 9 questions for quick game

        const qs = [];

        // Helper to get random item
        const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];
        const randKey = (obj) => {
            const keys = Object.keys(obj);
            return keys[Math.floor(Math.random() * keys.length)];
        };


        // Level 1: Find Region
        for (let i = 0; i < 3; i++) {
            const target = rand(regions);
            qs.push({
                level: 1,
                text: `Dove si trova la regione **${target}**?`,
                target: target,
                attempts: {} // socketId -> count
            });
        }

        // Level 2: Region of Capital
        for (let i = 0; i < 3; i++) {
            const capital = randKey(capitals);
            const region = capitals[capital];
            qs.push({
                level: 2,
                text: `In quale regione si trova **${capital}**?`,
                target: region,
                attempts: {}
            });
        }

        // Level 3: Region of Province
        for (let i = 0; i < 3; i++) {
            const prov = randKey(provinces);
            const region = provinces[prov];
            qs.push({
                level: 3,
                text: `In quale regione si trova la provincia di **${prov}**?`,
                target: region,
                attempts: {}
            });
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

        this.io.emit('game_start', { players: this.players });
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

        this.io.emit('new_question', {
            index: this.currentQuestionIndex + 1,
            total: this.questions.length,
            text: q.text,
            level: q.level
        });
    }

    handleAnswer(socketId, regionName) {
        if (this.status !== 'playing') return;

        const q = this.questions[this.currentQuestionIndex];
        const player = this.players[socketId];
        if (!player) return;

        // Check if player already solved it?
        // "Il giocatore che indovina avrà X punti..."
        // "Dopo 3 tentativi si passa alla domanda successiva" -> This implies attempts are per player or global?
        // "Il sistema dovrà proporre dei nomi... e gli utenti dovranno trovarli"

        // Usually multiplayer geo games: everyone tries to answer the SAME question.
        // DOES EVERYONE need to answer? Or does the question end when someone answers?
        // "Il giocatore più veloce ottiene 3 punti in più" -> implies multiple people can answer.
        // "Dopo 3 tentativi si passa alla domanda successiva" -> This is ambiguous. 
        // Is it 3 attempts per player? Or 3 attempts TOTAL for the group?
        // Giving the competitive nature, usually everyone plays parallely.
        // Let's assume: Everyone has to answer. When everyone answers OR timeout? 
        // Or maybe "3 tentativi" refers to the player's personal lives for that question.

        // INTERPRETATION:
        // GLOBAL FLOW: Question is shown.
        // EACH PLAYER: Tries to click region.
        // IF CORRECT: Gets points (3, 2, 1 based on attempt). Max 3 attempts.
        // IF FASTEST (Global): +3 bonus points.
        // WHEN DO WE MOVE ON? When everyone finished or max time?
        // Let's add a max time per question e.g. 10-15 seconds or when everyone is done.

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

            // Speed bonus
            if (q.solvedBy.length === 1) {
                points += 3; // First one!
                this.io.emit('player_message', { id: socketId, msg: 'Fastest!' });
            }

            player.score += points;

            this.io.to(socketId).emit('answer_result', { correct: true, score: player.score, pointsAdded: points });
            this.io.emit('plater_update', { id: socketId, score: player.score });

            this.checkQuestionEnd();
        } else {
            // Wrong
            this.io.to(socketId).emit('answer_result', { correct: false, attemptsLeft: 3 - attemptNum });
            if (attemptNum >= 3) {
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
        this.io.emit('game_over', { players: this.players });
        // Reset after some time?
        setTimeout(() => this.resetGame(), 10000);
    }

    resetGame() {
        this.status = 'lobby';
        this.players = {};
        this.questions = [];
        if (this.lobbyTimer) clearInterval(this.lobbyTimer);
        this.lobbyTimer = null;
        this.io.emit('reset');
    }

    broadcastLobbyState() {
        this.io.emit('lobby_state', { players: this.players });
    }
}

module.exports = GameManager;
