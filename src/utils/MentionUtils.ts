// import { ChatInputCommandInteraction, Guild, GuildMember, Message, User } from 'discord.js';

// export class MentionUtils {
//     constructor() {}

//     getMentionedUser(interactionOrMessage: Message | ChatInputCommandInteraction, args: string[] = []): User | null {
//         if ('isChatInputCommand' in interactionOrMessage && interactionOrMessage.isChatInputCommand())
//             return interactionOrMessage.options.getUser('user') || interactionOrMessage.user;

//         return interactionOrMessage.mentions.users.first() || null;
//     }

//     async getMember(guild: Guild, userId: string): Promise<GuildMember | null> {
//         try {
//             return await guild.members.fetch(userId);
//         } catch {
//             return null;
//         }
//     }

//     getTargetUser(interactionOrMessage: ChatInputCommandInteraction | Message, args?: string[]): User {
//         let user = this.getMentionedUser(interactionOrMessage, args);
//         if (!user)
//             user = interactionOrMessage instanceof Message ? interactionOrMessage.author : interactionOrMessage.user;

//         return user;
//     }
// }

// KHONG CAN LOP NAY NUA
