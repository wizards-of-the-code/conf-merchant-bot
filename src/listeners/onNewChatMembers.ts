import { message } from 'telegraf/filters';
import TelegramBot from '../TelegramBot';
import { escapeTextForMarkdown2, getErrorMsg, mention } from './helpers';
import { getChatGreeting, handleDeletingPreviousMessage } from './dbRequests';

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
        const { welcomeMessage, footer } = await getChatGreeting(chat.title);
        const newMember = ctx.message.new_chat_members[0];
        const newMemberName = escapeTextForMarkdown2(newMember.username ?? newMember.first_name);

        const { message_id: messageId } = await ctx.sendMessage(
          `${mention(newMemberName, newMember.id)} ${welcomeMessage}\n\n${footer}`,
          {
            parse_mode: 'MarkdownV2',
          },
        );

        await handleDeletingPreviousMessage(ctx, {
          messageId,
          chatId: chat.id,
        });
      }
    } catch (e) {
      console.error(getErrorMsg(e));
    }
  });
};
export default onNewChatMembers;
