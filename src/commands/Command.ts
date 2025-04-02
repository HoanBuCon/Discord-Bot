import { ChatInputCommandInteraction, Message } from 'discord.js';
import type { ICommand } from '../interfaces/ICommand.ts';

export abstract class Command implements ICommand {
    protected name: string;
    protected description: string;

    constructor(name: string, description: string) {
        this.name = name;
        this.description = description;
    }

    abstract execute(interactionOrMessage: ChatInputCommandInteraction | Message, args?: string[]): Promise<void>;

    getName(): string {
        return this.name;
    }

    getDescription(): string {
        return this.description;
    }
}