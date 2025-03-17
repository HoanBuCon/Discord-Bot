import { Message, ChatInputCommandInteraction, MessageComponentInteraction, ModalSubmitInteraction, EmbedBuilder, AttachmentBuilder } from 'discord.js';
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
        if (customMessage)
            await this.reply(interactionOrMessage, customMessage, embed);
        else
            await this.reply(interactionOrMessage, '', embed);
    }

    // Phuong thuc gui Media (dung chung cho nhieu lenh, lenh nao khong can dung thi ke me no <("))
    static async sendMedia(
        interactionOrMessage: Message | Interaction,
        mediaFileName: string,
        mediaDir: string,
        content?: string,
        embed?: EmbedBuilder,
        components?: any[]
    ): Promise<Message> {
        const mediaPath = path.resolve(__dirname, mediaDir, mediaFileName);
        
        try {
            await fs.access(mediaPath);
        } catch (error) {
            console.error(`⚠️ File ${mediaFileName} không tồn tại trong thư mục media:`, error);
            throw new Error(`File ${mediaFileName} không tồn tại!`);
        }

        const attachment = new AttachmentBuilder(mediaPath, { name: mediaFileName });
        const messageOptions: any = {
            files: [attachment],
        };

        if (content)
            messageOptions.content = content;
        if (embed)
            messageOptions.embeds = [embed];
        if (components)
            messageOptions.components = components;

        let response: Message;
        if (interactionOrMessage instanceof Message)
            response = await interactionOrMessage.reply(messageOptions) as Message;
        else if (interactionOrMessage instanceof ChatInputCommandInteraction || interactionOrMessage instanceof MessageComponentInteraction || interactionOrMessage instanceof ModalSubmitInteraction) {
            await interactionOrMessage.reply(messageOptions);
            response = await interactionOrMessage.fetchReply();
        } else
            throw new Error('Loại Interaction này không hỗ trợ reply hoặc fetchReply!');

        return response;
    }

    // CHU Y: 3 PHUONG THUC RANDOM MEDIA BEN DUOI TOI TACH RIENG THAY VI GOP LAI DE SAU NAY TUY CHINH RIENG CHO TUNG LENH DE DANG HON
    // Random Media (dung chung neu can) (HIEN TAI KHONG CO LENH NAO DUNG PHUONG THUC NAY)
    static async sendRandomMedia(
        interactionOrMessage: Message | Interaction,
        content?: string,
        embed?: EmbedBuilder,
        components?: any[]
    ): Promise<Message> {
        const mediaDir = path.resolve(__dirname, '../commands/botCommands/dataFiles/media/memeSayGex'); // Thay doi duong dan folder media neu dung den
        let files: string[];
    
        try {
            files = await fs.readdir(mediaDir);
        } catch (error) {
            console.error('⚠️ Lỗi khi đọc thư mục memeSayGex:', error);
            throw new Error('Không thể đọc thư mục media!');
        }
    
        // Loc dinh dang cac file
        const mediaFiles = files.filter(file => /\.(jpg|png|gif|mp4|mov)$/i.test(file));
        if (mediaFiles.length === 0)
            throw new Error('⚠️ Không có file media nào trong thư mục!');
    
        // Chon ngau nhien 1 file
        const randomFile = mediaFiles[Math.floor(Math.random() * mediaFiles.length)];
        return this.sendMedia(interactionOrMessage, randomFile, mediaDir, content, embed, components);
    }

    // Random meme cho SuaCommand
    static async sendRandomSuaMedia(
        interactionOrMessage: Message | Interaction,
        content?: string,
        embed?: EmbedBuilder,
        components?: any[]
    ): Promise<Message> {
        const mediaDir = path.resolve(__dirname, '../commands/botCommands/dataFiles/media/suaCommandMeme');
        let files: string[];
        
        try {
            files = await fs.readdir(mediaDir);
        } catch (error) {
            console.error('⚠️ Lỗi khi đọc thư mục suaCommandMeme:', error);
            throw new Error('Không thể đọc thư mục media!');
        }

        // Loc dinh dang cac file
        const mediaFiles = files.filter(file => /\.(jpg|png|gif|mp4|mov)$/i.test(file));
        if (mediaFiles.length === 0)
            throw new Error('⚠️ Không có file media nào trong thư mục suaCommandMeme!');

        // Chon ngau nhien 1 file
        const randomFile = mediaFiles[Math.floor(Math.random() * mediaFiles.length)];
        return this.sendMedia(interactionOrMessage, randomFile, mediaDir, content, embed, components);
    }

    // Random meme cho MmbCommand
    static async sendRandomMmbMedia(
        interactionOrMessage: Message | Interaction,
        content?: string,
        embed?: EmbedBuilder,
        components?: any[]
    ): Promise<Message> {
        const mediaDir = path.resolve(__dirname, '../commands/botCommands/dataFiles/media/mmbCommandMeme');
        let files: string[];
        
        try {
            files = await fs.readdir(mediaDir);
        } catch (error) {
            console.error('⚠️ Lỗi khi đọc thư mục mmbCommandMeme:', error);
            throw new Error('Không thể đọc thư mục media!');
        }

        // Loc dinh dang cac file
        const mediaFiles = files.filter(file => /\.(jpg|png|gif|mp4|mov)$/i.test(file));
        if (mediaFiles.length === 0)
            throw new Error('⚠️ Không có file media nào trong thư mục mmbCommandMeme!');

        // Chon ngau nhien 1 file
        const randomFile = mediaFiles[Math.floor(Math.random() * mediaFiles.length)];
        return this.sendMedia(interactionOrMessage, randomFile, mediaDir, content, embed, components);
    }

    // Phuong thuc random meme (chi hoat dong voi SaygexmemeCommand.ts)
    static async getRandomSayGexFile(): Promise<{ fileName: string }> {
        const mediaDir = path.resolve(__dirname, '../commands/botCommands/dataFiles/media/memeSayGex');

        try {
            const files = await fs.readdir(mediaDir);
            const mediaFiles = files.filter(file => /\.(jpg|png|gif|mp4|mov)$/i.test(file));

            if (mediaFiles.length === 0)
                throw new Error('⚠️ Không có file media nào trong thư mục memeSayGex!');

            const randomFile = mediaFiles[Math.floor(Math.random() * mediaFiles.length)];
            return { fileName: randomFile };
        } catch (error) {
            console.error('⚠️ Lỗi khi đọc thư mục memeSayGex:', error);
            throw new Error('Không thể đọc thư mục media!');
        }
    }

    // Phuong thuc tao tin nhan Embed (neu can dung)
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
    
        if (interactionOrMessage instanceof ChatInputCommandInteraction || interactionOrMessage instanceof MessageComponentInteraction || interactionOrMessage instanceof ModalSubmitInteraction) {
            if (interactionOrMessage.replied || interactionOrMessage.deferred)
                await interactionOrMessage.followUp({ ...options, flags: 64 });
            else
                await interactionOrMessage.reply({ ...options, flags: 64 });
        }
    }
}
