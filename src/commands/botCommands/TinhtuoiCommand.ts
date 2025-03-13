import { ChatInputCommandInteraction, Message, GuildMember, EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, ModalSubmitInteraction, ButtonBuilder, ButtonStyle, ButtonInteraction, ComponentType, MessageComponentInteraction, Embed } from 'discord.js';
import { User, type CollectorFilter } from 'discord.js';
import { Command } from '../Command';
import { PermissionUtils } from '../../utils/PermissionUtils';

export class TinhtuoiCommand extends Command {
    constructor() {
        super('tinhtuoi', 'Máy tính tuổi thông minh');
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

        // Neu User duoc mention la chinh con bot
        if (user.id === interactionOrMessage.client.user?.id) {
            if (interactionOrMessage instanceof ChatInputCommandInteraction)
                await interactionOrMessage.reply({ content: `Never ask women and SayGex69 their age 🗣️🔥`, flags: 64 });
            else
                await interactionOrMessage.reply(`Never ask women and SayGex69 their age 🗣️🔥`);
            return;
        }

        // Neu User duoc mention la bot khac
        if (user.bot) {
            if (interactionOrMessage instanceof ChatInputCommandInteraction)
                await interactionOrMessage.reply({ content: 'Never ask women and Discord Bots their age 🗣️🔥', flags: 64 });
            else
                await interactionOrMessage.reply('Never ask women and Discord Bots their age 🗣️🔥');
            return;
        }

        // Goi phuong thuc tinh tuoi
        await this.handleAgeCalculator(interactionOrMessage, user);
    }

    // Xu ly cho ca Slash Command va Prefix Command
    private async handleAgeCalculator(interactionOrMessage: ChatInputCommandInteraction | Message, user: User): Promise<void> {
        let targetUser;
        if (user)
            targetUser = user;
        else {
            if (interactionOrMessage instanceof Message)
                targetUser = interactionOrMessage.author;
            else
                targetUser = interactionOrMessage.user;
        }

        const nhaptuoiButton = new ButtonBuilder()
            .setCustomId('tinhtuoi_button')
            .setLabel('Nhập tuổi')
            .setStyle(ButtonStyle.Primary);

        const tinhlaiButton = new ButtonBuilder()
            .setCustomId('tinhlai_button')
            .setLabel('Tính lại')
            .setStyle(ButtonStyle.Primary);

        const nutNhaptuoi = new ActionRowBuilder<ButtonBuilder>().addComponents(nhaptuoiButton);
        const nutTinhlai = new ActionRowBuilder<ButtonBuilder>().addComponents(tinhlaiButton);

        let reply: Message<boolean> | null = null;
        const embed = new EmbedBuilder()
            .setColor(0x0099FF)
            .setTitle('📝 Máy Tính Tuổi Thông Minh')
            .setDescription('**Nhấn nút bên dưới để tính tuổi bằng siêu máy tính thông minh!**')
            .setFooter({ text: '(Siêu thuật toán Deep Learning, kết hợp Machine Learning và Reinforcement Learning)' });

        try {
            if (interactionOrMessage instanceof ChatInputCommandInteraction) {
                await interactionOrMessage.reply({
                    content: `Oi oi oi <@${user.id}>!!`,
                    embeds: [embed],
                    components: [nutNhaptuoi],
                });

                if (interactionOrMessage.channel)
                    reply = await interactionOrMessage.fetchReply() as Message<boolean>;

            } else if (interactionOrMessage instanceof Message) {
                reply = await interactionOrMessage.reply({
                    content: `Oi oi oi <@${user.id}>!!`,
                    embeds: [embed],
                    components: [nutNhaptuoi],
                });
            }
        } catch (error) {
            console.error('⚠️ Lỗi khi gửi tin nhắn:', error);
            return;
        }

        if (!reply) {
            console.error('⚠️ Không thể tạo collector vì reply null.');
            return;
        }

        // Tao Collector de xu ly button clicks
        const filter = (i: MessageComponentInteraction) => i.user.id === targetUser.id
        const collector = reply.createMessageComponentCollector({
            filter,
            time: 60000,
            componentType: ComponentType.Button,
        });

        let age: number | undefined;
        collector.on('collect', async (interaction: ButtonInteraction) => {
            try {
                if (interaction.customId === 'tinhtuoi_button') {
                    const calculatedAge = await this.showModal(interaction, user, nutTinhlai, reply);
                    if (calculatedAge !== undefined)
                        age = calculatedAge;
                } 
            } catch (error) {
                console.error('⚠️ Lỗi khi xử lý button interaction:', error);
                throw (error);
            }
        });        

        collector.on('end', async () => {
            try {
                const updatedRow = new ActionRowBuilder<ButtonBuilder>().addComponents(nhaptuoiButton.setDisabled(true));
        
                await reply.edit({
                    content: '⚠️ Hết thời gian! Dùng lệnh `/tinhtuoi` hoặc `69!tinhtuoi` để thử lại!',
                    components: [updatedRow]
                });
            } catch (error) {
                console.error('⚠️ Lỗi khi chỉnh sửa tin nhắn:', error);
                throw (error);
            }
        });
    }

