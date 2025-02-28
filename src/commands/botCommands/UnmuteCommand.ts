import { ChatInputCommandInteraction, Message, PermissionsBitField, Guild, GuildMember, Client, Role } from 'discord.js';
import { Command } from '../Command';
import { PermissionUtils } from '../../utils/PermissionUtils';
import { UnmuteService } from '../../utils/UnmuteService';
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
        let member: GuildMember | null = null;

        if ('member' in interactionOrMessage) {
            member = interactionOrMessage.member as GuildMember;
        }

        if (!guild || !member) {
            await interactionOrMessage.reply({ content: '🚫 Lệnh này chỉ hoạt động trong server.', ephemeral: true });
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

        const targetUser = permissions.getMentionedUser(interactionOrMessage, args, true);
        if (!targetUser) {
            await interactionOrMessage.reply({ content: '⚠️ Hãy chỉ định một thành viên!', ephemeral: true });
            return;
        }

        if (targetUser.id === interactionOrMessage.client.user?.id) {
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