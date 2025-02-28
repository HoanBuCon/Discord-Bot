import { ChatInputCommandInteraction, Message, PermissionsBitField, Guild, GuildMember, Role, Client } from 'discord.js';
import { Command } from '../Command';
import { PermissionUtils } from '../../utils/PermissionUtils';
import { UnmuteService } from '../../utils/UnmuteService';
import { MuteDataManager } from '../../utils/MuteDataManager';

export class MuteCommand extends Command {
    constructor() {
        super('mute', 'Mute một thành viên.');
    }

    async execute(interactionOrMessage: ChatInputCommandInteraction | Message, args?: string[]): Promise<void> {
        const permissions = new PermissionUtils(interactionOrMessage, args);
        const guild = interactionOrMessage.guild;
        let member: GuildMember | null = null;

        if ('member' in interactionOrMessage) {
            member = interactionOrMessage.member as GuildMember;
        }

        if (!guild || !member) {
            await interactionOrMessage.reply({ content: '🚫 Lệnh này chỉ hoạt động trong server.', ephemeral: true });
            return;
        }

        if (!(await permissions.checkPermissions(member, PermissionsBitField.Flags.MuteMembers))) {
            return;
        }

        const botPermissionError = permissions.validateBotPermissions(guild, PermissionsBitField.Flags.MuteMembers);
        if (botPermissionError) {
            await interactionOrMessage.reply(botPermissionError);
            return;
        }

        const targetUser = permissions.getMentionedUser(interactionOrMessage, args, true);
        const duration = this.getDuration(interactionOrMessage, args) ?? 15;

        if (!targetUser) {
            await interactionOrMessage.reply({ content: '⚠️ Hãy chỉ định một thành viên!', ephemeral: true });
            return;
        }

        if (targetUser.id === interactionOrMessage.client.user?.id) {
            await interactionOrMessage.reply({ content: '🚫 Bro muốn tôi tự vả hả? 🤡', ephemeral: true });
            return;
        }

        if (duration <= 0) {
            await interactionOrMessage.reply({ content: '⚠️ Thời gian Mute không hợp lệ!', ephemeral: true });
            return;
        }

        const targetMember = await permissions.getMember(guild, targetUser.id);
        if (!targetMember) {
            await interactionOrMessage.reply({ content: '⚠️ Không tìm thấy thành viên!', ephemeral: true });
            return;
        }

        const targetError = permissions.validateTarget(member, targetMember, 'mute');
        if (targetError) {
            await interactionOrMessage.reply({ content: targetError, ephemeral: true });
            return;
        }

        try {
            const muteRole = await this.getMuteRole(guild);
            if (!muteRole) {
                await interactionOrMessage.reply({ content: '⚠️ Không tìm thấy role "Muted"!', ephemeral: true });
                return;
            }

            await targetMember.roles.add(muteRole);
            const unmuteTime = Date.now() + duration * 60 * 1000;

            let replyMessageId: string | null = null;
            let replyChannelId: string | null = interactionOrMessage.channelId ?? null;

            const replyMessage = await interactionOrMessage.reply({ content: `✅ Đã Mute ${targetUser} trong **${duration}** phút! 🔇` });
            console.log(`✅ Đã Mute ${targetUser.tag} tại server ${guild.name}`);

            if (interactionOrMessage instanceof ChatInputCommandInteraction) {
                const fetchedReply = await interactionOrMessage.fetchReply();
                replyMessageId = fetchedReply.id;
                replyChannelId = interactionOrMessage.channelId;
            } else if (interactionOrMessage instanceof Message) {
                replyMessageId = replyMessage.id;
                replyChannelId = interactionOrMessage.channel.id;
            }

            if (replyMessageId && replyChannelId) {
                MuteDataManager.saveMuteData(targetMember.id, guild.id, unmuteTime, replyMessageId, replyChannelId);
            }

            setTimeout(async () => {
                await UnmuteService.unmuteUser(interactionOrMessage.client as Client, targetMember.id, guild.id);
            }, duration * 60 * 1000);

        } catch (error) {
            console.error('Lỗi khi mute:', error);
            await interactionOrMessage.reply({ content: '🚫 Không thể mute thành viên này!', ephemeral: true });
        }
    }

    private getDuration(interactionOrMessage: ChatInputCommandInteraction | Message, args?: string[]): number | null {
        let duration: number | null = null;
        let input: string | null = null;
    
        if ('options' in interactionOrMessage) {
            input = interactionOrMessage.options.getString('duration', false);
        } else if (args && args.length > 1) {
            input = args[1];
        }
    
        if (!input) return 15;
    
        if (input.toLowerCase() === "inf") return null;
    
        const match = input.match(/^(\d+)([mhd])$/);
        if (match) {
            const value = parseInt(match[1], 10);
            const unit = match[2];
    
            switch (unit) {
                case 'm': return value;
                case 'h': return value * 60;
                case 'd': return value * 24 * 60;
            }
        }
    
        return 15;
    }

    private async getMuteRole(guild: Guild): Promise<Role | null> {
        const muteRole = guild.roles.cache.find(role => role.name.toLowerCase() === 'muted');
        return muteRole || null;
    }
}