import { ChatInputCommandInteraction, Client, GuildMember, TextChannel, EmbedBuilder, Guild } from 'discord.js';
import { MuteDataManager } from './MuteDataManager';
import { MuteCommand } from '../commands/botCommands/MuteCommand';
import type { MuteData } from '../interfaces/IBaseData';

export class UnmuteService {
    static async checkAndUnmuteUsers(client: Client): Promise<void> {
        const mutedUsers = MuteDataManager.getMutedUsers();
        const now = Date.now();
        const muteCommandInstance = new MuteCommand();

        for (const [userId, guilds] of Object.entries(mutedUsers)) {
            for (const [guildId, muteData] of Object.entries(guilds)) {
                const { unmuteTime } = muteData;
                const timeRemaining = unmuteTime - now;
                const isMuted = await MuteDataManager.isUserMuted(userId, guildId, client);

                const guild = client.guilds.cache.get(guildId);
                if (!guild) {
                    await MuteDataManager.removeMuteData(userId, guildId, client);
                    continue;
                }

                const member = await guild.members.fetch(userId).catch(() => null);
                const muteRole = await muteCommandInstance.getMuteRole(guild);

                if (!isMuted || !member || !muteRole || !member.roles.cache.has(muteRole.id)) {
                    await MuteDataManager.removeMuteData(userId, guildId, client);
                    continue;
                }

                if (timeRemaining <= 0) {
                    await UnmuteService.unmuteUser(client, userId, guildId, muteData);
                    await MuteDataManager.removeMuteData(userId, guildId, client);
                } else {
                    setTimeout(async () => {
                        const guild = client.guilds.cache.get(guildId);
                        let muteRole = null;
                        let member = null;

                        if (guild)
                            member = await guild.members.fetch(userId).catch(() => null);
                        
                        if (guild)
                            muteRole = await muteCommandInstance.getMuteRole(guild);
                        
                        if (!isMuted || !member || !muteRole || !member.roles.cache.has(muteRole.id)) {
                            await MuteDataManager.removeMuteData(userId, guildId, client);
                            return;
                        }
                        await UnmuteService.unmuteUser(client, userId, guildId, muteData);
                        await MuteDataManager.removeMuteData(userId, guildId, client);
                    }, timeRemaining);
                }
            }
        }
    }

