import { ChatInputCommandInteraction, Message } from 'discord.js';
import type { ICommand } from '../interfaces/ICommand';
import { FileUtils } from '../utils/FileUtils';
import { HelpCommand } from '../commands/botCommands/HelpCommand';
import { SuaCommand } from '../commands/botCommands/SuaCommand';
import { LiemCommand } from '../commands/botCommands/LiemCommand';
import { MmbCommand } from '../commands/botCommands/MmbCommand';
import { KickCommand } from '../commands/botCommands/KickCommand';
import { BanCommand } from '../commands/botCommands/BanCommand';
import { UnbanCommand } from '../commands/botCommands/UnbanCommand';
import { MuteCommand } from '../commands/botCommands/MuteCommand';
import { UnmuteCommand } from '../commands/botCommands/UnmuteCommand';
import { TictactoeCommand } from '../commands/botCommands/TictactoeCommand';
import { MoveCommand } from '../commands/botCommands/MoveEndCommand';
import { EndTicTacToeCommand } from '../commands/botCommands/MoveEndCommand';

export class CommandHandler {
    private commands: Map<string, ICommand>;

    constructor() {
        this.commands = new Map();
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