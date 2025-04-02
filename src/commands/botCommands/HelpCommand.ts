import { ChatInputCommandInteraction, Message, GuildMember } from 'discord.js';
import { Command } from '../Command.ts';
import { FileUtils } from '../../utils/FileUtils.ts';

export class HelpCommand extends Command {
    constructor() {
        super('help', 'Hiển thị danh sách lệnh.');
    }

    async execute(interactionOrMessage: ChatInputCommandInteraction | Message): Promise<void> {
        const guild = interactionOrMessage.guild;
        let member: GuildMember | null;
        
        // Xac dinh doi tuong thuc thi lenh
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

        if (interactionOrMessage instanceof ChatInputCommandInteraction && !interactionOrMessage.deferred && !interactionOrMessage.replied)
            await interactionOrMessage.deferReply();

        const isSlashCommand = interactionOrMessage instanceof ChatInputCommandInteraction;
        await FileUtils.sendMultiFileContent(interactionOrMessage, ['HelpCommand_Part1.txt', 'HelpCommand_Part2.txt'], '', isSlashCommand, !isSlashCommand);
    }
}