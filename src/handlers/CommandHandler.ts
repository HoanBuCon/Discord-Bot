import { ChatInputCommandInteraction, Message, Client } from 'discord.js';
import type { ICommand } from '../interfaces/ICommand.ts';
import { FileUtils } from '../utils/FileUtils.ts';
import { HelpCommand } from '../commands/botCommands/HelpCommand.ts';
import { SuaCommand } from '../commands/botCommands/SuaCommand.ts';
import { LiemCommand } from '../commands/botCommands/LiemCommand.ts';
import { MmbCommand } from '../commands/botCommands/MmbCommand.ts';
import { KickCommand } from '../commands/botCommands/KickCommand.ts';
import { BanCommand } from '../commands/botCommands/BanCommand.ts';
import { UnbanCommand } from '../commands/botCommands/UnbanCommand.ts';
import { MuteCommand } from '../commands/botCommands/MuteCommand.ts';
import { UnmuteCommand } from '../commands/botCommands/UnmuteCommand.ts';
import { TictactoeCommand } from '../commands/botCommands/TictactoeCommand.ts';
import { MoveCommand } from '../commands/botCommands/MoveEndCommand.ts';
import { EndTicTacToeCommand } from '../commands/botCommands/MoveEndCommand.ts';
import { TinhtuoiCommand } from '../commands/botCommands/TinhtuoiCommand.ts';
import { SaygexmemeCommand } from '../commands/botCommands/SaygexmemeCommand.ts';
import { DonutCommand } from '../commands/botCommands/DonutCommand.ts';
import { ChatBotCommand, EndChatBotCommand } from '../commands/botCommands/ChatBotCommand.ts';

export class CommandHandler {
    private commands: Map<string, ICommand>;
    private client: Client;

    constructor(client: Client) {
        this.commands = new Map();
        this.client = client;
        this.registerDefaultCommands();
    }

    private registerDefaultCommands(): void {
        this.registerCommand(new HelpCommand());
        this.registerCommand(new SuaCommand());
        this.registerCommand(new LiemCommand(), 'liem');
        this.registerCommand(new MmbCommand(), 'mmb');
        this.registerCommand(new KickCommand());
        this.registerCommand(new BanCommand());
        this.registerCommand(new UnbanCommand());
        this.registerCommand(new MuteCommand());
        this.registerCommand(new UnmuteCommand());
        this.registerCommand(new TictactoeCommand());
        this.registerCommand(new MoveCommand());
        this.registerCommand(new EndTicTacToeCommand());
        this.registerCommand(new TinhtuoiCommand());
        this.registerCommand(new SaygexmemeCommand(), 'meme');
        this.registerCommand(new DonutCommand());
        this.registerCommand(new ChatBotCommand(this.client));
        this.registerCommand(new EndChatBotCommand(this.client));
    }

    private registerCommand(command: ICommand, alias?: string): void {
        const name = command.getName();
        if (this.commands.has(name)) {
            console.warn(`⚠️ Lệnh "${name}" đã tồn tại!`);
            return;
        }
        this.commands.set(name, command);

        if (alias)
            this.commands.set(alias, command);
    }

    async handleCommand(interactionOrMessage: ChatInputCommandInteraction | Message, commandName: string, args?: string[]): Promise<void> {
        let guild = null;

        // Lay guild tu slash command hoac prefix command
        if (interactionOrMessage instanceof ChatInputCommandInteraction)
            guild = interactionOrMessage.guild;
        else if (interactionOrMessage instanceof Message)
            guild = interactionOrMessage.guild;

        console.log(`🔧 Xử lý lệnh "${commandName}" tại server "${guild?.name}"`);

        const command = this.commands.get(commandName);
        if (!command) {
            if (interactionOrMessage instanceof Message) {
                await interactionOrMessage.reply('🚫 Tao đêl có lệnh đó 🫦');
                const isSlashCommand = interactionOrMessage instanceof ChatInputCommandInteraction;
                await FileUtils.sendMultiFileContent(interactionOrMessage, ['HelpCommand_Part1.txt', 'HelpCommand_Part2.txt'], '', isSlashCommand, !isSlashCommand);
            }
            return;
        }
    
        await command.execute(interactionOrMessage, args);
    }
}