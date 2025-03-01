import { ChatInputCommandInteraction, Message } from 'discord.js';
import { Command } from '../Command';
import { TictactoeDataManager } from '../../utils/TictactoeDataManager';

export class MoveCommand extends Command {
    constructor() {
        super('move', 'Đánh một nước đi đến tọa độ chỉ định trong Tic Tac Toe');
    }

    async execute(interactionOrMessage: ChatInputCommandInteraction | Message, args?: string[]): Promise<void> {
        let x: number;
        let y: number;
 
        if (interactionOrMessage instanceof Message) {
            if (!args || args.length < 2) {
                await interactionOrMessage.reply({ content: '⚠️ Hãy nhập nước đi theo prefix `69!move y x` hoặc slash `/move y x`' });
                return;
            }
            x = parseInt(args[0]);
            y = parseInt(args[1]);
        } else {
            x = interactionOrMessage.options.getInteger('x', true);
            y = interactionOrMessage.options.getInteger('y', true);
        }

        if (isNaN(x) || isNaN(y) || x < 0 || y < 0) {
            await interactionOrMessage.reply({ content: '🚫 Nước đi không hợp lệ! Y và X phải là số nguyên không âm.', ephemeral: true });
            return;
        }

        let playerId: string;

        if (interactionOrMessage instanceof Message)
            playerId = interactionOrMessage.author.id;
        else
            playerId = interactionOrMessage.user.id;

        const guildId = interactionOrMessage.guild?.id;
        if (!guildId) {
            await interactionOrMessage.reply({ content: '🚫 Lệnh này chỉ có thể dùng trong server.', ephemeral: true });
            return;
        }

        const gameInstance = TictactoeDataManager.getGameplayInstance(guildId);
        if (!gameInstance) {
            await interactionOrMessage.reply({ content: '⚠️ Không tìm thấy ván chơi nào đang diễn ra.', ephemeral: true });
            return;
        }

        if (!gameInstance.isPlayerTurn(playerId)) {
            await interactionOrMessage.reply({ content: '🚫 Không phải lượt của bạn!', ephemeral: true });
            return;
        }

        const moveResult = gameInstance.makeMove(playerId, x, y);
        if (!moveResult.success) {
            await interactionOrMessage.reply({ content: moveResult.message, ephemeral: true });
            return;
        }

        let responseMessage = moveResult.message;

        const gameStatus = gameInstance.checkGameStatus();
        if (gameStatus.ended) {
            responseMessage += `\n🎉 Trò chơi kết thúc! ${gameStatus.message}`;
            TictactoeDataManager.removeGameplayInstance(guildId);
        } else {
            gameInstance.switchTurn();
            responseMessage += `\n🔄 Đến lượt ${gameInstance.getCurrentPlayerMention()}!`;
        }

        await interactionOrMessage.reply({ content: responseMessage });
    }
}

export class EndTicTacToeCommand extends Command {
    constructor() {
        super('endtictactoe', 'Dừng ván chơi hiện tại');
    }

    async execute(interactionOrMessage: ChatInputCommandInteraction | Message): Promise<void> {
        const guildId = interactionOrMessage.guild?.id;
        if (!guildId) {
            await interactionOrMessage.reply({ content: '🚫 Lệnh này chỉ có thể dùng trong server.', ephemeral: true });
            return;
        }

        const gameInstance = TictactoeDataManager.getGameplayInstance(guildId);
        if (!gameInstance) {
            await interactionOrMessage.reply({ content: '⚠️ Không có ván chơi nào để dừng.', ephemeral: true });
            return;
        }

        TictactoeDataManager.removeGameplayInstance(guildId);
        await interactionOrMessage.reply({ content: '🛑 Trò chơi đã bị dừng!' });
    }
}
