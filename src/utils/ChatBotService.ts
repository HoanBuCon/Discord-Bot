import { Client, Message, TextChannel } from 'discord.js';
import { HfInference } from '@huggingface/inference';
import * as dotenv from 'dotenv';

dotenv.config();

// Kiem tra va khoi tao client Hugging Face
const HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY;
if (!HUGGINGFACE_API_KEY) {
    console.error('[ChatBot] Lỗi: HUGGINGFACE_API_KEY không được thiết lập trong .env');
    throw new Error('HUGGINGFACE_API_KEY is required');
}

const hf = new HfInference(HUGGINGFACE_API_KEY);
const responseCache = new Map<string, { response: string; timestamp: number }>();
const REQUEST_LIMIT_PER_MINUTE = 20;
const requestCounts = new Map<string, { count: number; lastReset: number }>();

const MAX_RESPONSE_LENGTH = 1000;

const DEFAULT_RESPONSES = [
    "Nani?! Tôi không hiểu gì cả!",
    "Ehhh?! Anh đang nói gì vậy?",
    "Uwaa~ Bất ngờ ghê Onii-chan!",
    "Sugoi! Thú vị ha!",
    "Yare yare... Tôi không biết gì cả thưa tiểu thư.",
    "Nandayo?! Khó hiểu ghê!",
    "Hontou ni?! Thật không thể tin được!",
    "Maji de?! Bạn nghiêm túc hả?",
    "Sou ka... Tôi hiểu rồi!",
    "Yosh! Hãy thử lại nhé!",
    "Cái đéo gì cơ thằng mọi đen ?",
];

const CACHE_MAX_SIZE = 1000;
const CACHE_EXPIRY_TIME = 60 * 60 * 1000; // 1 gio

// Them bien de theo doi trang thai API
let apiErrorCount = 0;
const MAX_API_ERRORS = 5;
let isApiAvailable = true;

// Them ham kiem tra API
async function checkApiAvailability(): Promise<boolean> {
    if (!isApiAvailable) {
        return false;
    }
    
    try {
        // Thu goi API don gian de kiem tra
        await hf.textGeneration({
            model: 'mistralai/Mistral-7B-Instruct-v0.2',
            inputs: 'test',
            parameters: {
                max_length: 10,
                temperature: 0.1,
            }
        });
        apiErrorCount = 0;
        return true;
    } catch (error) {
        apiErrorCount++;
        if (apiErrorCount >= MAX_API_ERRORS) {
            isApiAvailable = false;
            console.error('[ChatBot] API không khả dụng, chuyển sang chế độ phản hồi mặc định');
        }
        return false;
    }
}

function cleanupCache() {
    const now = Date.now();
    for (const [key, value] of responseCache.entries()) {
        if (now - value.timestamp > CACHE_EXPIRY_TIME) {
            responseCache.delete(key);
        }
    }
    
    // Neu van con qua nhieu cache, xoa bot di
    if (responseCache.size > CACHE_MAX_SIZE) {
        const entriesToDelete = responseCache.size - CACHE_MAX_SIZE;
        const oldestEntries = Array.from(responseCache.entries())
            .sort((a, b) => a[1].timestamp - b[1].timestamp)
            .slice(0, entriesToDelete);
        
        for (const [key] of oldestEntries) {
            responseCache.delete(key);
        }
    }
}

export class ChatBotService {
    private static instance: ChatBotService;
    private activeChatbots: Map<string, boolean>;
    private activeServers: Map<string, Set<string>>; // Map<serverId, Set<userId>>
    private client: Client;
    private conversationHistory: Map<string, { role: string; content: string }[]>; // Map<userId, { role: string; content: string }[]>
    private lastActivity: Map<string, number>; // Map<userId, timestamp>
    private readonly TIMEOUT_DURATION = 10 * 60 * 1000; // 10 phut

