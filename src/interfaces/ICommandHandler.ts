import { ChatInputCommandInteraction, Message } from 'discord.js';
import type { ICommand } from './ICommand';

export interface ICommandHandler {
    registerCommand(command: ICommand): void;
    handleCommand(
        interactionOrMessage: ChatInputCommandInteraction | Message,
        commandName: string,
        args?: string[]
    ): Promise<void>;
}
