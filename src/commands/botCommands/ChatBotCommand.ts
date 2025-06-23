import { ChatInputCommandInteraction, Message, GuildMember, TextChannel, Client } from 'discord.js';
import { Command } from '../Command.ts';
import { ChatBotService } from '../../utils/ChatBotService.ts';

export class ChatBotCommand extends Command {
    private chatbotService: ChatBotService;

    constructor(client: Client) {
        super('chatbot', 'Bật tính năng ChatBot');
        this.chatbotService = ChatBotService.getInstance(client);
    }

    async execute(interactionOrMessage: ChatInputCommandInteraction | Message, args?: string[]): Promise<void> {
        try {
            const guild = interactionOrMessage.guild;
            if (!guild) {
                await this.reply(interactionOrMessage, '⚠️ Lệnh này chỉ hoạt động trong server.');
                return;
            }

            const user = interactionOrMessage instanceof Message ? interactionOrMessage.author : interactionOrMessage.user;
            const serverId = guild.id;

            if (this.chatbotService.isActive(user.id, serverId)) {
                await this.reply(interactionOrMessage, '🚫 Bạn đã bật ChatBot rồi!');
                return;
            }

            if (interactionOrMessage instanceof Message) {
                await this.chatbotService.startChatbotFromCommand(interactionOrMessage);
                await this.reply(interactionOrMessage, '**✅🤖 Tính năng ChatBot đã được bật!** Tôi sẽ trả lời tin nhắn của bạn *(Sử dụng **Tiếng Anh** để chat nếu có thể)*.\nDùng lệnh **`69!endchatbot`** hoặc **`/endchatbot`** để tắt tính năng.');
            } else {
                this.chatbotService.activate(user.id, serverId);
                await this.reply(interactionOrMessage, '**✅🤖 Tính năng ChatBot đã được bật!** Tôi sẽ trả lời tin nhắn của bạn *(Sử dụng **Tiếng Anh** để chat nếu có thể)*.\nDùng lệnh **`69!endchatbot`** hoặc **`/endchatbot`** để tắt tính năng.');
            }
        } catch (error) {
            console.error('[ChatBotCommand] Lỗi khi thực thi lệnh:', error);
            await this.reply(interactionOrMessage, '❌ Đã có lỗi xảy ra khi thực thi lệnh. Vui lòng thử lại sau.');
        }
    }

    private async reply(interactionOrMessage: ChatInputCommandInteraction | Message, content: string): Promise<void> {
        try {
            if (interactionOrMessage instanceof ChatInputCommandInteraction) {
                await interactionOrMessage.reply({ content, flags: 64 });
            } else {
                await interactionOrMessage.reply(content);
            }
        } catch (error) {
            console.error('[ChatBotCommand] Lỗi khi gửi phản hồi:', error);
        }
    }
}

export class EndChatBotCommand extends Command {
    private chatbotService: ChatBotService;

    constructor(client: Client) {
        super('endchatbot', 'Tắt tính năng ChatBot');
        this.chatbotService = ChatBotService.getInstance(client);
    }

    async execute(interactionOrMessage: ChatInputCommandInteraction | Message, args?: string[]): Promise<void> {
        try {
            const guild = interactionOrMessage.guild;
            if (!guild) {
                await this.reply(interactionOrMessage, '⚠️ Lệnh này chỉ hoạt động trong server.');
                return;
            }

            const user = interactionOrMessage instanceof Message ? interactionOrMessage.author : interactionOrMessage.user;
            const serverId = guild.id;

            if (!this.chatbotService.isActive(user.id, serverId)) {
                await this.reply(interactionOrMessage, '🚫 Bạn chưa bật ChatBot!');
                return;
            }

            this.chatbotService.deactivate(user.id, serverId);
            await this.reply(interactionOrMessage, '**🛑 Tính năng ChatBot đã được tắt!**');
        } catch (error) {
            console.error('[EndChatBotCommand] Lỗi khi thực thi lệnh:', error);
            await this.reply(interactionOrMessage, '⚠️ Đã có lỗi xảy ra khi thực thi lệnh. Vui lòng thử lại sau.');
        }
    }

    private async reply(interactionOrMessage: ChatInputCommandInteraction | Message, content: string): Promise<void> {
        try {
            if (interactionOrMessage instanceof ChatInputCommandInteraction) {
                await interactionOrMessage.reply({ content, flags: 64 });
            } else {
                await interactionOrMessage.reply(content);
            }
        } catch (error) {
            console.error('[EndChatBotCommand] Lỗi khi gửi phản hồi:', error);
        }
    }
} 