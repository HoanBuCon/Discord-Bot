import { Client } from 'discord.js';
import fs from 'fs';
import path from 'path';

const MUTED_USERS_PATH = path.resolve(__dirname, '../commands/botCommands/dataFiles/commandData/mutedUsers.json');

export interface MuteData {
    userId: string;
    guildId: string;
    unmuteTime: number;
    messageId?: string;
    channelId?: string;
}

export class MuteDataManager {
    static isUserMuted(userId: string, guildId: string): boolean {
        const mutedUsers = this.getMutedUsers();
        return mutedUsers[userId]?.[guildId] !== undefined;
    }

    static getMutedUsers(): Record<string, Record<string, MuteData>> {
        if (!fs.existsSync(MUTED_USERS_PATH)) return {};
    
        try {
            const data = fs.readFileSync(MUTED_USERS_PATH, 'utf-8').trim();
            if (data)
                return JSON.parse(data);
            else
                return {};
        } catch (error) {
            console.error('⚠️ Lỗi đọc file mutedUsers.json:', error);
            return {};
        }
    }
    

    static saveMuteData(userId: string, guildId: string, unmuteTime: number, messageId?: string, channelId?: string): void {
        const mutedUsers = this.getMutedUsers();
    
        if (!userId || !guildId || !unmuteTime) {
            console.error('⚠️ Dữ liệu Mute không hợp lệ:', { userId, guildId, unmuteTime });
            return;
        }
    
        if (!mutedUsers[userId]) {
            mutedUsers[userId] = {};
        }
    
        mutedUsers[userId][guildId] = { userId, guildId, unmuteTime, messageId, channelId };
        this.writeMuteData(mutedUsers);
    }
    

    static async removeMuteData(userId: string, guildId: string, client: Client): Promise<{ messageId?: string; channelId?: string } | null> {
        let mutedUsers = this.getMutedUsers();
        
        const unmuteData = mutedUsers[userId]?.[guildId];
        if (!unmuteData)
            return null;
    
        const { messageId, channelId } = unmuteData;
        
        delete mutedUsers[userId][guildId];
        if (Object.keys(mutedUsers[userId]).length === 0)
            delete mutedUsers[userId];

        this.writeMuteData(mutedUsers);
        
        return { messageId, channelId };
    }

    private static writeMuteData(mutedUsers: Record<string, Record<string, MuteData>>): void {
        const dirPath = path.dirname(MUTED_USERS_PATH);
    
        if (!fs.existsSync(dirPath))
            fs.mkdirSync(dirPath, { recursive: true });

    
        try {
            if (Object.keys(mutedUsers).length === 0)
                fs.writeFileSync(MUTED_USERS_PATH, '{}');
            else
                fs.writeFileSync(MUTED_USERS_PATH, JSON.stringify(mutedUsers, null, 2));
            
                console.log('✅ Dữ liệu đã được cập nhật vào file mutedUsers.json.');
        } catch (error) {
            console.error('⚠️ Lỗi khi cập nhật file mutedUsers.json:', error);
        }
    }
}
