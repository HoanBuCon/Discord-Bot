import { Client } from 'discord.js';
import type { BanData } from '../interfaces/IBaseData';
import fs from 'fs';
import path from 'path';

const BANNED_USERS_PATH = path.resolve(__dirname, '../commands/botCommands/dataFiles/commandData/bannedUsers.json');

export class BanDataManager {
    static isUserBanned(userId: string, guildId: string): boolean {
        const bannedUsers = this.getBannedUsers();
        return bannedUsers[userId]?.[guildId] !== undefined;
    }

    static getBannedUsers(): Record<string, Record<string, BanData>> {
        if (!fs.existsSync(BANNED_USERS_PATH))
            return {};

        try {
            const data = fs.readFileSync(BANNED_USERS_PATH, 'utf-8').trim();
            if (data)
                return JSON.parse(data);
            else
                return {};
        } catch (error) {
            console.error('⚠️ Lỗi đọc file bannedUsers.json:', error);
            return {};
        }
    }

    static saveBanData(userId: string, guildId: string, unbanTime: number, messageId?: string, channelId?: string): void {
        const bannedUsers = this.getBannedUsers();

        if (!userId || !guildId) {
            console.error('⚠️ Dữ liệu Ban không hợp lệ:', { userId, guildId, unbanTime });
            return;
        }

        if (!bannedUsers[userId]) {
            bannedUsers[userId] = {};
        }

        bannedUsers[userId][guildId] = { userId, guildId, unbanTime, messageId, channelId };
        this.writeBanData(bannedUsers);
    }

    static async removeBanData(userId: string, guildId: string, client: Client): Promise<{ messageId?: string; channelId?: string } | null> {
        const bannedUsers = this.getBannedUsers();

        const unbanData = bannedUsers[userId]?.[guildId];
        if (!unbanData) return null;

        const { messageId, channelId } = unbanData;

        delete bannedUsers[userId][guildId];
        if (Object.keys(bannedUsers[userId]).length === 0) {
            delete bannedUsers[userId];
        }

        this.writeBanData(bannedUsers);
        return { messageId, channelId };
    }

    private static writeBanData(bannedUsers: Record<string, Record<string, BanData>>): void {
        const dirPath = path.dirname(BANNED_USERS_PATH);

        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }

        try {
            if (Object.keys(bannedUsers).length === 0)
                fs.writeFileSync(BANNED_USERS_PATH, '{}');
            else
                fs.writeFileSync(BANNED_USERS_PATH, JSON.stringify(bannedUsers, null, 2));
        
            console.log('✅ Dữ liệu đã được cập nhật vào file bannedUsers.json.');
        } catch (error) {
            console.error('⚠️ Lỗi khi cập nhật file bannedUsers.json:', error);
            throw error;
        }
    }
}