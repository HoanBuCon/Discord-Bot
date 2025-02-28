import { ChatInputCommandInteraction, Client, GuildMember, TextChannel } from 'discord.js';
import { MuteDataManager } from './MuteDataManager';
import type { MuteData } from './MuteDataManager';

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
                console.log(`⚠️ Thành viên ${userId} không còn trong server ${guild.name}.`);
                await MuteDataManager.removeMuteData(userId, guildId, client);
                return;
            }
    
            const muteRole = guild.roles.cache.find(role => role.name.toLowerCase() === 'muted');
            if (muteRole && member.roles.cache.has(muteRole.id)) {
                await member.roles.remove(muteRole);
            }
    
            console.log(`✅ Đã Unmute ${member.user.tag} tại server ${guild.name}`);
    
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

    static async unmuteAllUsersInGuild(client: Client, guildId: string): Promise<void> {
        const mutedUsers = MuteDataManager.getMutedUsers();
        const guild = client.guilds.cache.get(guildId);

        if (!guild) {
            console.log(`⚠️ Không tìm thấy server với guildId: ${guildId}`);
            return;
        }

        const usersInGuild = mutedUsers ? Object.entries(mutedUsers)
            .filter(([_, guilds]) => guilds[guildId])
            .map(([userId, _]) => userId) : [];

        if (usersInGuild.length === 0) {
            console.log(`🚫 Không có người dùng nào bị Mute trong server ${guild.name}.`);
            return;
        }

        for (const userId of usersInGuild) {
            const muteData = mutedUsers[userId][guildId];
            try {
                await this.unmuteUser(client, userId, guildId, muteData, true);
                console.log(`✅🔊 Đã Unmute ${userId} khỏi server ${guild.name}.`);
            } catch (error) {
                console.error(`⚠️ Lỗi khi Unmute ${userId} khỏi server ${guildId}:`, error);
            }
        }

        console.log(`✅ Đã hoàn tất Unmute tất cả (${usersInGuild.length}) người dùng trong server ${guild.name}.`);
    }
}