import { message } from 'telegraf/filters';
import { ObjectId } from 'mongodb';
import TelegramBot from '../TelegramBot';
import { addMessageToSession, deletePreveiosWelcomeMessage, getErrorMsg } from './helpers';

export enum CollectionEnum {
  Welcome = 'message-for-new-members',
}

export type WelcomeMessage = { message: string; title: string; _id: ObjectId; link?: string };

/**
 * @param {TelegramBot} bot;
 */
const onNewChatMembers = (bot: TelegramBot) => {
  bot.on(message('new_chat_members'), async (ctx) => {
    try {
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
        const newMemberName = newMember.username ? `@${newMember.username}` : newMember.first_name;

        const sentWelcomeMessage = await ctx.replyWithHTML(
          `${newMemberName}, ${msgObj.message} \n\n${footerObj.message}`,
        );

        if (ctx.session.messages?.length) {
          const prvieousMessage = ctx.session.messages.pop();
          await deletePreveiosWelcomeMessage(ctx, prvieousMessage);
        }

        addMessageToSession(
          {
            messageId: sentWelcomeMessage.message_id,
            chatId: sentWelcomeMessage.chat.id,
          },
          ctx,
        );

        // Deletes message that says that user is joined the group
        await ctx.deleteMessage(ctx.message.message_id);
      }
    } catch (e) {
      console.error(getErrorMsg(e));
    }
  });
};

export default onNewChatMembers;
