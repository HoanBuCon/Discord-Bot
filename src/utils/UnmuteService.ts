import { ChatInputCommandInteraction, Client, GuildMember, TextChannel, EmbedBuilder, Guild } from 'discord.js';
import { MuteDataManager } from './MuteDataManager';
import type { MuteData } from '../interfaces/IBaseData';

export class UnmuteService {
    static async checkAndUnmuteUsers(client: Client): Promise<void> {
        const mutedUsers = MuteDataManager.getMutedUsers();
        const now = Date.now();
    
        for (const [userId, guilds] of Object.entries(mutedUsers)) {
            for (const [guildId, muteData] of Object.entries(guilds)) {
                const { unmuteTime } = muteData;
                const timeRemaining = unmuteTime - now;
    
                if (!MuteDataManager.isUserMuted(userId, guildId)) {
                    await MuteDataManager.removeMuteData(userId, guildId, client);
                    continue;
                }
    
                if (timeRemaining <= 0) {
                    await UnmuteService.unmuteUser(client, userId, guildId, muteData);
                } else {
                    setTimeout(async () => {
                        if (!MuteDataManager.isUserMuted(userId, guildId))
                            return;
                        await UnmuteService.unmuteUser(client, userId, guildId, muteData);
                    }, timeRemaining);
                }
            }
        }
    }

    static async unmuteUser(client: Client, userId: string, guildId: string, muteData?: MuteData, manual: boolean = false): Promise<void> {
        if (!MuteDataManager.isUserMuted(userId, guildId)) return;
    
        const guild = client.guilds.cache.get(guildId);
        if (!guild) {
            await MuteDataManager.removeMuteData(userId, guildId, client);
            return;
        }
    
        let member: GuildMember | null = null;
    
        try {
            member = await guild.members.fetch(userId).catch(() => null);
            if (!member) {
                console.log(`🚫 Thành viên ${userId} không còn trong server ${guild.name}.`);
                await MuteDataManager.removeMuteData(userId, guildId, client);
                return;
            }
    
            const muteRole = guild.roles.cache.find(role => role.name.toLowerCase() === 'muted');
            if (muteRole && member.roles.cache.has(muteRole.id)) {
                await member.roles.remove(muteRole);
            }
    
            console.log(`✅🔊 Đã Unmute ${member.user.tag} tại server ${guild.name}`);
    
            const unmuteData = await MuteDataManager.removeMuteData(userId, guildId, client);
    
            if (manual) return;
    
            const logChannel = guild.channels.cache.find(channel => channel.isTextBased());
            if ((unmuteData?.messageId && unmuteData?.channelId) && (logChannel && 'send' in logChannel)) {
                try {
                    const channel = await client.channels.fetch(unmuteData.channelId) as TextChannel;
                    if (channel) {
                        const originalMessage = await channel.messages.fetch(unmuteData.messageId);
                        const replyMessageId = originalMessage.reference?.messageId;

                        let replyMessage = null;
                        if (replyMessageId)
                            replyMessage = await channel.messages.fetch(replyMessageId).catch(() => null);
                        else
                            replyMessage = originalMessage;
    
                        if (replyMessage) {
                            await replyMessage.reply({ 
                                content: `✅ ${member.user} đã được Unmute tự động sau khi hết thời hạn! 🔊`, 
                                allowedMentions: { repliedUser: false }
                            });
                        } else {
                            await logChannel.send(`✅ ${member.user} đã được Unmute tự động sau khi hết thời hạn! 🔊`);
                        }
                    }
                } catch (error) {
                    console.error(`⚠️ Không thể gửi thông báo Unmute cho ${member?.user.tag || userId} trong guild ${guildId}:`, error);
                }
            }
        } catch (error) {
            console.error(`⚠️ Lỗi khi Unmute ${member?.user.tag || userId} ở server ${guildId}:`, error);
        }
    }

