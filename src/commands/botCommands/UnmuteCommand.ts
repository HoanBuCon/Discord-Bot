import { ChatInputCommandInteraction, Message, PermissionsBitField, Guild, GuildMember, Client, Role, EmbedBuilder } from 'discord.js';
import { Command } from '../Command';
import { PermissionUtils } from '../../utils/PermissionUtils';
import { UnmuteService } from '../../utils/UnmuteService';
import { MuteDataManager } from '../../utils/MuteDataManager';
import fs from 'fs';
import path from 'path';

const MUTED_USERS_PATH = path.resolve(__dirname, '../dataFiles/commandData/mutedUsers.json');

export class UnmuteCommand extends Command {
    constructor() {
        super('unmute', 'Gỡ Mute người dùng trong server');
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

        if (!guild || !member) {
            if (interactionOrMessage instanceof ChatInputCommandInteraction)
                await interactionOrMessage.reply({ content: '⚠️ Lệnh này chỉ hoạt động trong server.', ephemeral: true });
            else
                await interactionOrMessage.reply('⚠️ Lệnh này chỉ hoạt động trong server.');
            return;
        }

        if (!(await permissions.checkPermissions(member, PermissionsBitField.Flags.MuteMembers))) {
            // Ban khong co quyen su dung lenh nay
            return;
        }

        const botPermissionError = permissions.validateBotPermissions(guild, PermissionsBitField.Flags.MuteMembers);
        if (botPermissionError) {
            await interactionOrMessage.reply({ content: botPermissionError, ephemeral: true });
            return;
        }

        let isUnmuteAll = false;
        if (interactionOrMessage instanceof Message && args && args[0] === 'all')
            isUnmuteAll = true;
        else if (interactionOrMessage instanceof ChatInputCommandInteraction && interactionOrMessage.options.getString('user') === 'all')
            isUnmuteAll = true;

        if (isUnmuteAll) {
            try {
                await UnmuteService.unmuteAllUsersInGuild(interactionOrMessage.client, guild.id);
                await interactionOrMessage.reply('✅ Đã Unmute tất cả người dùng trong server! 🔊');
                return;
            } catch (error) {
                console.error('Lỗi khi unmute tất cả:', error);
                await interactionOrMessage.reply({ content: '⚠️ Lỗi khi thực hiện unmute tất cả!', ephemeral: true });
                return;
            }
        }

        const targetUser = permissions.getMentionedUser(interactionOrMessage, args, true);

        if (!targetUser) {
            try {
                const mutedUsers = MuteDataManager.getMutedUsers();
                let guildMutedUsers: string[] = [];
                
                if (mutedUsers) {
                    guildMutedUsers = Object.entries(mutedUsers)
                        .filter(([_, guilds]) => guilds[guild.id])
                        .map(([userId, _]) => userId);
                }

                if (guildMutedUsers.length === 0) {
                    await interactionOrMessage.reply({ content: '⚠️ Hiện tại không có ai bị Mute trong server này!', ephemeral: true });
                    return;
                }

                const muteList = await Promise.all(guildMutedUsers.map(async (userId) => {
                    const member = await guild.members.fetch(userId).catch(() => null);
                    let response;
                
                    if (member)
                        response = `<@${userId}> (\`${member.user.tag}\`)`;
                    else
                        response = `(Không còn trong server) (ID: **${userId}**)`;
                
                    return response;
                }));
                
                let description;
                
                if (muteList.join('\n').length > 4000)
                    description = muteList.join('\n').slice(0, 4000) + '...';
                else
                    description = muteList.join('\n');
                
                const embed = new EmbedBuilder()
                    .setTitle('📋 Danh sách thành viên bị Mute')
                    .setDescription(description)
                    .setColor(0x00ff00)
                    .setFooter({ 
                        text: 'Dùng lệnh sau để gỡ mute:\n🔹Lệnh Slash: /unmute @user\n🔹Lệnh Prefix: 69!unmute @user' 
                    });

                await interactionOrMessage.reply({ embeds: [embed], ephemeral: true });
                return;
            } catch (error) {
                console.error('Lỗi khi lấy danh sách mute:', error);
                await interactionOrMessage.reply({ content: '⚠️ Không thể lấy danh sách người bị Mute!', ephemeral: true });
                return;
            }
        }

        if (targetUser && targetUser.id === interactionOrMessage.client.user?.id) {
            await interactionOrMessage.reply({ content: '🚫 Bro muốn tôi tự vả hả? 🤡', ephemeral: true });
            return;
        }

        const targetMember = await permissions.getMember(guild, targetUser.id);
        if (!targetMember) {
            await interactionOrMessage.reply({ content: '⚠️ Không tìm thấy thành viên!', ephemeral: true });
            return;
        }

        const targetError = permissions.validateTarget(member, targetMember, 'unmute');
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

            if (!targetMember.roles.cache.has(muteRole.id)) {
                await interactionOrMessage.reply({ content: `🚫 ${targetUser} không bị Mute!`, ephemeral: true });
                return;
            }

            await UnmuteService.unmuteUser(interactionOrMessage.client as Client, targetUser.id, guild.id, undefined, true);
            await interactionOrMessage.reply(`✅ ${targetUser} đã được Unmute! 🔊`);
        } catch (error) {
            console.error('Lỗi khi unmute:', error);
            await interactionOrMessage.reply({ content: '⚠️ Lỗi khi thực hiện Unmute!', ephemeral: true });
        }
    }

    private async getMuteRole(guild: Guild): Promise<Role | null> {
        let muteRole = guild.roles.cache.find(role => role.name.toLowerCase() === 'muted');

        if (!muteRole) {
            console.error('⚠️ Không tìm thấy role "Muted"!');
            return null;
        }

        return muteRole;
    }
}