    static async unmuteUser(client: Client, userId: string, guildId: string, muteData?: MuteData, manual: boolean = false): Promise<void> {
        const isMuted = await MuteDataManager.isUserMuted(userId, guildId, client);
        if (!isMuted)
            return;
    
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
                    throw error;
                }
            }
        } catch (error) {
            console.error(`⚠️ Lỗi khi Unmute ${member?.user.tag || userId} ở server ${guildId}:`, error);
            throw error;
        }
    }

    static async createMutedListEmbed(guild: Guild): Promise<EmbedBuilder> {
        const mutedUsers = MuteDataManager.getMutedUsers();
        const muteCommandInstance = new MuteCommand();
        const muteRole = await muteCommandInstance.getMuteRole(guild);

        // Lay thong tin trong mutedUsers.json
        let guildMutedUsers: string[] = [];
        if (mutedUsers) {
            guildMutedUsers = Object.entries(mutedUsers)
                .filter(([_, guilds]) => guilds[guild.id])
                .map(([userId, _]) => userId);
        }

        // Fetch tat ca thanh vien
        let guildMembers;
        try {
            guildMembers = await guild.members.fetch();
        } catch (error) {
            console.warn(`⚠️ Không thể fetch toàn bộ thành viên trong guild ${guild.id}:`, error);
            guildMembers = guild.members.cache; // Fallback ve cache neu co bug
            throw error;
        }

        // Lay danh sach thanh vien co role "Muted" trong guild
        let guildMutedUsersFromRole: string[] = [];
        if (muteRole) {
            const membersWithMuteRole = guild.members.cache.filter(member => member.roles.cache.has(muteRole.id));
            guildMutedUsersFromRole = membersWithMuteRole.map(member => member.id);
        }

        // Ket hop 2 danh sach va loai bo trung lap
        const allMutedUsers = Array.from(new Set([...guildMutedUsers, ...guildMutedUsersFromRole]));

        // Kiem tra danh sach tong hop
        if (allMutedUsers.length === 0) {
            return new EmbedBuilder()
                .setTitle('📋 Danh sách thành viên bị Mute')
                .setDescription('🚫 Hiện tại không có ai bị Mute trong server này!')
                .setColor(0x00ff00)
                .setFooter({ text: 'Dùng lệnh sau để gỡ mute:\n🔹Lệnh Slash: /unmute <user>/<all>\n🔹Lệnh Prefix: 69!unmute @user/<all>' });
        }

        // Lay tat ca ID can fetch (nguoi bi mute va nguoi thuc thi lenh)
        const executorIds = allMutedUsers
            .map(id => mutedUsers[id]?.[guild.id]?.executorId)
            .filter((id): id is string => typeof id === 'string'); // Loc bo undefined/null
        const idsToFetch = Array.from(new Set([...allMutedUsers, ...executorIds]));

        // Fetch lai thong tin thanh vien cu the (that ra khong can nhung cu giu lai cho an toan)
        let detailedMembers = guildMembers;
        if (idsToFetch.length > 0) {
            try {
                detailedMembers = await guild.members.fetch({ user: idsToFetch });
            } catch (error) {
                console.warn(`⚠️ Không thể fetch chi tiết thành viên trong guild ${guild.id}:`, error);
                detailedMembers = guildMembers; // Dung guildMembers da fetch truoc do neu bi loi
                throw error;
            }
        }

        const muteList = allMutedUsers.map((userId) => {
            const member = guildMembers.get(userId);
            let response;
    
            if (member) {
                const isInJson = guildMutedUsers.includes(userId);
                const muteData = mutedUsers[userId]?.[guild.id];
                const executorId = muteData?.executorId;
    
                if (isInJson && executorId) {
                    const executor = guildMembers.get(executorId);

                    // Dung user.tag hoac ID (user.tag thi ngau hon, neu bi loi thi dung ID)
                    let executorName;
                    if (executor)
                        executorName = executor.user.tag;
                    else
                        executorName = executorId;

                    response = `<@${userId}> [\`${member.user.tag}\`] (Muted by ${executorName})`; // Truong hop xac dinh duoc nguoi thuc thi lenh

                } else if (isInJson)
                    response = `<@${userId}> [\`${member.user.tag}\`] (Executor unknown)`; // Truong hop khong xac dinh duoc nguoi thuc thi lenh
                else
                    response = `<@${userId}> [\`${member.user.tag}\`] (Muted by other Bots)`; // Truong hop bi mute boi bot khac hoac mute thu cong
            } else {
                response = `(Không còn trong server) (ID: **${userId}**)`;
            }
    
            return response;
        });
        
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

            const isMuted = await MuteDataManager.isUserMuted(targetUser.id, guildId, client);
            if (!isMuted) {
                await interaction.editReply('🚫 Người dùng này hiện không bị Mute!');
                return;
            }

            await this.unmuteUser(client, targetUser.id, guildId, undefined, true);
            await interaction.editReply(`✅ ${targetUser} đã được Unmute! 🔊`);
        } 
        else if (allOption === 'all') {
            const mutedUsers = MuteDataManager.getMutedUsers();
            const muteCommandInstance = new MuteCommand();
            const muteRole = await muteCommandInstance.getMuteRole(guild);
        
            // Lay thong tin trong mutedUsers.json
            let usersInGuildFromJson: string[] = [];
            if (mutedUsers) {
                usersInGuildFromJson = Object.entries(mutedUsers)
                    .filter(([_, guilds]) => guilds[guildId])
                    .map(([userId, _]) => userId);
            }
        
            // Lay danh sach thanh vien co role "Muted" trong guild
            let usersInGuildFromRole: string[] = [];
            if (muteRole) {
                const guildMembers = await guild.members.fetch().catch((error) => {
                console.warn(`⚠️ Không thể fetch toàn bộ thành viên trong guild ${guild.id}:`, error);
                return guild.members.cache;
            });
            const membersWithMuteRole = guildMembers.filter(member => member.roles.cache.has(muteRole.id));
            usersInGuildFromRole = membersWithMuteRole.map(member => member.id);
            }
        
            // Ket hop 2 danh sach va loai bo trung lap
            const usersInGuild = Array.from(new Set([...usersInGuildFromJson, ...usersInGuildFromRole]));
            if (usersInGuild.length === 0) {
                await interaction.editReply(`🚫 Không có người dùng nào bị Mute trong server ${guild.name}.`);
                return;
            }
        
            let successCount = 0;
            for (const userId of usersInGuild) {
                const muteData = mutedUsers[userId]?.[guildId]; // Co the la undefined neu data khong co trong mutedUsers.json
                try {
                    await this.unmuteUser(client, userId, guildId, muteData, true);
                    successCount++;
                    console.log(`✅🔊 Đã Unmute ${userId} khỏi server ${guild.name}.`);
                } catch (error) {
                    console.error(`⚠️ Lỗi khi Unmute ${userId} khỏi server ${guildId}:`, error);
                    throw error;
                }
            }
        
            await interaction.editReply(`✅ Đã Unmute thành công ${successCount}/${usersInGuild.length} người dùng trong server ${guild.name}! 🔊`);
        }
        else {
            const embed = await this.createMutedListEmbed(guild);
            await interaction.editReply({ embeds: [embed] });
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