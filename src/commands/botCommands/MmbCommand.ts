import { ChatInputCommandInteraction, Message, GuildMember } from 'discord.js';
import { Command } from '../Command';
import { FileUtils } from '../../utils/FileUtils';
import { PermissionUtils } from '../../utils/PermissionUtils';

export class MmbCommand extends Command {
    constructor() {
        super('memaybeo', 'Dùng khi có thằng chửi mẹ bạn 🐧');
    }

    async execute(interactionOrMessage: ChatInputCommandInteraction | Message, args?: string[]): Promise<void> {
        const permissions = new PermissionUtils(interactionOrMessage, args);
        const guild = interactionOrMessage.guild;
        let user = permissions.getMentionedUser(interactionOrMessage, args);
        let member: GuildMember | null;
        
        // Xac dinh doi tuong thuc thi lenh
        if (interactionOrMessage instanceof Message)
            member = interactionOrMessage.member;
        else
            member = interactionOrMessage.member as GuildMember;

        if (!guild || !member) {
            if (interactionOrMessage instanceof ChatInputCommandInteraction)
                await interactionOrMessage.reply({ content: '⚠️ Lệnh này chỉ hoạt động trong server.', ephemeral: true });
            else
                await interactionOrMessage.reply('⚠️ Lệnh này chỉ hoạt động trong server.');
            return;
        }

        // Neu khong mention User nao thi lay chinh nguoi su dung lenh
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
