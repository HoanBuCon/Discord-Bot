import { ChatInputCommandInteraction, Message, GuildMember, EmbedBuilder } from 'discord.js';
import { Command } from '../Command.ts';
import { channel } from 'diagnostics_channel';

export class ServerinfoCommand extends Command {
    constructor() {
        super('server', 'Hiển thị thông tin máy chủ.');
    }

    async execute(interactionOrMessage: ChatInputCommandInteraction | Message): Promise<void> {
        const guild = interactionOrMessage.guild;
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

        if (interactionOrMessage instanceof ChatInputCommandInteraction && !interactionOrMessage.deferred && !interactionOrMessage.replied)
            await interactionOrMessage.deferReply();

        // Tim owner cua server
        const owner = await guild.fetchOwner().then(owner => owner.user.tag).catch(() => 'Unknown');

        // Kiem tra xem co channel NSFW nao khong
        const hasNSFWChannels = guild.channels.cache.some(channel => (channel as any).nsfw === true);

        const serverInfo = {
            iconURL: guild.iconURL() || 'No Icon',
            bannerURL: guild.bannerURL() || 'No Banner',
            name: guild.name,
            id: guild.id,
            memberCount: guild.memberCount,
            createdAtFormatted: guild.createdAt.toLocaleDateString('vi-VN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            }),
            owner: `<@${guild.ownerId}>` || 'Unknown',
            description: guild.description || 'No Description',
            boostTier: guild.premiumTier,
            boostCount: guild.premiumSubscriptionCount || 0,
            roles: guild.roles.cache.size,
            emojis: guild.emojis.cache.size,
            stickers: guild.stickers.cache.size,
            channels: guild.channels.cache.size,
            nonsafe: hasNSFWChannels ? 'Có' : 'Không',
            // community: guild.features.includes('COMMUNITY') ? 'Có' : 'Không',
        }

        // Tao embed thong tin server
        const embed = new EmbedBuilder()
            .setTitle(`📜 THÔNG TIN MÁY CHỦ`)
            .setColor('#5865F2')
            .setThumbnail(serverInfo.iconURL !== 'No Icon' ? serverInfo.iconURL : null)
            .setImage(serverInfo.bannerURL !== 'No Banner' ? serverInfo.bannerURL : null)
            .setDescription(serverInfo.description)
            .addFields(
                { name: '🏷️ Tên máy chủ:', value: `${serverInfo.name}`, inline: true },
                { name: '🆔 ID máy chủ:', value: `\`${serverInfo.id}\``, inline: true },
                { name: '📅 Ngày khởi tạo:', value: `${serverInfo.createdAtFormatted}`, inline: true },
                { name: '👑 Chủ sở hữu:', value: `${serverInfo.owner}`, inline: true },
                { name: '👥 Thành viên:', value: `${serverInfo.memberCount}`, inline: true },
                { name: '📚 Kênh:', value: `${serverInfo.channels}`, inline: true },
                { name: '🎭 Vai trò:', value: `${serverInfo.roles}`, inline: true },
                { name: '🚀 Cấp độ Boost:', value: `${serverInfo.boostTier}`, inline: true },
                { name: '💎 Số lượng Boost:', value: `${serverInfo.boostCount}`, inline: true },
                { name: '😀 Biểu cảm:', value: `${serverInfo.emojis}`, inline: true },
                { name: '🎨 Nhãn dán:', value: `${serverInfo.stickers}`, inline: true },
                { name: '🔞 Kênh NSFW:', value: `${serverInfo.nonsafe}`, inline: true },
                // { name: '🌐 Máy chủ cộng đồng:', value: `${serverInfo.community}`, inline: true }
            )
            .setTimestamp()
            .setFooter({ text: `Yêu cầu bởi ${member.user.tag}`, iconURL: member.user.displayAvatarURL() });

        // Gui embed thong tin server
        if (interactionOrMessage instanceof ChatInputCommandInteraction) {
            await interactionOrMessage.editReply({ embeds: [embed] });
        } else {
            await interactionOrMessage.reply({ embeds: [embed] });
        }
    }
}