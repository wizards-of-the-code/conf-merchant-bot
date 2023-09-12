import { message } from 'telegraf/filters';
import TelegramBot from '../TelegramBot';
import {
  deleteLastSentWelcomeMessage,
  escapeTextForMarkdown2,
  getErrorMsg,
  getMessageAndFooterForChat,
  updateLastSentWelcomeMessage,
} from './helpers';

/**
 * @param {TelegramBot} bot;
 */
const onNewChatMembers = (bot: TelegramBot) => {
  bot.on(message('new_chat_members'), async (ctx) => {
    try {
      // Deletes message that says that user has joined the group
      await ctx.deleteMessage(ctx.message.message_id);

      const { chat } = ctx;
      if ('title' in chat) {
        const { welcomeMessage, footer } = await getMessageAndFooterForChat(
          bot.dbManager,
          chat.title,
        );

        const newMember = ctx.message.new_chat_members[0];
        const newMemberName = escapeTextForMarkdown2(newMember.username ?? newMember.first_name);
        const newMemberMention = `[@${newMemberName}](tg://user?id=${newMember.id})`;

        const sentWelcomeMessage = await ctx.sendMessage(
          `${newMemberMention} ${welcomeMessage.message}\n\n${footer.message}`,
          {
            parse_mode: 'MarkdownV2',
          },
        );

        await deleteLastSentWelcomeMessage(ctx, bot.dbManager);
        await updateLastSentWelcomeMessage(
          {
            chatId: sentWelcomeMessage.chat.id,
            messageId: sentWelcomeMessage.message_id,
          },
          bot.dbManager,
        );
      }
    } catch (e) {
      console.error(getErrorMsg(e));
    }
  });
};
export default onNewChatMembers;
