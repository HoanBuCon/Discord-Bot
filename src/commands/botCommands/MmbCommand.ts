import { ChatInputCommandInteraction, Message } from 'discord.js';
import { Command } from '../Command';
import { FileUtils } from '../../utils/FileUtils';
import { PermissionUtils } from '../../utils/PermissionUtils';

export class MmbCommand extends Command {
    constructor() {
        super('memaybeo', 'Dùng khi có thằng chửi mẹ bạn 🐧');
    }

    async execute(interactionOrMessage: ChatInputCommandInteraction | Message, args?: string[]): Promise<void> {
        const permissions = new PermissionUtils(interactionOrMessage, args);
        let user = permissions.getMentionedUser(interactionOrMessage, args);

        if (!user) {
            if (interactionOrMessage instanceof Message)
                user = interactionOrMessage.author;
            else
                user = interactionOrMessage.user;
        }

        const mentionText = `<@${user.id}>`;
        const fileContent = await FileUtils.readFile('mmbCommand.txt');

        if (!fileContent) {
            await interactionOrMessage.reply('⚠️ Không thể đọc nội dung file!');
            return;
        }

        await interactionOrMessage.reply(`${mentionText}\n${fileContent}`);
    }
}
