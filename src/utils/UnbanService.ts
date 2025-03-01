import { ChatInputCommandInteraction, Client, TextChannel, EmbedBuilder, Guild } from 'discord.js';
import { BanDataManager } from './BanDataManager';
import type { BanData } from './BanDataManager';

export class UnbanService {
    static async checkAndUnbanUsers(client: Client): Promise<void> {
        const bannedUsers = BanDataManager.getBannedUsers();
        const now = Date.now();
    
        for (const [userId, guilds] of Object.entries(bannedUsers)) {
            for (const [guildId, banData] of Object.entries(guilds)) {
                const { unbanTime } = banData;
                const timeRemaining = unbanTime - now;
    
                const guild = client.guilds.cache.get(guildId);
                if (!guild) {
                    await BanDataManager.removeBanData(userId, guildId, client);
                    continue;
                }

                const ban = await guild.bans.fetch(userId).catch(() => null);
                if (!ban) {
                    console.log(`🚫 Người dùng ${userId} không bị Ban trên server ${guild.name}.`);
                    await BanDataManager.removeBanData(userId, guildId, client);
                    continue;
                }
    
                if (!BanDataManager.isUserBanned(userId, guildId)) {
                    await BanDataManager.removeBanData(userId, guildId, client);
                    continue;
                }
    
                if (timeRemaining <= 0) {
                    await UnbanService.unbanUser(client, userId, guildId, banData);
                } else {
                    setTimeout(async () => {
                        if (!BanDataManager.isUserBanned(userId, guildId)) return;
                        await UnbanService.unbanUser(client, userId, guildId, banData);
                    }, timeRemaining);
                }
            }
        }
    }

    static async unbanUser(client: Client, userId: string, guildId: string, banData?: BanData, manual: boolean = false): Promise<void> {
        if (!BanDataManager.isUserBanned(userId, guildId)) return;
    
        const guild = client.guilds.cache.get(guildId);
        if (!guild) {
            await BanDataManager.removeBanData(userId, guildId, client);
            return;
        }
    
        try {
            const ban = await guild.bans.fetch(userId).catch(() => null);
            if (!ban) {
                console.log(`🚫 Người dùng ${userId} không bị Ban trên server ${guild.name}.`);
                await BanDataManager.removeBanData(userId, guildId, client);
                return;
            }
    
            await guild.members.unban(userId, 'Welcome back🤝');
            console.log(`✅🔓 Đã Unban ${userId} tại server ${guild.name}`);
    
            const unbanData = await BanDataManager.removeBanData(userId, guildId, client);
    
            if (manual) return;
    
            const logChannel = guild.channels.cache.find(channel => channel.isTextBased());
            if ((unbanData?.messageId && unbanData?.channelId) && (logChannel && 'send' in logChannel)) {
                try {
                    const channel = await client.channels.fetch(unbanData.channelId) as TextChannel;
                    if (channel) {
                        const originalMessage = await channel.messages.fetch(unbanData.messageId);
                        const replyMessageId = originalMessage.reference?.messageId;
    
                        let replyMessage = null;
                        if (replyMessageId)
                            replyMessage = await channel.messages.fetch(replyMessageId).catch(() => null);
                        else
                            replyMessage = originalMessage;
    
                        if (replyMessage) {
                            await replyMessage.reply({ 
                                content: `✅ ${userId} đã được Unban tự động sau khi hết thời hạn! 🔓`, 
                                allowedMentions: { repliedUser: false }
                            });
                        } else {
                            await logChannel.send(`✅ ${userId} đã được Unban tự động sau khi hết thời hạn! 🔓`);
                        }
                    }
                } catch (error) {
                    console.error(`⚠️ Không thể gửi thông báo Unban cho ${userId} trong guild ${guildId}:`, error);
                }
            }
        } catch (error) {
            if (typeof error === 'object' && error !== null && 'code' in error) {
                if (error.code === 10026) {
                    console.log(`⚠️ Người dùng ${userId} không bị Ban trên server ${guild.name}.`);
                    await BanDataManager.removeBanData(userId, guildId, client);
                } else {
                    console.error(`⚠️ Lỗi khi Unban ${userId} ở server ${guildId}:`, error);
                }
            } else {
                console.error(`⚠️ Lỗi không xác định khi Unban ${userId} ở server ${guildId}:`, error);
            }
        }
    }

