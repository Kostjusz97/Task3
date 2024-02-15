const crypto = require('crypto');
const readline = require('readline-sync');

class GameRules {
    constructor(moves) {
        this.moves = moves;
        this.rules = this.generateRules();
    }

    generateRules() {
        const numMoves = this.moves.length;
        const rules = Array.from({ length: numMoves }, () => Array(numMoves).fill('Draw'));

        for (let i = 0; i < numMoves; i++) {
            const winMoves = Array.from({ length: numMoves / 2 }, (_, j) => (i + j + 1) % numMoves);
            const loseMoves = Array.from({ length: numMoves / 2 }, (_, j) => (i - j - 1 + numMoves) % numMoves);

            winMoves.forEach((winMove) => (rules[i][winMove] = 'Win'));
            loseMoves.forEach((loseMove) => (rules[i][loseMove] = 'Lose'));
        }

        return rules;
    }

    getOutcome(userMove, computerMove) {
        return this.rules[userMove][computerMove];
    }
}

class KeyGenerator {
    generateKey() {
        return crypto.randomBytes(32).toString('hex');
    }
}

class HMACGenerator {
    generateHMAC(key, message) {
        const hmac = crypto.createHmac('sha256', key);
        hmac.update(message);
        return hmac.digest('hex');
    }
}

class Game {
    constructor(moves) {
        this.moves = moves;
        this.gameRules = new GameRules(moves);
        this.keyGenerator = new KeyGenerator();
        this.hmacGenerator = new HMACGenerator();
    }

    play() {
        const computerMove = Math.floor(Math.random() * this.moves.length);
        const key = this.keyGenerator.generateKey();
        const hmac = this.hmacGenerator.generateHMAC(key, this.moves[computerMove]);

        console.log(`HMAC: ${hmac}`);
        this.displayMenu();

        const userMove = this.getUserMove();
        if (userMove === -1) return;

        console.log(`Your move: ${this.moves[userMove]}`);
        console.log(`Computer move: ${this.moves[computerMove]}`);

        const outcome = this.gameRules.getOutcome(userMove, computerMove);
        if (outcome === 'Win') {
            console.log('You win!');
        } else if (outcome === 'Lose') {
            console.log('You lose!');
        } else {
            console.log('It\'s a draw!');
        }

        console.log(`HMAC key: ${key}`);
    }

    displayMenu() {
        console.log('Available moves:');
        this.moves.forEach((move, index) => console.log(`${index + 1} - ${move}`));
        console.log('0 - exit');
        console.log('? - help');
    }

    getUserMove() {
        let userMove = -1;

        while (userMove === -1) {
            const userInput = readline.question('Enter your move: ');

            if (userInput === '0') {
                console.log('Exiting the game.');
                return -1;
            } else if (userInput === '?') {
                this.displayHelp();
            } else {
                userMove = parseInt(userInput, 10) - 1;

                if (isNaN(userMove) || userMove < 0 || userMove >= this.moves.length) {
                    console.log('Invalid move. Please try again.');
                    userMove = -1;
                }
            }
        }

        return userMove;
    }

    getColumnWidths(table) {
        const columnWidths = Array.from({ length: table[0].length }, () => 0);

        table.forEach((row) => {
            row.forEach((cell, columnIndex) => {
                columnWidths[columnIndex] = Math.max(columnWidths[columnIndex], cell.length);
            });
        });

        return columnWidths;
    }

    displayHelp() {
        console.log('Help:');
        const header = [''].concat(this.moves.map((move) => move.charAt(0).toUpperCase() + move.slice(1)));
        const table = [header].concat(this.gameRules.rules.map((row, index) => [this.moves[index].charAt(0).toUpperCase() + this.moves[index].slice(1)].concat(row)));
        const columnWidths = this.getColumnWidths(table);

        table.forEach((row) => {
            let rowString = '';
            row.forEach((cell, columnIndex) => {
                rowString += cell.padEnd(columnWidths[columnIndex] + 5, ' '); 
            });
            console.log(rowString);
        });
    }
}

const moves = process.argv.slice(2);

if (moves.length < 3 || moves.length % 2 !== 1 || new Set(moves).size !== moves.length) {
    console.error('Invalid input. Please provide an odd number of unique moves.');
} else {
    const game = new Game(moves);
    game.play();
}