    private constructor(client: Client) {
        if (!client) {
            throw new Error('Client is required for ChatBotService');
        }
        this.activeChatbots = new Map<string, boolean>();
        this.activeServers = new Map<string, Set<string>>();
        this.conversationHistory = new Map<string, { role: string; content: string }[]>();
        this.lastActivity = new Map<string, number>();
        this.client = client;
        this.setupMessageListener();
        this.setupTimeoutCheck();
    }

    public static getInstance(client: Client): ChatBotService {
        if (!ChatBotService.instance) {
            if (!client) {
                throw new Error('Client is required for ChatBotService');
            }
            ChatBotService.instance = new ChatBotService(client);
        }
        return ChatBotService.instance;
    }

    public isActive(userId: string, serverId?: string): boolean {
        if (!serverId) {
            return this.activeChatbots.get(userId) || false;
        }
        
        const serverUsers = this.activeServers.get(serverId);
        return serverUsers ? serverUsers.has(userId) : false;
    }

    public activate(userId: string, serverId: string): void {
        this.activeChatbots.set(userId, true);
        
        // Them user vao danh sach active cua server
        if (!this.activeServers.has(serverId)) {
            this.activeServers.set(serverId, new Set<string>());
        }
        this.activeServers.get(serverId)!.add(userId);
        
        // Khoi tao lich su hoi thoai
        this.conversationHistory.set(userId, []);
        
        requestCounts.set(userId, { count: 0, lastReset: Date.now() });
        this.lastActivity.set(userId, Date.now());
        console.log(`[ChatBot] Đã bật chatbot cho user ${userId} trên server ${serverId}`);
    }

    public deactivate(userId: string, serverId?: string): void {
        if (serverId) {
            // Chi tat chatbot cho user tren server cu the
            const serverUsers = this.activeServers.get(serverId);
            if (serverUsers) {
                serverUsers.delete(userId);
                console.log(`[ChatBot] Đã tắt chatbot cho user ${userId} trên server ${serverId}`);
            }
            
            // Kiem tra xem user co con active tren server nao khac khong
            let isActiveOnOtherServers = false;
            for (const [otherServerId, users] of this.activeServers.entries()) {
                if (otherServerId !== serverId && users.has(userId)) {
                    isActiveOnOtherServers = true;
                    break;
                }
            }
            
            // Neu khong con active tren server nao, tat hoan toan
            if (!isActiveOnOtherServers) {
                this.activeChatbots.set(userId, false);
                requestCounts.delete(userId);
                this.conversationHistory.delete(userId);
                this.lastActivity.delete(userId);
                console.log(`[ChatBot] Đã tắt chatbot hoàn toàn cho user ${userId}`);
            }
        } else {
            // Tat chatbot cho user tren tat ca cac server
            this.activeChatbots.set(userId, false);
            requestCounts.delete(userId);
            this.conversationHistory.delete(userId);
            this.lastActivity.delete(userId);
            
            // Xoa user khoi tat ca cac server
            for (const users of this.activeServers.values()) {
                users.delete(userId);
            }
            
            console.log(`[ChatBot] Đã tắt chatbot cho user ${userId} trên tất cả các server`);
        }
    }

