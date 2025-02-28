import { ChatInputCommandInteraction, Message } from 'discord.js';
import { Command } from '../Command';
import { PermissionUtils } from '../../utils/PermissionUtils';

export class SuaCommand extends Command {
    constructor() {
        super('sua', 'Counter con doggo vừa cắn bạn 🐧');
    }

    async execute(interactionOrMessage: ChatInputCommandInteraction | Message, args?: string[]): Promise<void> {
        const permissions = new PermissionUtils(interactionOrMessage, args);
        let user = permissions.getMentionedUser(interactionOrMessage, args);

        if (!user) {
            if (interactionOrMessage instanceof Message) {
                user = interactionOrMessage.author;
            } else {
                user = interactionOrMessage.user;
            }
        }

        await interactionOrMessage.reply(`# Sua con cac, ${user} 🤫🧏‍♂️🗿`);
    }
}