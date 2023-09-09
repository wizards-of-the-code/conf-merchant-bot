import { message } from 'telegraf/filters';
import { ObjectId } from 'mongodb';
import TelegramBot from '../TelegramBot';
import {
  addLastSentMessageToSession,
  deleteLastSentWelcomeMessage,
  escapeTextForMarkdown2,
  getErrorMsg,
} from './helpers';

export enum CollectionEnum {
  Welcome = 'message-for-new-members',
}

export type WelcomeMessage = { message: string; title?: string; _id: ObjectId; forChat?: string };

/**
 * @param {TelegramBot} bot;
 */
const onNewChatMembers = (bot: TelegramBot) => {
  bot.on(message('new_chat_members'), async (ctx) => {
    try {
      // Deletes message that says that user has joined the group
      await ctx.deleteMessage(ctx.message.message_id);

      await deleteLastSentWelcomeMessage(ctx);

      const { chat } = ctx;
      if ('title' in chat) {
        const collectionMessage = await bot.dbManager.getCollectionData<WelcomeMessage>(
          CollectionEnum.Welcome,
          {
            forChat: chat.title,
          },
        );
        const collectionFooter = await bot.dbManager.getCollectionData<WelcomeMessage>(
          CollectionEnum.Welcome,
          {
            title: 'Footer',
          },
        );
        if (!collectionFooter.length || !collectionMessage.length) {
          throw new Error(`Welcome message for "${chat.title}" is not found`);
        }
        const msgObj = collectionMessage[0];
        const footerObj = collectionFooter[0];

        const newMember = ctx.message.new_chat_members[0];
        const newMemberName = escapeTextForMarkdown2(newMember.username ?? newMember.first_name);
        const newMemberMention = `[@${newMemberName}](tg://user?id=${newMember.id})`;

        const sentWelcomeMessage = await ctx.sendMessage(
          `${newMemberMention} ${msgObj.message}\n\n${footerObj.message}`,
          {
            parse_mode: 'MarkdownV2',
          },
        );

        addLastSentMessageToSession(
          {
            messageId: sentWelcomeMessage.message_id,
            chatId: sentWelcomeMessage.chat.id,
          },
          ctx,
        );
      }
    } catch (e) {
      console.error(getErrorMsg(e));
    }
  });
};
export default onNewChatMembers;
