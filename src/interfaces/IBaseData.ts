export interface IBaseData {
    userId: string;
    guildId: string;
    messageId?: string;
    channelId?: string;
}

export interface BanData extends IBaseData {
    unbanTime: number;
<<<<<<< HEAD
=======
    executorId?: string;
>>>>>>> HBC
}

export interface MuteData extends IBaseData {
    unmuteTime: number;
<<<<<<< HEAD
=======
    executorId?: string;
>>>>>>> HBC
}

export interface TictactoeData {
    userId1: string;
    userId2: string;
    guildId: string;
    messageId?: string;
    channelId?: string;
<<<<<<< HEAD
=======
    player1Tag: string;
    player2Tag: string;
>>>>>>> HBC
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