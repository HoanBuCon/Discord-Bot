import { Client, GatewayIntentBits, ActivityType } from 'discord.js';
import dotenv from 'dotenv';
import { CommandHandler } from './handlers/CommandHandler.ts';
import { PrefixHandler } from './handlers/PrefixHandler.ts';
import { SlashHandler } from './handlers/SlashHandler.ts';
import { UnmuteService } from './utils/UnmuteService.ts';
import { UnbanService } from './utils/UnbanService.ts';
import { DeployCommand } from './utils/DeployCommand.ts';
import { TictactoeDataManager } from './utils/TictactoeDataManager.ts';

dotenv.config();

const botToken = process.env.DISCORD_BOT_TOKEN;
if (!botToken) { 
    console.error("⚠️ Lỗi: Không tìm thấy TOKEN trong file .env!");
    process.exit(1);
}

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
    ],
});

const deployer = new DeployCommand();
const commandHandler = new CommandHandler(client);
const prefixHandler = new PrefixHandler(commandHandler, '69!');
const slashHandler = new SlashHandler(commandHandler);

client.once('ready', async () => {
    console.log(`✅ Bot đã đăng nhập thành công với tên: ${client.user?.tag}`);
    
    // await deployer.registerCommands(); // NEU DA DANG KY SLASH TRUOC DO THI COMMENT DONG NAY LAI

    client.user?.setActivity('mẹ bạn', { type: ActivityType.Playing });
    client.user?.setStatus('online');

    TictactoeDataManager.clearAllData();
    await UnbanService.checkAndUnbanUsers(client);
    await UnmuteService.checkAndUnmuteUsers(client);
});

client.on('ready', () => {
    prefixHandler.initialize(client);
    slashHandler.initialize(client);
});

client.on('error', (error) => {
    console.error('⚠️ Lỗi bot:', error);
});

client.login(botToken).catch((error) => {
    console.error('⚠️ Lỗi đăng nhập:', error);
});