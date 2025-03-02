import { ChatInputCommandInteraction, Message, PermissionsBitField, GuildMember } from 'discord.js';
import { Command } from '../Command';
import { PermissionUtils } from '../../utils/PermissionUtils';
import { TictactoeDataManager } from '../../utils/TictactoeDataManager';
import { TictactoeGameplay } from '../../utils/TictactoeGameplay';

export class TictactoeCommand extends Command {
    constructor() {
        super('tictactoe', 'Gạ kèo solo TicTacToe với một đứa');
    }

    async execute(interactionOrMessage: ChatInputCommandInteraction | Message, args?: string[]): Promise<void> {
        const permissions = new PermissionUtils(interactionOrMessage, args);
        const guild = interactionOrMessage.guild;
        let member: GuildMember | null;

        // Xac dinh doi tuong thuc thi lenh
        if (interactionOrMessage instanceof Message)
            member = interactionOrMessage.member;
        else
            member = interactionOrMessage.member as GuildMember;

        // Xac dinh nguoi dung lenh
        let authorPlayer;
        if (interactionOrMessage instanceof Message)
            authorPlayer = interactionOrMessage.author;
        else
            authorPlayer = interactionOrMessage.user;

        if (!guild || !member) {
            if (interactionOrMessage instanceof ChatInputCommandInteraction)
                await interactionOrMessage.reply({ content: '⚠️ Lệnh này chỉ hoạt động trong server.', ephemeral: true });
            else
                await interactionOrMessage.reply('⚠️ Lệnh này chỉ hoạt động trong server.');
            return;
        }

        // Xac dinh doi thu
        let targetPlayer = permissions.getMentionedUser(interactionOrMessage, args, true);
        if (!targetPlayer) {
            await interactionOrMessage.reply({ content: '⚠️ Hãy chỉ định một thành viên!', ephemeral: true });
            return;
        }

        if (targetPlayer.id === interactionOrMessage.client.user?.id) {
            await interactionOrMessage.reply({ content: '🚫 Gạ đứa khác đi dude, tôi đêl rảnh!', ephemeral: true });
            return;
        }

        const targetMember = await permissions.getMember(guild, targetPlayer.id);
        if (!targetMember) {
            await interactionOrMessage.reply({ content: '⚠️ Không tìm thấy thành viên!', ephemeral: true });
            return;
        }

        try {
            let replyMessageId: string | null = null;
            let replyChannelId: string | null = interactionOrMessage.channelId ?? null;
        
            let boardSize = 3;
            if (args && args[1] === "5") {
                boardSize = 5;
            }
        
            const gameInstance = new TictactoeGameplay(authorPlayer.id, targetPlayer.id, guild.id, interactionOrMessage.id, interactionOrMessage.channelId, boardSize);
            const initialBoard = gameInstance.getInitialBoard();
            const replyMessage = await interactionOrMessage.reply({ content: `✅ Bắt đầu Minigame Tic Tac Toe!\n${initialBoard}\nĐến lượt <@${authorPlayer.id}>!` });
            console.log(`✅ Bắt đầu Minigame Tic Tac Toe tại server ${guild.name}`);

            // Luu ID tin nhan
            if (interactionOrMessage instanceof ChatInputCommandInteraction) {
                const fetchedReply = await interactionOrMessage.fetchReply();
                replyMessageId = fetchedReply.id;
                replyChannelId = interactionOrMessage.channelId;
            } else if (interactionOrMessage instanceof Message) {
                replyMessageId = replyMessage.id;
                replyChannelId = interactionOrMessage.channel.id;
            }
        
            if (replyMessageId && replyChannelId) {
                TictactoeDataManager.saveTictactoeData(authorPlayer.id, targetPlayer.id, guild.id, replyMessageId, replyChannelId, boardSize);
                TictactoeDataManager.saveGameplayInstance(gameInstance, guild.id);
            }
        } catch (error) {
            console.error(`Lỗi khi bắt đầu Minigame:`, error);
            await interactionOrMessage.reply({ content: `🚫 Không thể bắt đầu Minigame Tic Tac Toe!` });
        }
        
    }
}