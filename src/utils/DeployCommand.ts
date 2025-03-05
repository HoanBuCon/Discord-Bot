import { REST, Routes, SlashCommandBuilder, Client } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

export class DeployCommand {
    private rest: REST;
    private clientId: string;
    private botToken: string;

    constructor() {
        this.clientId = process.env.CLIENT_ID || '';
        this.botToken = process.env.DISCORD_BOT_TOKEN || '';

        if (!this.clientId || !this.botToken)   
            throw new Error('CLIENT_ID hoặc DISCORD_BOT_TOKEN không được định nghĩa!');

        this.rest = new REST({ version: '10' }).setToken(this.botToken);
    }

    private getCommands() {
        return [
            new SlashCommandBuilder()
                .setName('help')
                .setDescription('Hiển thị danh sách các lệnh'),

            new SlashCommandBuilder()
                .setName('sua')
                .setDescription('Counter con doggo vừa cắn bạn 🐧')
                .addUserOption(option => 
                    option.setName('user')
                        .setDescription('Chọn con doggo vừa cắn bạn')
                        .setRequired(false)),

            new SlashCommandBuilder()
                .setName('ongliem')
                .setDescription('Biết ông Liêm không ? 🐧')
                .addUserOption(option => 
                    option.setName('user')
                        .setDescription('Chọn người để hỏi về ông Liêm')
                        .setRequired(false)),

            new SlashCommandBuilder()
                .setName('memaybeo')
                .setDescription('Phản Dmg khi có thằng chửi mẹ bạn 🐧')
                .addUserOption(option => 
                    option.setName('user')
                        .setDescription('Chọn thằng vừa chửi mẹ bạn')
                        .setRequired(false)),

            new SlashCommandBuilder()
                .setName('ban')
                .setDescription('Ban người dùng khỏi server')
                .addUserOption(option => 
                    option.setName('user')
                        .setDescription('Người dùng bị ban')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('duration')
                        .setDescription('Thời gian ban (m = phút | h = giờ | d = ngày | inf = vĩnh viễn)')
                        .setRequired(false)),

            new SlashCommandBuilder()
                .setName('unban')
                .setDescription('Gỡ ban một người dùng khỏi server')
                .addStringOption(option =>
                    option.setName('userid')
                        .setDescription('ID của người dùng cần unban')
                        .setRequired(false))
                .addStringOption(option =>
                    option.setName('all')
                        .setDescription('Unban tất cả người dùng')
                        .setRequired(false)
                        .addChoices({ name: 'all', value: 'all' })),

            new SlashCommandBuilder()
                .setName('kick')
                .setDescription('Kick người dùng khỏi server')
                .addUserOption(option => 
                    option.setName('user')
                        .setDescription('Người dùng bị kick')
                        .setRequired(true)),

            new SlashCommandBuilder()
                .setName('mute')
                .setDescription('Mute một thành viên.')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('Người dùng bị mute')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('duration')
                        .setDescription('Thời gian mute (m = phút | h = giờ | d = ngày | inf = vĩnh viễn)')
                        .setRequired(false)),

            new SlashCommandBuilder()
                .setName('unmute')
                .setDescription('Gỡ Mute người dùng trong server')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('Người dùng cần unmute')
                        .setRequired(false))
                .addStringOption(option =>
                    option.setName('all')
                        .setDescription('Unmute tất cả người dùng')
                        .setRequired(false)
                        .addChoices({ name: 'all', value: 'all' })),

            new SlashCommandBuilder()
                .setName('tictactoe')
                .setDescription('Gạ kèo solo minigame Tic Tac Toe với thành viên trong server')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('Người dùng được gạ kèo solo')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('board')
                        .setDescription('Chọn kích thước bàn cờ')
                        .setRequired(false)
                        .addChoices(
                            { name: '3x3', value: '3' },
                            { name: '5x5', value: '5' })),

            new SlashCommandBuilder()
                .setName('move')
                .setDescription('Đánh một nước đi đến tọa độ chỉ định trong Tic Tac Toe')
                .addIntegerOption(option =>
                    option.setName('x')
                        .setDescription('Tọa độ X (cột)')
                        .setRequired(true))
                .addIntegerOption(option =>
                    option.setName('y')
                        .setDescription('Tọa độ Y (hàng)')
                        .setRequired(true)),

            new SlashCommandBuilder()
                .setName('endtictactoe')
                .setDescription('Dừng trận đấu Tic Tac Toe đang diễn ra'),
        ].map(command => command.toJSON());
    }

    async registerCommands() {
        try {
            console.log('🔄 Đang đăng ký lệnh Slash...');

            await this.rest.put(Routes.applicationCommands(this.clientId), {
                body: this.getCommands(),
            });

            console.log('✅ Đăng ký lệnh Slash thành công!');
        } catch (error) {
            console.error('⚠️ Lỗi khi đăng ký lệnh Slash:', error);
            throw error;
        }
    }
}
