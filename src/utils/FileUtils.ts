import { Message, ChatInputCommandInteraction, MessageComponentInteraction, ModalSubmitInteraction, EmbedBuilder } from 'discord.js';
import type { Interaction } from 'discord.js';
import fs from 'fs';
import path from 'path';

export class FileUtils {
    static readFile(filePath: string): string | null {
        const fullPath = path.resolve(__dirname, '../textFiles', filePath);
        try {
            return fs.readFileSync(fullPath, 'utf-8');
        } catch (error) {
            console.error(`Lỗi đọc file ${filePath}:`, error);
            return null;
        }
    }

    static async sendFileContent(
        interactionOrMessage: Message | Interaction, 
        filePath: string, 
        customMessage?: string
    ): Promise<void> {
        const content = this.readFile(filePath);
        if (!content) {
            await this.reply(interactionOrMessage, '⚠️ Không thể đọc nội dung file!');
            return;
        }

        const embed = this.createEmbed(filePath, content);
        await this.reply(interactionOrMessage, customMessage || '', embed);
    }

    // Ham tao tin nhan Embed (neu can dung)
    private static createEmbed(title: string, content: string): EmbedBuilder {
        return new EmbedBuilder()
            .setTitle(`📜 ${title}`)
            .setDescription(content.length > 4000 ? content.slice(0, 4000) + '...' : content)
            .setColor(0x00ff00);
    }

    private static async reply(
        interactionOrMessage: Message | Interaction, 
        message: string, 
        embed?: EmbedBuilder
    ): Promise<void> {
        if (interactionOrMessage instanceof Message) {
            await interactionOrMessage.reply({ content: message, embeds: embed ? [embed] : [] });
            return;
        }
    
        const options = { content: message, embeds: embed ? [embed] : [] };
    
        if (
            interactionOrMessage instanceof ChatInputCommandInteraction ||
            interactionOrMessage instanceof MessageComponentInteraction ||
            interactionOrMessage instanceof ModalSubmitInteraction
        ) {
            if (interactionOrMessage.replied || interactionOrMessage.deferred)
                await interactionOrMessage.followUp({ ...options, flags: 64 });
            else
                await interactionOrMessage.reply({ ...options, flags: 64 });
        }
    }
}