    private setupMessageListener(): void {
        this.client.on('messageCreate', async (message: Message) => {
            const userId = message.author.id;
            const serverId = message.guild?.id;

            // Kiem tra trang thai chatbot va bo qua tin nhan tu bot
            if (!serverId || !this.isActive(userId, serverId) || message.author.bot) return;

            console.log(`[ChatBot] Nhận tin nhắn từ @${message.author.username} trong kênh #${message.channel instanceof TextChannel ? message.channel.name : 'DM'} của server ${serverId}: ${message.content}`);

            // Kiem tra gioi han yeu cau
            const requestData = requestCounts.get(userId)!;
            const now = Date.now();
            if (now - requestData.lastReset >= 60000) { // Reset sau 1 phut
                requestData.count = 0;
                requestData.lastReset = now;
                console.log(`[ChatBot] Đã reset số lần yêu cầu cho @${message.author.username}`);
            }
            if (requestData.count >= REQUEST_LIMIT_PER_MINUTE) {
                console.log(`[ChatBot] @${message.author.username} đã vượt quá giới hạn yêu cầu`);
                await message.reply('Nani?! Bạn gửi tin nhắn nhanh quá đấy! Chờ một chút nhé!');
                return;
            }

            // kiem tra tin nhắn co phai emoji khong
            if (/^<a?:.+?:\d+>$/.test(message.content) || /^[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F100}-\u{1F1FF}\u{1F200}-\u{1F2FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{1F1E0}-\u{1F1FF}\u{2100}-\u{214F}\u{2300}-\u{23FF}\u{2B00}-\u{2BFF}\u{2900}-\u{297F}\u{2A00}-\u{2AFF}\u{2B50}\u{2934}-\u{2935}\u{3030}\u{303D}\u{3297}\u{3299}\u{FE0F}\u{200D}\u{20E3}\u{FE82}-\u{FEFF}]+$/u.test(message.content)) {
                console.log(`[ChatBot] @${message.author.username} đã gửi emoji, trả về phản hồi mặc định`);
                const randomResponse = DEFAULT_RESPONSES[Math.floor(Math.random() * DEFAULT_RESPONSES.length)];
                await message.reply(randomResponse);
                return;
            }

            // Kiem tra tin nhắn co phai media khong
            if (message.attachments.size > 0 || message.embeds.length > 0) {
                console.log(`[ChatBot] @${message.author.username} đã gửi media, trả về phản hồi mặc định`);
                const randomResponse = DEFAULT_RESPONSES[Math.floor(Math.random() * DEFAULT_RESPONSES.length)];
                await message.reply(randomResponse);
                return;
            }

            try {
                // Kiem tra tin nhắn co phai la lenh khong
                if (message.content.startsWith('69!') || message.content.startsWith('/')) {
                    return;
                }

                // Cap nhat lich su hoi thoai
                const history = this.conversationHistory.get(userId) || [];
                history.push({ role: 'user', content: message.content });
                
                // Gioi han lich su hoi thoai (giu 5 tin nhắn gần nhất)
                if (history.length > 10) {
                    history.splice(0, history.length - 10);
                }
                
                this.conversationHistory.set(userId, history);

                // Kiểm tra cache
                const cacheKey = `${userId}:${message.content}`;
                const cachedData = responseCache.get(cacheKey);
                if (cachedData) {
                    // Kiem tra xem cache con han su dung khong
                    if (Date.now() - cachedData.timestamp <= CACHE_EXPIRY_TIME) {
                        console.log(`[ChatBot] Trả lời từ cache: ${cachedData.response}`);
                        await message.reply(cachedData.response);
                        history.push({ role: 'assistant', content: cachedData.response });
                        return;
                    } else {
                        // Xoa cache het han
                        responseCache.delete(cacheKey);
                    }
                }

                console.log(`[ChatBot] Gọi API Hugging Face cho tin nhắn: ${message.content}`);

                // Tao prompt phong cach anime
                const prompt = `Bạn là SayGex69, một nhân vật anime vui tính, dễ thương và thân thiện và thường gọi đối phương là "Onii-chan". Bạn biết 2 ngôn ngữ là tiếng Anh và tiếng Việt. Hãy trả lời ngắn gọn và tự nhiên theo phong cách gái anime Nhật Bản, sử dụng các từ như "Nani", "Sugoi", "Ara ara", "Onii-chan", "Nande". Lưu ý: Chỉ trả lời bằng tiếng Anh hoặc tiếng Việt tùy vào ngôn ngữ mà đối phương đã sử dụng, KHÔNG dịch ngược lại tiếng Nhật. KHÔNG thêm phần ghi chú hoặc dịch nghĩa. KHÔNG sử dụng dấu ngoặc đơn hoặc ngoặc kép để giải thích.
                Tin nhắn: "${message.content}"
                SayGex:`;

                // Kiem tra API truoc khi goi
                if (!await checkApiAvailability()) {
                    const randomResponse = DEFAULT_RESPONSES[Math.floor(Math.random() * DEFAULT_RESPONSES.length)];
                    await message.reply(`${randomResponse}\n⚠️ API tạm thời không khả dụng (Admin hết tiền thuê model rồi)!`);
                    return;
                }

                // Goi API Hugging Face
                const response = await Promise.race([
                    hf.textGeneration({
                        model: 'mistralai/Mistral-7B-Instruct-v0.2',
                        inputs: prompt,
                        parameters: {
                            max_length: 50,
                            temperature: 0.7,
                            top_p: 0.8,
                            repetition_penalty: 1.3,
                            do_sample: true,
                            num_return_sequences: 1,
                        }
                    }),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('API timeout')), 30000))
                ]) as any;

                console.log(`[ChatBot] API Response:`, response);

                if (!response || !response.generated_text) {
                    throw new Error('Không nhận được phản hồi từ API');
                }

                // Giới hạn độ dài phản hồi
                let reply = response.generated_text;
                console.log(`[ChatBot] Generated text before processing: ${reply}`);

                // Làm sạch phản hồi
                reply = reply
                    .replace(/^SayGex:\s*/i, '')
                    .replace(/^.*?\nSayGex:/is, '')
                    .replace(/^.*?(Human|User|Người dùng):.*?\n(SayGex|Bot|Assistant):/is, '')
                    .replace(/\([^)]*\)/g, '')
                    .replace(/\[[^\]]*\]/g, '')
                    .replace(/Translation:.*$/i, '')
                    .replace(/Note:.*$/i, '')
                    .replace(/[^\p{L}\p{N}\s.,!?-]/gu, '')
                    .replace(/\s+/g, ' ')
                    .trim();

                // Gioi han do dai phan hoi toi da 50 tu (khoang 2-3 cau)
                const words = reply.split(' ');
                if (words.length > 50) {
                    reply = words.slice(0, 50).join(' ') + '...';
                }

                // Tang cuong phong cach anime neu can
                const animeEnhancers = ['Sugoi!', 'Nani?!', 'Ara ara~', 'Yosh!'];
                if (Math.random() < 0.2) {
                    reply = `${animeEnhancers[Math.floor(Math.random() * animeEnhancers.length)]} ${reply}`;
                }

                console.log(`[ChatBot] Final reply: ${reply}`);

                if (reply && reply !== message.content && reply.length > 5) {
                    const cacheKey = `${userId}:${message.content}`;
                    responseCache.set(cacheKey, {
                        response: reply,
                        timestamp: Date.now()
                    });
                    
                    // Goi cleanup sau moi lan them cache moi
                    cleanupCache();
                    
                    console.log(`[ChatBot] Gửi phản hồi từ mô hình: ${reply}`);
                    await message.reply(reply);
                    
                    // Cap nhat lich su hoi thoai voi phan hoi cua bot
                    history.push({ role: 'assistant', content: reply });
                    this.conversationHistory.set(userId, history);
                    
                    requestData.count++;
                    console.log(`[ChatBot] Số lần yêu cầu của @${message.author.username}: ${requestData.count}`);
                } else {
                    throw new Error('Phản hồi không hợp lệ');
                }
            } catch (error) {
                console.error('[ChatBot] Lỗi khi xử lý tin nhắn:', {
                    message: error instanceof Error ? error.message : 'Lỗi không xác định',
                    stack: error instanceof Error ? error.stack : undefined,
                    user: `@${message.author.username}`,
                    input: message.content,
                });
                
                // Tang so lan loi API
                apiErrorCount++;
                if (apiErrorCount >= MAX_API_ERRORS) {
                    isApiAvailable = false;
                }
                
                const randomResponse = DEFAULT_RESPONSES[Math.floor(Math.random() * DEFAULT_RESPONSES.length)];
                console.log(`[ChatBot] Gửi phản hồi mặc định: ${randomResponse}`);
                await message.reply(`${randomResponse} (API tạm thời không khả dụng)`);
                
                // Cap nhat lich su hoi thoai voi phan hoi mac dinh
                const history = this.conversationHistory.get(userId) || [];
                history.push({ role: 'assistant', content: randomResponse });
                this.conversationHistory.set(userId, history);
            }
        });
    }

    private setupTimeoutCheck(): void {
        setInterval(() => {
            const now = Date.now();
            this.lastActivity.forEach((timestamp, userId) => {
                if (now - timestamp > this.TIMEOUT_DURATION) {
                    // Tim server ID cua user
                    let serverId = '';
                    this.activeServers.forEach((users, sid) => {
                        if (users.has(userId)) {
                            serverId = sid;
                        }
                    });

                    if (serverId) {
                        console.log(`[ChatBotService] Tự động tắt chatbot cho user ${userId} do không hoạt động trong 10 phút`);
                        this.deactivate(userId, serverId);
                    }
                }
            });
        }, 60000); // Kiem tra moi phut
    }

    // Kich hoat chatbot tu lenh
    public async startChatbotFromCommand(message: Message): Promise<void> {
        const userId = message.author.id;
        const serverId = message.guild?.id;
        
        if (!serverId) {
            return;
        }
        
        if (this.isActive(userId, serverId)) {
            return;
        }

        this.activate(userId, serverId);
    }

    // Tat chatbot tu lenh
    public async stopChatbotFromCommand(message: Message): Promise<void> {
        const userId = message.author.id;
        const serverId = message.guild?.id;
        
        if (!serverId) {
            return;
        }
        
        if (!this.isActive(userId, serverId)) {
            return;
        }

        this.deactivate(userId, serverId);
    }

    private async handleMessage(message: Message): Promise<void> {
        try {
            if (!message.guild) return;
            const serverId = message.guild.id;
            const userId = message.author.id;

            if (!this.isActive(userId, serverId)) return;

            // Cap nhat thoi gian hoat dong cuoi cung
            this.lastActivity.set(userId, Date.now());

            // Kiem tra neu la emoji
            if (this.isEmojiMessage(message)) {
                const randomResponse = DEFAULT_RESPONSES[Math.floor(Math.random() * DEFAULT_RESPONSES.length)];
                await (message.channel as TextChannel).send(randomResponse);
                return;
            }

            // Kiem tra neu la media
            if (this.isMediaMessage(message)) {
                const randomResponse = DEFAULT_RESPONSES[Math.floor(Math.random() * DEFAULT_RESPONSES.length)];
                await (message.channel as TextChannel).send(randomResponse);
                return;
            }

            // Cap nhat lich su hoi thoai
            if (!this.conversationHistory.get(userId)) {
                this.conversationHistory.set(userId, []);
            }
            this.conversationHistory.get(userId)!.push({
                role: 'user',
                content: message.content
            });

            // Gioi han do dai lich su
            if (this.conversationHistory.get(userId)!.length > 10) {
                this.conversationHistory.get(userId)!.shift();
            }

            // Tao prompt voi context
            const context = this.conversationHistory.get(userId)!
                .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
                .join('\n');

            const prompt = `Context:\n${context}\n\nUser: ${message.content}\nAssistant: (Trả lời ngắn gọn, xưng "em" với người dùng, không được xưng "anh em")`;

            // Goi API Hugging Face
            const response = await hf.textGeneration({
                model: 'mistralai/Mistral-7B-Instruct-v0.2',
                inputs: prompt,
                parameters: {
                    max_length: 150,
                    temperature: 0.6,
                    top_p: 0.8,
                    repetition_penalty: 1.3,
                    do_sample: true,
                    num_return_sequences: 1,
                }
            });

            // Xu ly phan hoi
            let botResponse = response.generated_text.split('\n')[0].trim();
            botResponse = botResponse.replace(/^Assistant:\s*/, '');
            botResponse = botResponse.replace(/anh em/g, 'em'); // Thay the "anh em" thành "em" (nghe horni hon)

            // Cap nhat lich su voi phan hoi cua bot
            this.conversationHistory.get(userId)!.push({
                role: 'assistant',
                content: botResponse
            });

            // Gui phan hoi
            await (message.channel as TextChannel).send(botResponse);
        } catch (error) {
            console.error('⚠️ [ChatBotService] Lỗi khi xử lý tin nhắn:', error);
            try {
                await (message.channel as TextChannel).send('⚠️ Lỗi khi xử lý tin nhắn!');
            } catch (sendError) {
                console.error('⚠️ [ChatBotService] Lỗi khi gửi thông báo lỗi:', sendError);
            }
        }
    }

    private isEmojiMessage(message: Message): boolean {
        return /^<a?:.+?:\d+>$/.test(message.content) || 
               /^[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F100}-\u{1F1FF}\u{1F200}-\u{1F2FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{1F1E0}-\u{1F1FF}\u{2100}-\u{214F}\u{2300}-\u{23FF}\u{2B00}-\u{2BFF}\u{2900}-\u{297F}\u{2A00}-\u{2AFF}\u{2B50}\u{2934}-\u{2935}\u{3030}\u{303D}\u{3297}\u{3299}\u{FE0F}\u{200D}\u{20E3}\u{FE82}\u{FE83}\u{FE84}\u{FE85}\u{FE86}\u{FE87}\u{FE88}\u{FE89}\u{FE8A}\u{FE8B}\u{FE8C}\u{FE8D}\u{FE8E}\u{FE8F}\u{FE90}\u{FE91}\u{FE92}\u{FE93}\u{FE94}\u{FE95}\u{FE96}\u{FE97}\u{FE98}\u{FE99}\u{FE9A}\u{FE9B}\u{FE9C}\u{FE9D}\u{FE9E}\u{FE9F}\u{FEA0}\u{FEA1}\u{FEA2}\u{FEA3}\u{FEA4}\u{FEA5}\u{FEA6}\u{FEA7}\u{FEA8}\u{FEA9}\u{FEAA}\u{FEAB}\u{FEAC}\u{FEAD}\u{FEAE}\u{FEAF}\u{FEB0}\u{FEB1}\u{FEB2}\u{FEB3}\u{FEB4}\u{FEB5}\u{FEB6}\u{FEB7}\u{FEB8}\u{FEB9}\u{FEBA}\u{FEBB}\u{FEBC}\u{FEBD}\u{FEBE}\u{FEBF}\u{FEC0}\u{FEC1}\u{FEC2}\u{FEC3}\u{FEC4}\u{FEC5}\u{FEC6}\u{FEC7}\u{FEC8}\u{FEC9}\u{FECA}\u{FECB}\u{FECC}\u{FECD}\u{FECE}\u{FECF}\u{FED0}\u{FED1}\u{FED2}\u{FED3}\u{FED4}\u{FED5}\u{FED6}\u{FED7}\u{FED8}\u{FED9}\u{FEDA}\u{FEDB}\u{FEDC}\u{FEDD}\u{FEDE}\u{FEDF}\u{FEE0}\u{FEE1}\u{FEE2}\u{FEE3}\u{FEE4}\u{FEE5}\u{FEE6}\u{FEE7}\u{FEE8}\u{FEE9}\u{FEEA}\u{FEEB}\u{FEEC}\u{FEED}\u{FEEE}\u{FEEF}\u{FEF0}\u{FEF1}\u{FEF2}\u{FEF3}\u{FEF4}\u{FEF5}\u{FEF6}\u{FEF7}\u{FEF8}\u{FEF9}\u{FEFA}\u{FEFB}\u{FEFC}\u{FEFD}\u{FEFE}\u{FEFF}]+$/u.test(message.content);
    }

    private isMediaMessage(message: Message): boolean {
        return message.attachments.size > 0 || message.embeds.length > 0;
    }
}