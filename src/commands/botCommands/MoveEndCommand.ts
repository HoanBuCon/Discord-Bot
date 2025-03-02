import { ChatInputCommandInteraction, Message, GuildMember } from 'discord.js';
import { Command } from '../Command';
import { TictactoeDataManager } from '../../utils/TictactoeDataManager';

export class MoveCommand extends Command {
    constructor() {
        super('move', 'Đánh một nước đi đến tọa độ chỉ định trong Tic Tac Toe');
    }

    async execute(interactionOrMessage: ChatInputCommandInteraction | Message, args?: string[]): Promise<void> {
        const guild = interactionOrMessage.guild;
        let member: GuildMember | null;
        let x: number;
        let y: number;

        // Xac dinh doi tuong thuc thi lenh
        if (interactionOrMessage instanceof Message)
            member = interactionOrMessage.member;
        else
            member = interactionOrMessage.member as GuildMember;

        if (!guild || !member) {
            if (interactionOrMessage instanceof ChatInputCommandInteraction)
                await interactionOrMessage.reply({ content: '⚠️ Lệnh này chỉ hoạt động trong server.', ephemeral: true });
            else
                await interactionOrMessage.reply('⚠️ Lệnh này chỉ hoạt động trong server.');
            return;
        }
        const guildId = guild.id;
         
        if (interactionOrMessage instanceof Message) { // Neu la lenh Prefix
            if (!args || args.length < 2) {
                await interactionOrMessage.reply({ content: '⚠️ Hãy nhập nước đi theo prefix `69!move x y`' });
                return;
            }
            x = parseInt(args[0]);
            y = parseInt(args[1]);
        } else { // Neu la lenh Slash
            x = interactionOrMessage.options.getInteger('x', true);
            y = interactionOrMessage.options.getInteger('y', true);
        }

        if (isNaN(x) || isNaN(y) || x < 0 || y < 0) {
            await interactionOrMessage.reply({ content: '🚫 Nước đi không hợp lệ! X và Y phải là số nguyên không âm.', ephemeral: true });
            return;
        }

<<<<<<< HEAD
        const playerId = interactionOrMessage instanceof Message
            ? interactionOrMessage.author.id
            : interactionOrMessage.user.id;
=======
        // Lay ID nguoi choi
        let playerId: string;
        if (interactionOrMessage instanceof Message)
            playerId = interactionOrMessage.author.id;
        else
            playerId = interactionOrMessage.user.id;
>>>>>>> 819e7a8 (Refactor all commands in ./commands/botCommands)

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

        // Kiem tra trang thai của gameplay
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
        const guild = interactionOrMessage.guild;
        let member: GuildMember | null;

        if (interactionOrMessage instanceof Message)
            member = interactionOrMessage.member;
        else
            member = interactionOrMessage.member as GuildMember;

        if (!guild || !member) {
            if (interactionOrMessage instanceof ChatInputCommandInteraction)
                await interactionOrMessage.reply({ content: '⚠️ Lệnh này chỉ hoạt động trong server.', ephemeral: true });
            else
                await interactionOrMessage.reply('⚠️ Lệnh này chỉ hoạt động trong server.');
            return;
        }
        const guildId = guild.id;

        // Kiem tra xem co gameplay nao dang dien ra khong
        const gameInstance = TictactoeDataManager.getGameplayInstance(guildId);
        if (!gameInstance) {
            await interactionOrMessage.reply({ content: '⚠️ Không có ván chơi nào để dừng.', ephemeral: true });
            return;
        }

        TictactoeDataManager.removeGameplayInstance(guildId);
        await interactionOrMessage.reply({ content: '🛑 Trò chơi đã bị dừng!' });
    }
}
