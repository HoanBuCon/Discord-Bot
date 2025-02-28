import { ChatInputCommandInteraction, Message } from 'discord.js';

export interface ICommand {
    execute(interactionOrMessage: ChatInputCommandInteraction | Message, args?: string[]): Promise<void>;
    getName(): string;
}