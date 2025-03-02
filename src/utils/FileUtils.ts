import { Message, ChatInputCommandInteraction, MessageComponentInteraction, ModalSubmitInteraction, EmbedBuilder } from 'discord.js';
import type { Interaction } from 'discord.js';
import fs from 'fs/promises';
import path from 'path';

export class FileUtils {
    static async readFile(filePath: string): Promise<string | null> {
        const fullPath = path.resolve(__dirname, '../textFiles', filePath);
        try {
            return await fs.readFile(fullPath, 'utf-8');
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
        const content = await this.readFile(filePath);
        if (!content) {
            await this.reply(interactionOrMessage, '⚠️ Không thể đọc nội dung file!');
            return;
        }

        const embed = this.createEmbed(filePath, content);
        if (customMessage) {
            await this.reply(interactionOrMessage, customMessage, embed);
        } else {
            await this.reply(interactionOrMessage, '', embed);
        }
    }

    // Ham tao tin nhan Embed (neu can dung)
    private static createEmbed(title: string, content: string): EmbedBuilder {
        let truncatedContent: string;
    
        if (content.length > 4000)
            truncatedContent = content.slice(0, 4000) + '...';
        else
            truncatedContent = content;
    
        return new EmbedBuilder()
            .setTitle(`📜 ${title}`)
            .setDescription(truncatedContent)
            .setColor(0x00ff00);
    }

    private static async reply(
        interactionOrMessage: Message | Interaction, 
        message: string, 
        embed?: EmbedBuilder
    ): Promise<void> {
        if (interactionOrMessage instanceof Message) {
            let embedsArray = [];
            if (embed)
                embedsArray.push(embed);
            await interactionOrMessage.reply({ content: message, embeds: embedsArray });
            return;
        }
    
        let embedsArray = [];
        if (embed)
            embedsArray.push(embed);
        const options = { content: message, embeds: embedsArray };
    
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
