import { ChatInputCommandInteraction, Message, GuildMember } from 'discord.js';
import { Command } from '../Command';
import { PermissionUtils } from '../../utils/PermissionUtils';
import { FileUtils } from '../../utils/FileUtils';

export class SaygexmemeCommand extends Command {
    constructor() {
        super('saygex', 'Gửi meme mỹ đen chôl lầy 🐧');
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
                await interactionOrMessage.reply({ content: '⚠️ Lệnh này chỉ hoạt động trong server.', flags: 64 });
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

        try {
            if (interactionOrMessage instanceof ChatInputCommandInteraction && !interactionOrMessage.deferred && !interactionOrMessage.replied) // Defer interaction neu la slash command de tranh timeout
                await interactionOrMessage.deferReply();

            // Tao 1 Hash Map (Object) de luu Title tuy chinh rieng cho meme
            const mediaDir = '../commands/botCommands/dataFiles/media/memeSayGex';
            const { fileName } = await FileUtils.getRandomSayGexFile();
            const titleMap: { [key: string]: string } = {
                'nig_loud.mp4': `# This had me in tears ${mentionText} 💔😔`,
                'nig_sad_shower1.mov': `# This had me in tears ${mentionText} 💔😔`,
                'nig_sad_shower2.mov': `# This had me in tears ${mentionText} 💔😔`,
                'israel_gun.mp4': `# Israeli soldier died fighting for his country ${mentionText} 🫡😭`,
                'uwu_niisan.mov': `# UwU ${mentionText}-sama! 🫦🍆`,
                'ineedmorebullets.mp4': `# Brave French soldier try to give you his last bullets ${mentionText} 🫡😭`,
                'nig_miko.mp4': `# Toi quen biet em giua mot dem that tinh co ${mentionText}💘🌹`,
                'death_battle_meme.mp4': `# This battle will be legendary! ${mentionText} 🗣️🔥`,
                'chuyen_di_ninh_binh_Myden.mp4': `# Do la nhung ki niem dep ${mentionText} 💖😔`,
                'my_den_tra_tan.mp4': `# Toi se ke lai trai nghiem khong the quen cua toi ${mentionText}🥶`,
                'anh_ba_linh_duc.mp4': `# This had me in tears ${mentionText} 🫡😭`,
                'bun_da_rau_ma.mp4': `# Cậu Năm đang làm gì vậy ${mentionText} 🥶`,
                'ca_can_cu.mp4': `# Chú Tư bị sao vậy dude ${mentionText} 🥶`,
                'are_are.mp4': `# Này cô nương dễ thương ${mentionText} 🫦🌹`,
                'chu_no_Bac_Giang.mp4': `# Vu nay gan nha t ${mentionText} 🥶`,
                'anh_la_ngoai_le.mov': `# 🫦🌹 ${mentionText}`,
                'sao_minh_chua_nam_tay_nhau.mov': `# 🫦🌹 ${mentionText}`,
                'dung_nhin.jpg': `# Yare yare ~ co nuong de thuong ${mentionText} 🫦`,
                'no_king.mov': `# Have u ever been fcked this gud? ${mentionText} 🫦`,
                'yes_king.mov': `# Is that desk gud? ${mentionText} 🫦`,
                'nguoi_xu_phan.mov': `# Cai deo gi co thang moi den ${mentionText} ?`,
                'kho_ngu_ricardo.mov': `# Oi oi ~ co nuong de thuong ${mentionText} 🫦`,
                'giot_suong_goku_full.mov': `# This had me in tears ${mentionText} 💔😔`,
                'giot_suong_goku_half.mov': `# This had me in tears ${mentionText} 💔😔`,
                'ban_than_oi.mov': `# Duyen so sinh ra chung minh ${mentionText} 💖🤝`,
                'happy_new_year.mov': `# Nam moi da den, an khang thinh vuong ${mentionText} 💖🧧`,
                'excuse_me.mov': `# Cai deo gi co ${mentionText} ?`,
                'buoi_trua.mov': `# Chuc ca nha buoi trua an lanh ${mentionText} 🌹💖`
            };
            const title = titleMap[fileName] || `# im lang nao co be xam lul ${mentionText} 🤫🧏‍♂️🗿`;
            await FileUtils.sendMedia(interactionOrMessage, fileName, mediaDir, title);
        } catch (error) {
            console.error('⚠️ Lỗi khi gửi meme:', error);
            if (interactionOrMessage instanceof ChatInputCommandInteraction) {
                if (interactionOrMessage.deferred || interactionOrMessage.replied)
                    await interactionOrMessage.followUp({ content: '⚠️ Không thể gửi meme!', flags: 64 }).catch(console.error);
                else
                    await interactionOrMessage.reply({ content: '⚠️ Không thể gửi meme!', flags: 64 }).catch(console.error);
            } else
                await interactionOrMessage.reply('⚠️ Không thể gửi meme!').catch(console.error);
        }
    }
}