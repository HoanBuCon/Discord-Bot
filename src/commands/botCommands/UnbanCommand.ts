import { ChatInputCommandInteraction, Message, PermissionsBitField, GuildMember, Client, EmbedBuilder } from 'discord.js';
import { Command } from '../Command';
import { PermissionUtils } from '../../utils/PermissionUtils';
import { UnbanService } from '../../utils/UnbanService';

export class UnbanCommand extends Command {
    constructor() {
        super('unban', 'Gỡ Ban người dùng trong server');
    }

    async execute(interactionOrMessage: ChatInputCommandInteraction | Message, args?: string[]): Promise<void> {
        const permissions = new PermissionUtils(interactionOrMessage, args);
        const guild = interactionOrMessage.guild;
        let member: GuildMember | null;

        if (interactionOrMessage instanceof Message)
            member = interactionOrMessage.member;
        else
            member = interactionOrMessage.member as GuildMember;

        if (!guild || !member) {
            if (interactionOrMessage instanceof ChatInputCommandInteraction) {
                await interactionOrMessage.reply({ content: '⚠️ Lệnh này chỉ hoạt động trong server.', ephemeral: true });
            } else {
                await interactionOrMessage.reply('⚠️ Lệnh này chỉ hoạt động trong server.');
            }
            return;
        }

        if (!(await permissions.checkPermissions(member, PermissionsBitField.Flags.BanMembers))) {
            return;
        }

        const botPermissionError = permissions.validateBotPermissions(guild, PermissionsBitField.Flags.BanMembers);
        if (botPermissionError) {
            if (interactionOrMessage instanceof ChatInputCommandInteraction) {
                await interactionOrMessage.reply({ content: botPermissionError, ephemeral: true });
            } else {
                await interactionOrMessage.reply(botPermissionError);
            }
            return;
        }

        if (interactionOrMessage instanceof ChatInputCommandInteraction) {
            await UnbanService.handleUnbanCommand(interactionOrMessage, interactionOrMessage.client);
            return;
        }

        if (interactionOrMessage instanceof Message) {
            const isUnbanAll = args && args[0] === 'all';

            if (isUnbanAll) {
                const bans = await guild.bans.fetch();
                if (bans.size === 0) {
                    await interactionOrMessage.reply('🚫 Không có người dùng nào bị Ban trong server.');
                    return;
                }

                let successCount = 0;
                for (const ban of bans.values()) {
                    try {
                        await UnbanService.unbanUser(interactionOrMessage.client, ban.user.id, guild.id, undefined, true);
                        successCount++;
                    } catch (error) {
                        console.error(`⚠️ Lỗi khi Unban ${ban.user.id}:`, error);
                    }
                }
                await interactionOrMessage.reply(`✅ Đã Unban thành công ${successCount}/${bans.size} người dùng! 🔓`);
                return;
            }

            const userId = args && args[0];

            if (!userId) {
                try {
                    const embed = await UnbanService.createBannedListEmbed(guild);
                    await interactionOrMessage.reply({ embeds: [embed] });
                    return;
                } catch (error) {
                    console.error('Lỗi khi lấy danh sách Ban:', error);
                    await interactionOrMessage.reply('⚠️ Không thể lấy danh sách người bị Ban!');
                    return;
                }
            }

            if (!/^\d{17,19}$/.test(userId)) {
                await interactionOrMessage.reply('⚠️ ID người dùng không hợp lệ!');
                return;
            }

            const ban = await guild.bans.fetch(userId).catch(() => null);
            if (!ban) {
                await interactionOrMessage.reply(`🚫 Người dùng với ID ${userId} không bị Ban!`);
                return;
            }

            try {
                await UnbanService.unbanUser(interactionOrMessage.client, userId, guild.id, undefined, true);
                await interactionOrMessage.reply(`✅ Đã Unban người dùng với ID: ${userId}! 🔓`);
            } catch (error) {
                console.error('Lỗi khi Unban:', error);
                await interactionOrMessage.reply('⚠️ Lỗi khi thực hiện Unban!');
            }
        }
    }
}