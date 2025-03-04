import { ChatInputCommandInteraction, Message, PermissionsBitField, GuildMember, MessageFlags } from 'discord.js';
import { Command } from '../Command';
import { PermissionUtils } from '../../utils/PermissionUtils';

export class KickCommand extends Command {
    constructor() {
        super('kick', 'Kick người dùng khỏi server');
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

        // Cum dieu kien kiem tra quyen han
        if (!(await permissions.checkPermissions(member, PermissionsBitField.Flags.KickMembers))) {
            // Ban khong co quyen su dung lenh nay
            return;
        }

        const botPermissionError = permissions.validateBotPermissions(guild, PermissionsBitField.Flags.KickMembers);
        if (botPermissionError) {
            await interactionOrMessage.reply(botPermissionError);
            return;
        }

        const targetUser = permissions.getMentionedUser(interactionOrMessage, args, true);
        if (!targetUser) {
            await this.reply(interactionOrMessage, '⚠️ Bạn chưa chỉ định người sẽ bị Kick!', true);
            return;
        }

        if (targetUser.id === interactionOrMessage.client.user?.id) {
            await this.reply(interactionOrMessage, '🚫 Bro muốn tôi tự vả hả? 🤡', true);
            return;
        }

        const targetMember = await permissions.getMember(guild, targetUser.id);
        if (!targetMember) {
            await this.reply(interactionOrMessage, '⚠️ Không tìm thấy thành viên!', true);
            return;
        }

        const targetError = permissions.validateTarget(member, targetMember, 'kick');
        if (targetError) {
            await this.reply(interactionOrMessage, targetError, true);
            return;
        }

        try {
            await targetMember.kick('Goodbye bro, see you again 💝!');
            await this.reply(interactionOrMessage, `✅ ${targetUser} đã bị Kick! 🍄☢️`, true);
        } catch (error) {
            console.error('Ban error:', error);
            await this.reply(interactionOrMessage, '⚠️ Lỗi khi thực hiện Kick!', true);
        }
    }

    // Phuong thuc tien ich "Reply" dung de gui phan hoi cho lenh Prefix va Slash
    private async reply(interactionOrMessage: ChatInputCommandInteraction | Message, message: string, ephemeral: boolean): Promise<void> {
        if (interactionOrMessage instanceof ChatInputCommandInteraction) {
            if (ephemeral)
                await interactionOrMessage.reply({ content: message, flags: MessageFlags.Ephemeral });
            else
                await interactionOrMessage.reply({ content: message });
        } else
            await interactionOrMessage.reply(message);
    }
}