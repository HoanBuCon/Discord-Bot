import { Client, Events } from 'discord.js';
import { CommandHandler } from './CommandHandler';

export class PrefixHandler {
    private commandHandler: CommandHandler;
    private prefix: string;

    constructor(commandHandler: CommandHandler, prefix: string) {
        this.commandHandler = commandHandler;
        this.prefix = prefix;
    }

    initialize(client: Client): void {
        client.on(Events.MessageCreate, async (message) => {
            if (message.author.bot || !message.content.toLowerCase().startsWith(this.prefix))
                return;

            const args = message.content.slice(this.prefix.length).trim().split(/\s+/);
            const commandName = args.shift()?.toLowerCase();

            if (!commandName)
                return;

            await this.commandHandler.handleCommand(message, commandName, args);
        });
    }
}