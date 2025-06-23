import { ChatInputCommandInteraction, Message, GuildMember, EmbedBuilder, ComponentType, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageComponentInteraction } from 'discord.js';
import { Command } from '../Command.ts';
import { PermissionUtils } from '../../utils/PermissionUtils.ts';

export class LiemCommand extends Command {
    constructor() {
        super('ongliem', 'Biết ông Liêm không ? 🐧');
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
                await interactionOrMessage.reply({ content: `# Liem 2 hon dai tao <@${member.id}> 🍆☢️☢️🫦💦`, flags: 64 });
            else
                await interactionOrMessage.reply(`# Liem 2 hon dai tao <@${member.id}> 🍆☢️☢️🫦💦`);
            return;
        }

        // Neu User duoc mention la bot khac
        if (user.bot) {
            if (interactionOrMessage instanceof ChatInputCommandInteraction)
                await interactionOrMessage.reply({ content: 'Hỏi đứa khác đi bro, đồng bọn của tôi đều biết ông Liêm 🫦', flags: 64 });
            else
                await interactionOrMessage.reply('Hỏi đứa khác đi bro, đồng bọn của tôi đều biết ông Liêm 🫦');
            return;
        }

        // Build Embed
        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle(`👀 Biết ông Liêm không ?`)
            .setDescription(`*(Đây là câu hỏi cực kỳ quan trọng!)*`)
            .setTimestamp();
            
        // Build Button
        const buttons = new ActionRowBuilder<ButtonBuilder>()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('liem_nao')
                    .setLabel('Liêm nào ?')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('liem_dai')
                    .setLabel('Liem 2 hon dai tao')
                    .setStyle(ButtonStyle.Primary)
            );

        // Gui Embed cung Button
        let response: Message;
        if (interactionOrMessage instanceof ChatInputCommandInteraction) {
            await interactionOrMessage.reply({ 
                content: `Này cô nương dễ thương <@${user.id}>~!!`, 
                embeds: [embed], 
                components: [buttons],
            });
            response = await interactionOrMessage.fetchReply();
        } else {
            response = await interactionOrMessage.reply({ 
                content: `Này cô nương dễ thương <@${user.id}>~!!`, 
                embeds: [embed], 
                components: [buttons],
            }) as Message;
        }

        // Tao Collector de xu ly button clicks
        const filter = (i: MessageComponentInteraction) => i.user.id === user!.id;
        const collector = response.createMessageComponentCollector({ 
            filter, 
            time: 60000,
            componentType: ComponentType.Button,
        });

        collector.on('collect', async (interaction) => {
            if (interaction.customId === 'liem_nao') {
                await interaction.update({
                    embeds: [new EmbedBuilder()
                        .setColor('#00ff00')
                        .setTitle('💦')
                        .setDescription(`# Liem 2 hon dai tao <@${user.id}> 🍆☢️☢️🫦💦`)
                    ],
                    components: [
                        new ActionRowBuilder<ButtonBuilder>().addComponents(
                            new ButtonBuilder()
                                .setCustomId('liem_nao')
                                .setLabel('Liêm nào ?')
                                .setStyle(ButtonStyle.Primary)
                                .setDisabled(true),
                            new ButtonBuilder()
                                .setCustomId('liem_dai')
                                .setLabel('Liem 2 hon dai tao')
                                .setStyle(ButtonStyle.Primary)
                                .setDisabled(true)
                        )
                    ]
                });
            } else if (interaction.customId === 'liem_dai') {
                await interaction.update({
                    embeds: [new EmbedBuilder()
                        .setColor('#ff0000')
                        .setTitle('🤬')
                        .setDescription(`# Sua con cac, <@${user.id}> 🤬🤬🌶️💢`)
                    ],
                    components: [
                        new ActionRowBuilder<ButtonBuilder>().addComponents(
                            new ButtonBuilder()
                                .setCustomId('liem_nao')
                                .setLabel('Liêm nào ?')
                                .setStyle(ButtonStyle.Primary)
                                .setDisabled(true),
                            new ButtonBuilder()
                                .setCustomId('liem_dai')
                                .setLabel('Liem 2 hon dai tao')
                                .setStyle(ButtonStyle.Primary)
                                .setDisabled(true)
                        )
                    ]
                });
            }
        });

        collector.on('end', async () => {
            if (response.components.length > 0) {
                await response.edit({
                    components: [
                        new ActionRowBuilder<ButtonBuilder>().addComponents(
                            new ButtonBuilder()
                                .setCustomId('liem_nao')
                                .setLabel('Liêm nào ?')
                                .setStyle(ButtonStyle.Primary)
                                .setDisabled(true),
                            new ButtonBuilder()
                                .setCustomId('liem_dai')
                                .setLabel('Liem 2 hon dai tao')
                                .setStyle(ButtonStyle.Primary)
                                .setDisabled(true)
                        )
                    ]
                });
            }
        });
    }
}