    static async unbanAllUsersInGuild(client: Client, guildId: string): Promise<void> {
        const bannedUsers = BanDataManager.getBannedUsers();
        const guild = client.guilds.cache.get(guildId);

        if (!guild) {
            console.log(`⚠️ Không tìm thấy server với guildId: ${guildId}`);
            return;
        }

        const usersInGuild = bannedUsers ? Object.entries(bannedUsers)
            .filter(([_, guilds]) => guilds[guildId])
            .map(([userId, _]) => userId) : [];

        if (usersInGuild.length === 0) {
            console.log(`🚫 Không có người dùng nào bị Ban trong server ${guild.name}.`);
            return;
        }

        for (const userId of usersInGuild) {
            const banData = bannedUsers[userId][guildId];
            try {
                await this.unbanUser(client, userId, guildId, banData, true);
                console.log(`✅🔓 Đã Unban ${userId} khỏi server ${guild.name}.`);
            } catch (error) {
                console.error(`⚠️ Lỗi khi Unban ${userId} khỏi server ${guildId}:`, error);
            }
        }

        console.log(`✅ Đã hoàn tất Unban tất cả (${usersInGuild.length}) người dùng trong server ${guild.name}.`);
    }

    static async createBannedListEmbed(guild: Guild): Promise<EmbedBuilder> {
        const bans = await guild.bans.fetch();
        if (bans.size === 0) {
            return new EmbedBuilder()
                .setTitle('📋 Danh sách thành viên bị Ban')
                .setDescription('🚫 Hiện tại không có ai bị Ban trong server này!')
                .setColor(0xff0000)
                .setFooter({ text: 'Dùng lệnh sau để gỡ ban:\n🔹Lệnh Slash: /unban <userID>/<all>\n🔹Lệnh Prefix: 69!unban <userID>/<all>' });
        }

        const banList = bans.map(ban => `\`${ban.user.tag}\` (ID: **${ban.user.id}**)`).join('\n');
        let description = banList.slice(0, 4000);
        if (banList.length > 4000) {
            description += '...';
        }

        return new EmbedBuilder()
            .setTitle('📋 Danh sách thành viên bị Ban')
            .setDescription(description)
            .setColor(0xff0000)
            .setFooter({ text: 'Dùng lệnh sau để gỡ ban:\n🔹Lệnh Slash: /unban <userID>/<all>\n🔹Lệnh Prefix: 69!unban <userID>/<all>' });
    }

    static async handleUnbanCommand(interaction: ChatInputCommandInteraction, client: Client): Promise<void> {
        await interaction.deferReply();

        const guildId = interaction.guildId;
        if (!guildId) {
            await interaction.editReply('⚠️ Lệnh này chỉ có thể sử dụng trong server!');
            return;
        }

        const userId = interaction.options.getString('userid');
        const allOption = interaction.options.getString('all');
        const guild = client.guilds.cache.get(guildId);

        if (!guild) {
            await interaction.editReply('⚠️ Không tìm thấy server!');
            return;
        }

        if (userId) {
            if (!/^\d{17,19}$/.test(userId)) {
                await interaction.editReply('⚠️ ID người dùng không hợp lệ!');
                return;
            }

            const ban = await guild.bans.fetch(userId).catch(() => null);
            if (!ban) {
                await interaction.editReply('🚫 Người dùng này không bị Ban!');
                return;
            }

            await this.unbanUser(client, userId, guildId, undefined, true);
            await interaction.editReply(`✅ Đã Unban người dùng với ID: ${userId}! 🔓`);
        } 
        else if (allOption === 'all') {
            const bans = await guild.bans.fetch();
            if (bans.size === 0) {
                await interaction.editReply(`🚫 Không có người dùng nào bị Ban trong server ${guild.name}.`);
                return;
            }

            let successCount = 0;
            for (const ban of bans.values()) {
                try {
                    await this.unbanUser(client, ban.user.id, guildId, undefined, true);
                    successCount++;
                } catch (error) {
                    console.error(`⚠️ Lỗi khi Unban ${ban.user.id} khỏi server ${guildId}:`, error);
                }
            }

            await interaction.editReply(`✅ Đã Unban thành công ${successCount}/${bans.size} người dùng trong server ${guild.name}! 🔓`);
        } 
        else {
            const embed = await this.createBannedListEmbed(guild);
            await interaction.editReply({ embeds: [embed] });
        }
    }
}