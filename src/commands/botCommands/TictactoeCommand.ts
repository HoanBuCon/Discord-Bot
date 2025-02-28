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
        let member: GuildMember | null = null;

        let authorPlayer;

        if (interactionOrMessage instanceof Message) {
            authorPlayer = interactionOrMessage.author;
        } else {
            authorPlayer = interactionOrMessage.user;
        }

        if ('member' in interactionOrMessage) {
            member = interactionOrMessage.member as GuildMember;
        }

        if (!guild || !member) {
            await interactionOrMessage.reply({ content: '🚫 Lệnh này chỉ hoạt động trong server.', ephemeral: true });
            return;
        }

        let targetPlayer = permissions.getMentionedUser(interactionOrMessage, args, true);

        if (!targetPlayer) {
            await interactionOrMessage.reply({ content: '⚠️ Hãy chỉ định một thành viên!', ephemeral: true });
            return;
        }

        if (targetPlayer.id === interactionOrMessage.client.user?.id) {
            await interactionOrMessage.reply({ content: '🚫 Gạ đứa khác đi dude, tôi đêl rảnh!', ephemeral: true });
            return;
        }

        if (targetPlayer.bot) {
            await interactionOrMessage.reply({ content: '🚫 Gạ kèo với human đi anh bạn, đồng bọn tôi đêl rảnh!', ephemeral: true});
            return;
        }

        if (targetPlayer.id === authorPlayer.id) {
            await interactionOrMessage.reply({ content: '🚫 Bạn không thể gạ kèo chính mình!', ephemeral: true });
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

            const replyMessage = await interactionOrMessage.reply({ content: `✅ Bắt đầu Minigame Tic Tac Toe!` });
            console.log(`✅ Bắt đầu Minigame Tic Tac Toe tại server ${guild.name}`);

            if (interactionOrMessage instanceof ChatInputCommandInteraction) {
                const fetchedReply = await interactionOrMessage.fetchReply();
                replyMessageId = fetchedReply.id;
                replyChannelId = interactionOrMessage.channelId;
            } else if (interactionOrMessage instanceof Message) {
                replyMessageId = replyMessage.id;
                replyChannelId = interactionOrMessage.channel.id;
            }

            if (replyMessageId && replyChannelId) {
                let boardSize = args?.[1] === "5" ? 5 : 3;
            
                TictactoeDataManager.saveTictactoeData(authorPlayer.id, targetPlayer.id, guild.id, replyMessageId, replyChannelId, boardSize);
            
                const gameInstance = new TictactoeGameplay(authorPlayer.id, targetPlayer.id, guild.id, replyMessageId, replyChannelId, boardSize);
                TictactoeDataManager.saveGameplayInstance(gameInstance, guild.id);
            }
        } catch (error) {
            console.error(`Lỗi khi bắt đầu Minigame:`, error);
            await interactionOrMessage.reply({ content: `🚫 Không thể bắt đầu Minigame Tic Tac Toe!` })
        }
    }
}