// src/commands/botCommands/SuaCommand.ts
import { ChatInputCommandInteraction, Message, GuildMember } from 'discord.js';
import { Command } from '../Command';
import { PermissionUtils } from '../../utils/PermissionUtils';
import { FileUtils } from '../../utils/FileUtils';

export class SaygexmemeCommand extends Command {
    constructor() {
        super('saygex', 'Gửi meme mỹ đen chôl lầy 🐧');
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

        try {
            await FileUtils.sendRandomSayGexMedia(interactionOrMessage, `# im lang nao co be xam lul ${user} 🤫🧏‍♂️🗿`);
        } catch (error) {
            console.error('⚠️ Lỗi khi gửi meme:', error);
            if (interactionOrMessage instanceof ChatInputCommandInteraction)
                await interactionOrMessage.reply({ content: '⚠️ Không thể gửi meme!', flags: 64 });
            else
                await interactionOrMessage.reply('⚠️ Không thể gửi meme!');
        }
    }
}