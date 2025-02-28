import { Message, TextChannel } from 'discord.js';
import { TictactoeDataManager } from './TictactoeDataManager';

export class TictactoeGameplay {
    private board: number[][];
    private currentPlayer: string;
    private player1: string;
    private player2: string;
    private guildId: string;
    private channelId: string;
    private messageId: string;
    private boardSize: number;
    private winCondition: number;
    private static games: Record<string, TictactoeGameplay>;
    static {
        this.games = {};
    }

    constructor(player1: string, player2: string, guildId: string, messageId: string, channelId: string, boardSize: number = 3) {
        this.player1 = player1;
        this.player2 = player2;
        this.guildId = guildId;
        this.channelId = channelId;
        this.messageId = messageId;
        this.currentPlayer = player1;
        this.boardSize = boardSize;
        if (boardSize === 5) {
            this.boardSize = 5;
        }
        this.winCondition = this.boardSize;
        this.board = Array(this.boardSize).fill(null).map(() => Array(this.boardSize).fill(-1));
    }

    private renderBoard(): string {
        let display = `\`\`\`\n`;
        display += '   ' + [...Array(this.boardSize).keys()].join(' ') + '\n';
        this.board.forEach((row, i) => {
            display += `${i} `;
            row.forEach(cell => {
                if (cell === -1) display += '| ';
                else if (cell === 0) display += '|O';
                else if (cell === 1) display += '|X';
            });
            display += '|\n';
        });
        display += '```';
        return display;
    }

    getInitialBoard(): string {
        return this.renderBoard();
    }
    
    isPlayerTurn(playerId: string): boolean {
        return this.currentPlayer === playerId;
    }

    makeMove(playerId: string, row: number, col: number): { success: boolean; message: string } {
        if (playerId !== this.currentPlayer) {
            return { success: false, message: '🚫 Không phải lượt của bạn!' };
        }
        if (row < 0 || row >= this.boardSize || col < 0 || col >= this.boardSize) {
            return { success: false, message: `🚫 Vị trí không hợp lệ! Hãy chọn số từ 0 đến ${this.boardSize - 1}` };
        }
        if (this.board[row][col] !== -1) {
            return { success: false, message: '🚫 Vị trí này đã được đánh rồi!' };
        }
        this.board[row][col] = this.currentPlayer === this.player1 ? 1 : 0;
        return { success: true, message: `✅ Bạn đã đánh vào ô (${row}, ${col})!\n${this.renderBoard()}` };
    }

    switchTurn(): void {
        if (this.currentPlayer === this.player1)
            this.currentPlayer = this.player2;
        else
            this.currentPlayer = this.player1;

        console.log(`🔄 Đến lượt ${this.getCurrentPlayerMention()}`);
    }

    checkGameStatus(): { ended: boolean, message: string } {
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                if (this.board[row][col] !== -1 && this.checkWin(row, col)) {
                    return { ended: true, message: `🎉 <@${this.currentPlayer}> đã chiến thắng!` };
                }
            }
        }
        if (this.board.flat().every(cell => cell !== -1)) {
            return { ended: true, message: '🥶 Kết quả Hòa!' };
        }
        return { ended: false, message: '🔄 Tiếp tục trò chơi' };
    }

    checkWin(row: number, col: number): boolean {
        const player = this.board[row][col];
        if (player === -1) return false;
        const directions = [
            { dr: 0, dc: 1 },   //  →
            { dr: 1, dc: 0 },   //  ↓
            { dr: 1, dc: 1 },   //  ↘
            { dr: 1, dc: -1 }   //  ↙
        ];
        for (const { dr, dc } of directions) {
            let count = 1;
            for (let step = 1; step < this.winCondition; step++) {
                const r = row + dr * step;
                const c = col + dc * step;
                if (r >= 0 && r < this.boardSize && c >= 0 && c < this.boardSize && this.board[r][c] === player) {
                    count++;
                } else break;
            }
            for (let step = 1; step < this.winCondition; step++) {
                const r = row - dr * step;
                const c = col - dc * step;
                if (r >= 0 && r < this.boardSize && c >= 0 && c < this.boardSize && this.board[r][c] === player) {
                    count++;
                } else break;
            }
            if (count >= this.winCondition) return true;
        }
        return false;
    }

    getCurrentPlayerMention(): string {
        return `<@${this.currentPlayer}>`;
    }

    static clearGame(guildId: string): void {
        delete TictactoeGameplay.games[guildId];
    }
}