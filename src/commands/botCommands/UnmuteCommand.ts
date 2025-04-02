import { ChatInputCommandInteraction, Message, PermissionsBitField, GuildMember, Client } from 'discord.js';
import { Command } from '../Command.ts';
import { MuteCommand } from './MuteCommand.ts';
import { PermissionUtils } from '../../utils/PermissionUtils.ts';
import { UnmuteService } from '../../utils/UnmuteService.ts';
import { MuteDataManager } from '../../utils/MuteDataManager.ts';

export class UnmuteCommand extends Command {
    constructor() {
        super('unmute', 'Gỡ Mute người dùng trong server');
    }

    async execute(interactionOrMessage: ChatInputCommandInteraction | Message, args?: string[]): Promise<void> {
        const permissions = new PermissionUtils(interactionOrMessage, args);
        const guild = interactionOrMessage.guild;
        const client: Client = interactionOrMessage.client;
        let member: GuildMember | null;

        // Xac dinh doi tuong thuc thi lenh
        if (interactionOrMessage instanceof Message)
            member = interactionOrMessage.member;
        else
            member = interactionOrMessage.member as GuildMember;

        if (!guild || !member) {
            if (interactionOrMessage instanceof ChatInputCommandInteraction)
                await interactionOrMessage.reply({ content: '⚠️ Lệnh này chỉ hoạt động trong server.', flags: 64 });
            else
                await interactionOrMessage.reply('⚠️ Lệnh này chỉ hoạt động trong server.');
            return;
        }

        // Cum dieu kien kiem tra quyen han
        if (!(await permissions.checkPermissions(member, PermissionsBitField.Flags.MuteMembers))) {
            return;
        }

        const botPermissionError = permissions.validateBotPermissions(guild, PermissionsBitField.Flags.MuteMembers);
        if (botPermissionError) {
            if (interactionOrMessage instanceof ChatInputCommandInteraction)
                await interactionOrMessage.reply({ content: botPermissionError, flags: 64 });
            else
                await interactionOrMessage.reply(botPermissionError);
            return;
        }

        if (interactionOrMessage instanceof ChatInputCommandInteraction) {
            await UnmuteService.handleUnmuteCommand(interactionOrMessage, interactionOrMessage.client);
            return;
        }

        if (interactionOrMessage instanceof Message) {
            const isUnmuteAll = args && args[0] === 'all';

            if (isUnmuteAll) {
                const mutedUsers = MuteDataManager.getMutedUsers();
                const muteCommandInstance = new MuteCommand();
                const muteRole = await muteCommandInstance.getMuteRole(guild);
            
                let usersInGuildFromJson: string[] = [];
                if (mutedUsers) {
                    usersInGuildFromJson = Object.entries(mutedUsers)
                        .filter(([_, guilds]) => guilds[guild.id])
                        .map(([userId, _]) => userId);
                }
            
                let usersInGuildFromRole: string[] = [];
                if (muteRole) {
                    const membersWithMuteRole = guild.members.cache.filter(member => member.roles.cache.has(muteRole.id));
                    usersInGuildFromRole = membersWithMuteRole.map(member => member.id);
                }
            
                const usersInGuild = Array.from(new Set([...usersInGuildFromJson, ...usersInGuildFromRole]));
            
                if (usersInGuild.length === 0) {
                    await interactionOrMessage.reply('🚫 Không có người dùng nào bị Mute trong server.');
                    return;
                }
            
                let successCount = 0;
                for (const userId of usersInGuild) {
                    const muteData = mutedUsers[userId]?.[guild.id];
                    try {
                        await UnmuteService.unmuteUser(client, userId, guild.id, muteData, true);
                        successCount++;
                    } catch (error) {
                        console.error(`⚠️ Lỗi khi Unmute ${userId}:`, error);
                        throw error;
                    }
                }
                await interactionOrMessage.reply(`✅ Đã Unmute thành công ${successCount}/${usersInGuild.length} người dùng trong server ${guild.name}! 🔊`);
                return;
            }

            const targetUser = permissions.getMentionedUser(interactionOrMessage, args, true);

            if (!targetUser) {
                try {
                    const embed = await UnmuteService.createMutedListEmbed(guild);
                    await interactionOrMessage.reply({ embeds: [embed] });
                    return;
                } catch (error) {
                    console.error('Lỗi khi lấy danh sách Mute:', error);
                    await interactionOrMessage.reply('⚠️ Không thể lấy danh sách người bị Mute!');
                    return;
                }
            }

            if (targetUser.id === interactionOrMessage.client.user?.id) {
                await interactionOrMessage.reply('🚫 Bro muốn tôi tự vả hả? 🤡');
                return;
            }

            const targetMember = await permissions.getMember(guild, targetUser.id);
            if (!targetMember) {
                await interactionOrMessage.reply('⚠️ Không tìm thấy thành viên!');
                return;
            }

            const targetError = permissions.validateTarget(member, targetMember, 'unmute');
            if (targetError) {
                await interactionOrMessage.reply(targetError);
                return;
            }

            if (!MuteDataManager.isUserMuted(targetUser.id, guild.id, client)) {
                await interactionOrMessage.reply(`🚫 ${targetUser} không bị Mute!`);
                return;
            }

            try {
                await UnmuteService.unmuteUser(interactionOrMessage.client, targetUser.id, guild.id, undefined, true);
                await interactionOrMessage.reply(`✅ ${targetUser} đã được Unmute! 🔊`);
            } catch (error) {
                console.error('Lỗi khi Unmute:', error);
                await interactionOrMessage.reply('⚠️ Lỗi khi thực hiện Unmute!');
                throw error;
            }
        }
    }
}