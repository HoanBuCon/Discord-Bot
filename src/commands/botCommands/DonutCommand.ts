import { ChatInputCommandInteraction, Message, GuildMember } from 'discord.js';
import { Command } from '../Command';
import { PermissionUtils } from '../../utils/PermissionUtils';
import { DonutAnimation } from '../../utils/DonutUtils';

export class DonutCommand extends Command {
    constructor() {
        super('donut', 'Gửi hiệu ứng bánh Donut xoay tròn 🍩');
    }
    // Queue va trang thai xu ly cho tung Server (thuoc tinh tinh, chi truy cap trong class)
    private static serverQueues = new Map<string, Array<() => Promise<void>>>();
    private static serverProcessing = new Map<string, boolean>();

    // Cache luu tru khung hinh da tao (dung chung cho tat ca Server, chi truy cap trong class)
    private static cachedFrames: string[] | null = null;
    
    // Phuong thuc xu ly hang doi cho server (tinh, chi truy cap trong class)
    private static async processQueue(guildId: string): Promise<void> {
        const queue = DonutCommand.serverQueues.get(guildId) || [];
        if (DonutCommand.serverProcessing.get(guildId) || queue.length === 0)
            return;

        DonutCommand.serverProcessing.set(guildId, true);
        const nextTask = queue.shift();
        if (nextTask) {
            try {
                await nextTask();
            } catch (error) {
                console.error(`⚠️ Lỗi khi xử lý hàng đợt cho server ${guildId}:`, error);
            }
        }
        DonutCommand.serverProcessing.set(guildId, false);
        DonutCommand.processQueue(guildId); // Tiep tuc xu ly lenh tiep theo trong Queue
    }

    async execute(interactionOrMessage: ChatInputCommandInteraction | Message, args?: string[]): Promise<void> {
        const permissions = new PermissionUtils(interactionOrMessage, args);
        const guild = interactionOrMessage.guild;
        let user = permissions.getMentionedUser(interactionOrMessage, args);
        let member: GuildMember | null;

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

        if (!user) {
            if (interactionOrMessage instanceof Message)
                user = interactionOrMessage.author;
            else
                user = interactionOrMessage.user;
        }

        const guildId = guild.id;
        const mentionText = `<@${user.id}>`;

        // Khoi tao Queue cho Server neu chua co
        if (!DonutCommand.serverQueues.has(guildId)) {
            DonutCommand.serverQueues.set(guildId, []);
            DonutCommand.serverProcessing.set(guildId, false);
        }

        // Them lenh vao Queue cua Server
        const task = async () => {
            try {
                if (interactionOrMessage instanceof ChatInputCommandInteraction && !interactionOrMessage.deferred && !interactionOrMessage.replied)
                    await interactionOrMessage.deferReply();

                // Gui tin nhan bat dau
                let message;
                const initialContent = `${mentionText} bánh Donut xoay tròn incomingg!!!! 🍩\nĐang tạo hiệu ứng...`;
                if (interactionOrMessage instanceof ChatInputCommandInteraction)
                    message = await interactionOrMessage.followUp({ content: initialContent });
                else
                    message = await interactionOrMessage.reply({ content: initialContent });

                // Su dung khung hinh tu Cache (hoac tao moi neu chua co)
                const donutAnimation = new DonutAnimation();
                const frames = DonutCommand.cachedFrames || donutAnimation.generateAnimation(120); // Tao 120 khung hinh
                if (!DonutCommand.cachedFrames)
                    DonutCommand.cachedFrames = frames; // Luu vao Cache

                const maxFramesPerLoop = 60; // Moi vong hien thi 60 khung hinh
                const repeatCount = 2; // Lap lai 2 lan (xoay 2 vong)
                const frameInterval = Math.floor(frames.length / maxFramesPerLoop); // Chon khung hinh cach deu: 120 / 60 = 2

                for (let repeat = 0; repeat < repeatCount; repeat++) {
                    for (let i = 0; i < maxFramesPerLoop; i++) {
                        const frameIndex = i * frameInterval; // Chon khung hinh 0, 2, 4, ..., 118
                        const updatedContent = `# ${mentionText} You spin me right round, baby, right round...~ 🗣️🍩🔥🔥\nNếu bánh bị vỡ thì do cửa sổ kênh chat thiết bị bạn không đủ lớn, hãy thử trên PC\n\`\`\`\n${frames[frameIndex]}\n\`\`\`\n\`\`\`🍩 Bánh Donut đang xoay! (Vòng ${repeat + 1}/${repeatCount})\`\`\``;
                        // Kiem tra do dai noi dung truoc khi gui
                        if (updatedContent.length > 2000)
                            throw new Error('Nội dung quá dài, vượt quá giới hạn 2000 ký tự của Discord');
                        await message.edit({ content: updatedContent });
                        await new Promise(resolve => setTimeout(resolve, 200)); // Do tre 200ms de khong vuot rate limit
                    }
                }

                // Ket thuc hieu ung
                const finalContent = `# ${mentionText} 🍩 Bánh Donut đã xoay xong!\nNếu bánh bị vỡ thì do cửa sổ kênh chat thiết bị bạn không đủ lớn, hãy thử trên PC\n\`\`\`\n${frames[frames.length - 1]}\n\`\`\`\n`;
                if (finalContent.length > 2000)
                    throw new Error('Nội dung kết thúc quá dài, vượt quá giới hạn 2000 ký tự của Discord');
                await message.edit({ content: finalContent});

            } catch (error) {
                console.error(`⚠️ Lỗi khi gửi Donut trong server ${guildId}:`, error);
                if (interactionOrMessage instanceof ChatInputCommandInteraction) {
                    if (interactionOrMessage.deferred || interactionOrMessage.replied)
                        await interactionOrMessage.followUp({ content: '⚠️ Không thể gửi Donut🍩!', flags: 64 }).catch(console.error);
                    else
                        await interactionOrMessage.reply({ content: '⚠️ Không thể gửi Donut🍩!', flags: 64 }).catch(console.error);
                } else if (interactionOrMessage instanceof Message)
                    await interactionOrMessage.reply('⚠️ Không thể gửi Donut🍩!').catch(console.error);
            }
        };

        // Neu server dang ban, thong bao cho nguoi dung
        if (DonutCommand.serverProcessing.get(guildId)) {
            if (interactionOrMessage instanceof ChatInputCommandInteraction)
                await interactionOrMessage.reply({ content: '⚠️ Bot đang bận xử lý một Donut khác trong server này, vui lòng thử lại sau!', flags: 64 });
            else
                await interactionOrMessage.reply('⚠️ Bot đang bận xử lý một Donut khác trong server này, vui lòng thử lại sau!');
            return;
        }

        // Them tac vu vao hang doi cua server va bat dau xu ly
        DonutCommand.serverQueues.get(guildId)!.push(task);
        DonutCommand.processQueue(guildId);
    }
}