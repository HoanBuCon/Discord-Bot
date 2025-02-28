import { TictactoeGameplay } from './TictactoeGameplay';

import fs from 'fs';
import path from 'path';

const TICTACTOE_DATA_PATH = path.resolve(__dirname, '../commands/botCommands/dataFiles/commandData/tictactoeData.json');

export interface TictactoeData {
    userId1: string;
    userId2: string;
    guildId: string;
    messageId?: string;
    channelId?: string;
    boardSize: number;
    status: boolean;
}

export class TictactoeDataManager {
    private static activeGames: Map<string, TictactoeGameplay> = new Map();
    private static games: Record<string, any> = {};

    static saveGameplayInstance(game: TictactoeGameplay, guildId: string) {
        this.activeGames.set(guildId, game);
    }

    static getGameplayInstance(guildId: string): TictactoeGameplay | undefined {
        return this.activeGames.get(guildId);
    }

    static removeGameplayInstance(guildId: string): void {
        this.activeGames.delete(guildId);
    
        const games = this.getGames();
        if (games[guildId]) {
            delete games[guildId];
            this.writeGames(games);
        }
    }

    static saveGamesToFile(): void {
        fs.writeFileSync('tictactoe_games.json', JSON.stringify(this.games, null, 2));
    }

    static getGames(): Record<string, Record<string, TictactoeData>> {
        if (!fs.existsSync(TICTACTOE_DATA_PATH)) return {};

        try {
            const data = fs.readFileSync(TICTACTOE_DATA_PATH, 'utf-8').trim();
            return data ? JSON.parse(data) : {};
        } catch (error) {
            console.error('⚠️ Lỗi đọc file tictactoeData.json', error);
            return {};
        }
    }

    static writeGames(games: Record<string, Record<string, TictactoeData>>): void {
        try {
            fs.writeFileSync(TICTACTOE_DATA_PATH, JSON.stringify(games, null, 2));
            console.log('✅ Dữ liệu TicTacToe đã được cập nhật.');
        } catch (error) {
            console.error('⚠️ Lỗi khi ghi vào tictactoeData.json:', error);
        }
    }

    static saveTictactoeData(userId1: string, userId2: string, guildId: string, messageId: string, channelId: string, boardSize: number): void {
        const games = this.getGames();

        if (!games[guildId]) {
            games[guildId] = {};
        }

        const gameId = `${userId1}-${userId2}`;
        games[guildId][gameId] = { userId1, userId2, guildId, messageId, channelId, boardSize, status: true };

        this.writeGames(games);
    }

    static removeTictactoeData(userId1: string, userId2: string, guildId: string): void {
        const games = this.getGames();
        const gameId = `${userId1}-${userId2}`;

        if (games[guildId] && games[guildId][gameId]) {
            delete games[guildId][gameId];

            if (Object.keys(games[guildId]).length === 0) {
                delete games[guildId];
            }
            
            this.writeGames(games);
        }
    }

    static clearAllData(): void {
        this.activeGames.clear();
        try {
            let currentData = {};
            if (fs.existsSync(TICTACTOE_DATA_PATH)) {
                const fileContent = fs.readFileSync(TICTACTOE_DATA_PATH, 'utf-8').trim();
                let currentData;
                if (fileContent)
                    currentData = JSON.parse(fileContent);
                else
                    currentData = {};
            }
    
            fs.writeFileSync(TICTACTOE_DATA_PATH, JSON.stringify({}, null, 2));
    
            if (Object.keys(currentData).length > 0) {
                console.log('✅ Đã xóa toàn bộ dữ liệu TicTacToe trong file JSON.');
            }
        } catch (error) {
            console.error('⚠️ Lỗi khi xóa dữ liệu TicTacToe:', error);
        }
    }

    static getGameByUser(userId: string, guildId: string): TictactoeData | null {
        const games = this.getGames();
        if (!games[guildId]) return null;
    
        for (const gameId in games[guildId]) {
            const game = games[guildId][gameId];
            if (game.userId1 === userId || game.userId2 === userId) {
                return game;
            }
        }
    
        return null;
    }
}