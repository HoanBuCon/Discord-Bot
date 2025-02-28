import { ChatInputCommandInteraction, Message } from 'discord.js';
import { Command } from '../Command';
import { FileUtils } from '../../utils/FileUtils';

export class HelpCommand extends Command {
    constructor() {
        super('help', 'Hiển thị danh sách lệnh.');
    }

    async execute(interactionOrMessage: ChatInputCommandInteraction | Message): Promise<void> {
        await FileUtils.sendFileContent(interactionOrMessage, 'helpCommand.txt');
    }
}