    // Phuong thuc hien thi Modal (dung chung cho Slash va Prefix)
    private async showModal(interaction: ChatInputCommandInteraction | ButtonInteraction, user: User, nutTinhlai: ActionRowBuilder<ButtonBuilder>, reply: Message<boolean>  ): Promise<number | undefined> {
        const modal = new ModalBuilder()
            .setCustomId('tinhtuoi_modal')
            .setTitle('Máy Tính Tuổi Thông Minh');
    
        const ageInput = new TextInputBuilder()
            .setCustomId('age')
            .setLabel('Nhập tuổi của bạn')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('Ví dụ: 18')
            .setRequired(true)
            .setMaxLength(3);
    
        const actionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(ageInput);
        modal.addComponents(actionRow);

        try {
            await interaction.showModal(modal);

            // Tao Collector de xu ly modal
            const filter = (i: ModalSubmitInteraction) => i.customId === 'tinhtuoi_modal' && i.user.id === interaction.user.id;
            const modalInteraction = await interaction.awaitModalSubmit({ filter, time: 60000 }).catch(() => null);
    
            if (!modalInteraction) {
                console.log('⚠️ Người dùng không phản hồi modal hoặc modal đã hết hạn.');
                return;
            }
    
            const ageStr = modalInteraction.fields.getTextInputValue('age');
            const age = parseInt(ageStr, 10);
    
            if (isNaN(age)) {
                await modalInteraction.reply({ content: '🚫 Tuổi không hợp lệ!', flags: 64 }).catch(() => {});
                return;
            }

            if (age < 0) {
                await modalInteraction.reply({ content: '🚫 Bruhhh, quá trình sinh học của anh bạn phát triển ngược hả 💀', flags: 64 }).catch(() => {});
                return;
            }

            if (age > 122) {
                await modalInteraction.reply({ content: '🚫 Người sống thọ nhất thế giới mới chỉ 122 tuổi thôi anh bạn ☠️', flags: 64 }).catch(() => {});
                return;
            }
    
            await modalInteraction.deferReply();
            await modalInteraction.editReply({ content: '```🔄 Máy tính tuổi thông minh đang xử lý...```'});

            const updateProgress = async (progress: number, delay: number) => {
                setTimeout(async () => {
                    await modalInteraction.editReply({ content: `\`\`\`🔄 Máy tính tuổi thông minh đang xử lý (${progress}%)...\`\`\`` }).catch(() => {});
                }, delay);
            };

            // Timeout xu ly
            updateProgress(5, 500);
            updateProgress(12, 1000);
            updateProgress(25, 1500);
            updateProgress(43, 2000);
            updateProgress(57, 2500);
            updateProgress(72, 3000);
            updateProgress(86, 3500);
            updateProgress(95, 4000);
            updateProgress(100, 4500);

            let resultMessage: Message<boolean>;
            setTimeout(async () => {
                const resultEmbed = this.calculateAge(age, user);
                try {
                    resultMessage = await modalInteraction.editReply({
                        content: `Oi oi oi <@${user.id}>!!`,
                        embeds: [resultEmbed], 
                        components: [nutTinhlai],
                    });

                    const filter = (i: ButtonInteraction) => i.customId === 'tinhlai_button' && i.user.id === user.id;
                    const collector = resultMessage.createMessageComponentCollector({
                        filter,
                        time: 60000,
                        componentType: ComponentType.Button,
                    });
            
                    let count = 0;
                    collector.on('collect', async (interaction: ButtonInteraction) => {
                        try {
                            await interaction.deferUpdate();
                            const resultEmbed = this.calculateAgain(count + 1, age, user);
                            await interaction.editReply({
                                content: `Oi oi oi <@${user.id}>!!`,
                                embeds: [resultEmbed],
                                components: [nutTinhlai],
                            });
                            count++;
                        } catch (error) {
                            console.error('Lỗi khi xử lý nút Tính lại:', error);
                        }
                    });
            
                    collector.on('end', async () => {
                        try {
                            const disabledNutTinhlai = new ActionRowBuilder<ButtonBuilder>().addComponents(nutTinhlai.components[0].setDisabled(true));

                            await resultMessage.edit({
                                content: `Oi oi oi <@${user.id}>!!`,
                                embeds: [resultEmbed],
                                components: [disabledNutTinhlai],
                            });
                        } catch (error) {
                            console.error('⚠️ Lỗi khi kết thúc collector Embed 2:', error);
                            throw error;
                        }
                    });
                } catch (error) {
                    console.log('⚠️ Lỗi khi gửi kết quả xử lý 100 %:', error);
                    throw error;
                }
            }, 5000);
            return age;
        } catch (error) {
            console.error('⚠️ Lỗi khi xử lý modal:', error);
            throw (error);
        }
    }

    // Tinh tuoi (thuat toan sieu phuc tap oach xa lach vkl)
    private calculateAge(age: number, user: User): EmbedBuilder {
        let returnDescription : string;
        if (age === 0)
            returnDescription = `# Bạn hiện tại **${age} tuổi**, <@${user.id}>! 🎉\n*(Anh bạn còn chưa cai sữa mẹ 🍼💀💀☠️)*`;
        else if (age === 122)
            returnDescription = `# Bạn hiện tại **${age} tuổi**, <@${user.id}>! 🎉\n*(Bro nghĩ mình sống thọ nhất thế giới 💀☠️🗣️🔥)*`;
        else
            returnDescription = `# Bạn hiện tại **${age} tuổi**, <@${user.id}>! 🎉`;

        return new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle('✅ Kết Quả')
            .setDescription(returnDescription)
            .setTimestamp();
    }

    // Tinh lai tuoi da nhap (may con ga thi biet cai j)
    private calculateAgain(count: number, age: number, user: User): EmbedBuilder {
        return new EmbedBuilder()
            .setColor(0x00FFFF)
            .setTitle('✅ Kết Quả Tính Lại')
            .setDescription(`Bạn đã nhấn cái nút này **${count}** lần, tuổi của bạn vẫn là **${age}** tuổi, <@${user.id}>!`)
            .setTimestamp();
    }
}   