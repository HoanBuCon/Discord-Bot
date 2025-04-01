export interface IBaseData {
    userId: string;
    guildId: string;
    messageId?: string;
    channelId?: string;
}

export interface BanData extends IBaseData {
    unbanTime: number;
    executorId?: string;
}

export interface MuteData extends IBaseData {
    unmuteTime: number;
    executorId?: string;
}

export interface TictactoeData {
    userId1: string;
    userId2: string;
    guildId: string;
    messageId?: string;
    channelId?: string;
    player1Tag: string;
    player2Tag: string;
    boardSize: number;
    status: boolean;
}

export class DataInterfaces {
    static validateBanData(data: BanData): boolean {
        return !!data.userId && !!data.guildId && data.unbanTime > 0;
    }

    static validateMuteData(data: MuteData): boolean {
        return !!data.userId && !!data.guildId && data.unmuteTime > 0;
    }

    static validateTictactoeData(data: TictactoeData): boolean {
        return (
            !!data.userId1 &&
            !!data.userId2 &&
            !!data.guildId &&
            data.boardSize > 0 &&
            typeof data.status === 'boolean'
        );
    }
}