import { ChatInputCommandInteraction, Message, GuildMember } from 'discord.js';
import { Command } from '../Command';
import { PermissionUtils } from '../../utils/PermissionUtils';
import { FileUtils } from '../../utils/FileUtils';

export class SuaCommand extends Command {
    constructor() {
        super('sua', 'Counter con doggo vừa cắn bạn 🐧');
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
<<<<<<< HEAD
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
=======
                await interactionOrMessage.reply({ content: '⚠️ Lệnh này chỉ hoạt động trong server.', flags: 64 });
            else
                await interactionOrMessage.reply('⚠️ Lệnh này chỉ hoạt động trong server.');
            return;
>>>>>>> HBC
        }

        // Neu khong mention User nao thi lay chinh nguoi su dung lenh
        if (!user) {
            if (interactionOrMessage instanceof Message)
                user = interactionOrMessage.author;
            else
                user = interactionOrMessage.user;
        }

        const fileContent = `# Sua con cac, <@${user.id}> 🤫🧏‍♂️🗿`;

        try {
            await FileUtils.sendRandomSuaMedia(interactionOrMessage, `${fileContent}`);
        } catch (error) {
            console.error('⚠️ Lỗi khi gửi media cho SuaCommand:', error);
            if (interactionOrMessage instanceof ChatInputCommandInteraction)
                await interactionOrMessage.reply({ content: '⚠️ Không thể gửi media!', flags: 64 });
            else
                await interactionOrMessage.reply('⚠️ Không thể gửi media!');
        }
    }
}