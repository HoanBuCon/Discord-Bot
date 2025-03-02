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
        if (!(await permissions.checkPermissions(member, PermissionsBitField.Flags.BanMembers))) {
            // Ban khong co quyen su dung lenh nay
            return;
        }

        const botPermissionError = permissions.validateBotPermissions(guild, PermissionsBitField.Flags.BanMembers);
        if (botPermissionError) {
            await interactionOrMessage.reply({ content: botPermissionError, ephemeral: true });
            return;
        }

        let isUnbanAll = false;
        if (interactionOrMessage instanceof Message && args && args[0] === 'all')
            isUnbanAll = true;
        else if (interactionOrMessage instanceof ChatInputCommandInteraction && interactionOrMessage.options.getString('userid') === 'all')
            isUnbanAll = true;

        if (isUnbanAll) {
            try {
                await UnbanService.unbanAllUsersInGuild(interactionOrMessage.client, guild.id);
                await interactionOrMessage.reply('✅ Đã Unban tất cả người dùng trong server! 🔓');
                return;
            } catch (error) {
                console.error('Lỗi khi unban tất cả:', error);
                await interactionOrMessage.reply({ content: '⚠️ Lỗi khi thực hiện unban tất cả!', ephemeral: true });
                return;
            }
        }

        let userId: string | null = null;

        if (interactionOrMessage instanceof ChatInputCommandInteraction)
            userId = interactionOrMessage.options.getString('userid', false);
        else if (interactionOrMessage instanceof Message && args && args.length > 0)
            userId = args[0];

        if (!userId) {
            try {
                const bans = await guild.bans.fetch();
                if (bans.size === 0) {
                    await interactionOrMessage.reply({ content: '⚠️ Hiện tại không có ai bị Ban!', ephemeral: true });
                    return;
                }
        
                const banList = bans.map(ban => `\`${ban.user.tag}\` (ID: **${ban.user.id}**)`).join("\n");
        
                let description;
                if (banList.length > 4000)
                    description = banList.slice(0, 4000) + '...';
                else
                    description = banList;

                const embed = new EmbedBuilder()
                    .setTitle('📋 Danh sách thành viên bị Ban')
                    .setDescription(description)
                    .setColor(0xff0000)
                    .setFooter({ text: 'Dùng lệnh sau để gỡ ban:\n🔹Lệnh Slash: /unban <userID>\n🔹Lệnh Prefix: 69!unban <userID>' });
        
                await interactionOrMessage.reply({ embeds: [embed], ephemeral: true });
                return;
            } catch (error) {
                console.error('Lỗi khi lấy danh sách ban:', error);
                await interactionOrMessage.reply({ content: '⚠️ Không thể lấy danh sách người bị Ban!', ephemeral: true });
                return;
            }
        }

        if (!/^\d{17,19}$/.test(userId)) {
            await interactionOrMessage.reply({ content: '⚠️ ID người dùng không hợp lệ!', ephemeral: true });
            return;
        }

        try {
            await UnbanService.unbanUser(interactionOrMessage.client as Client, userId, guild.id, undefined, true);
            await interactionOrMessage.reply(`✅ Đã Unban người dùng với **ID: ${userId}** 🔓`);
        } catch (error) {
            console.error('Lỗi khi unban:', error);
            await interactionOrMessage.reply({ content: '⚠️ Lỗi khi thực hiện Unban!', ephemeral: true });
        }
    }
}