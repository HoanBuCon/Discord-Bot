import { Client, ChatInputCommandInteraction } from 'discord.js';
import { CommandHandler } from './CommandHandler.ts';

export class SlashHandler {
    private commandHandler: CommandHandler;

    constructor(commandHandler: CommandHandler) {
        this.commandHandler = commandHandler;
    }

    initialize(client: Client): void {
        client.on('interactionCreate', async (interaction) => {
            if (!interaction.isChatInputCommand())
                return;

            const { commandName } = interaction;
            await this.commandHandler.handleCommand(interaction, commandName);
        });
    }
}
