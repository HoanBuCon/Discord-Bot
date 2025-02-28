import { Guild, GuildMember, Message, ChatInputCommandInteraction, User, PermissionsBitField } from 'discord.js';

export class PermissionUtils {
    private interactionOrMessage: ChatInputCommandInteraction | Message;
    private args: string[];

    constructor(interactionOrMessage: ChatInputCommandInteraction | Message, args: string[] = []) {
        this.interactionOrMessage = interactionOrMessage;
        this.args = args;
    }

    getMentionedUser(interactionOrMessage?: ChatInputCommandInteraction | Message, args?: string[], required: boolean = false): User | null {
        if (!interactionOrMessage)
            interactionOrMessage = this.interactionOrMessage;
        if (!args)
            args = this.args;
    
        if (interactionOrMessage instanceof ChatInputCommandInteraction) {
            const user = interactionOrMessage.options.getUser('user');
            if (user)
                return user;
            if (required)
                return null;
            return interactionOrMessage.user;
        }

        const input = args[0];
        if (!input) {
            if (required)
                return null;
            return interactionOrMessage.author;
        }

        const mentionMatch = input.match(/^<@!?(\d+)>$/);
        let userId: string | null = null;

        if (mentionMatch)
            userId = mentionMatch[1];
        else if (/^\d+$/.test(input))
            userId = input;

        if (userId) {
            const mentionedUser = interactionOrMessage.client.users.cache.get(userId);
            if (mentionedUser)
                return mentionedUser;
        }

        if (required)
            return null;

        return interactionOrMessage.author;
    }

    async getMember(guild: Guild, userId: string): Promise<GuildMember | null> {
        try {
            return await guild.members.fetch(userId);
        } catch (error) {
            console.error('⚠️ Lỗi khi lấy thành viên:', error);
            return null;
        }
    }

    validatePermissions(member: GuildMember, permission: bigint): string | null {
        if (member.permissions.has(permission))
            return null;

        return '🚫 Bạn không có quyền sử dụng lệnh này!';
    }

    validateBotPermissions(guild: Guild, permission: bigint): string | null {
        const botMember = guild.members.me;
        if (!botMember)
            return '⚠️ Không thể lấy thông tin của bot!';

        if (botMember.permissions.has(permission))
            return null;

        return '🚫 Tôi đếch có quyền thực hiện việc đó 🫦';
    }

    validateTarget(executor: GuildMember, target: GuildMember, action: string): string | null {
        if (target.permissions.has(PermissionsBitField.Flags.Administrator))
            return `🚫 Bạn không thể **${action}** người có quyền Admin!`;

        if (executor.roles.highest.position <= target.roles.highest.position)
            return `🚫 Bạn không thể **${action}** người có quyền cao hơn hoặc bằng bạn!`;

        return null;
    }

    async checkPermissions(member: GuildMember, permission: bigint): Promise<boolean> {
        const error = this.validatePermissions(member, permission);
        if (error) {
            await this.reply(error);
            return false;
        }
        return true;
    }

    private async reply(message: string): Promise<void> {
        if (this.interactionOrMessage instanceof ChatInputCommandInteraction)
            await this.interactionOrMessage.reply({ content: message, flags: 64 });
        else
            await this.interactionOrMessage.reply(message);
    }
}