    static async createMutedListEmbed(guild: Guild): Promise<EmbedBuilder> {
        const mutedUsers = MuteDataManager.getMutedUsers();
        let guildMutedUsers: string[] = [];
        
        if (mutedUsers) {
            guildMutedUsers = Object.entries(mutedUsers)
                .filter(([_, guilds]) => guilds[guild.id])
                .map(([userId, _]) => userId);
        }

        if (guildMutedUsers.length === 0) {
            return new EmbedBuilder()
                .setTitle('📋 Danh sách thành viên bị Mute')
                .setDescription('🚫 Hiện tại không có ai bị Mute trong server này!')
                .setColor(0x00ff00)
                .setFooter({ text: 'Dùng lệnh sau để gỡ mute:\n🔹Lệnh Slash: /unmute <user>/<all>\n🔹Lệnh Prefix: 69!unmute @user/<all>' });
        }

        const muteList = await Promise.all(guildMutedUsers.map(async (userId) => {
            const member = await guild.members.fetch(userId).catch(() => null);
            let response;
        
            if (member) {
                response = `<@${userId}> (\`${member.user.tag}\`)`;
            } else {
                response = `(Không còn trong server) (ID: **${userId}**)`;
            }
        
            return response;
        }));
        
        let description = muteList.join('\n').slice(0, 4000);
        if (muteList.join('\n').length > 4000) {
            description += '...';
        }

        return new EmbedBuilder()
            .setTitle('📋 Danh sách thành viên bị Mute')
            .setDescription(description)
            .setColor(0x00ff00)
            .setFooter({ text: 'Dùng lệnh sau để gỡ mute:\n🔹Lệnh Slash: /unmute <user>/<all>\n🔹Lệnh Prefix: 69!unmute @user/<all>' });
    }

    static async handleUnmuteCommand(interaction: ChatInputCommandInteraction, client: Client): Promise<void> {
        await interaction.deferReply();
        
        const guildId = interaction.guildId;
        if (!guildId) {
            await interaction.editReply('⚠️ Lệnh này chỉ có thể sử dụng trong server!');
            return;
        }

        const targetUser = interaction.options.getUser('user');
        const allOption = interaction.options.getString('all');
        const guild = client.guilds.cache.get(guildId);

        if (!guild) {
            await interaction.editReply('⚠️ Không tìm thấy server!');
            return;
        }

        if (targetUser) {
            const member = await guild.members.fetch(targetUser.id).catch(() => null);
            if (!member) {
                await interaction.editReply('⚠️ Không tìm thấy người dùng trong server!');
                return;
            }

            if (!MuteDataManager.isUserMuted(targetUser.id, guildId)) {
                await interaction.editReply('🚫 Người dùng này hiện không bị Mute!');
                return;
            }

            await this.unmuteUser(client, targetUser.id, guildId, undefined, true);
            await interaction.editReply(`✅ ${targetUser} đã được Unmute! 🔊`);
        } 
        else if (allOption === 'all') {
            const mutedUsers = MuteDataManager.getMutedUsers();
            let usersInGuild: string[];
            
            if (mutedUsers) {
                usersInGuild = Object.entries(mutedUsers)
                    .filter(([_, guilds]) => guilds[guildId])
                    .map(([userId, _]) => userId);
            } else
                usersInGuild = [];

            if (usersInGuild.length === 0) {
                await interaction.editReply(`🚫 Không có người dùng nào bị Mute trong server ${guild.name}.`);
                return;
            }

            let successCount = 0;
            for (const userId of usersInGuild) {
                const muteData = mutedUsers[userId][guildId];
                try {
                    await this.unmuteUser(client, userId, guildId, muteData, true);
                    successCount++;
                    console.log(`✅🔊 Đã Unmute ${userId} khỏi server ${guild.name}.`);
                } catch (error) {
                    console.error(`⚠️ Lỗi khi Unmute ${userId} khỏi server ${guildId}:`, error);
                }
            }

            await interaction.editReply(`✅ Đã Unmute thành công ${successCount}/${usersInGuild.length} người dùng trong server ${guild.name}! 🔊`);
        } 
        else {
            const embed = await this.createMutedListEmbed(guild);
            await interaction.editReply({ embeds: [embed] });
        }
    }
}