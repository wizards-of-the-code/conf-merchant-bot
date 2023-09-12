import { message } from 'telegraf/filters';
import TelegramBot from '../TelegramBot';
import { escapeTextForMarkdown2, getErrorMsg } from './helpers';
import { getChatBotCollections, updateSentMessages, deleteEarlierMessage } from './dbRequests';

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
        // I get all chatbot collections at ones, so I don't need to do several requests to the db
        const { welcomeMessage, footer, sentMessages } = await getChatBotCollections(
          bot.dbManager,
          chat.title,
        );

        const newMember = ctx.message.new_chat_members[0];
        const newMemberName = escapeTextForMarkdown2(newMember.username ?? newMember.first_name);
        const newMemberMention = `[@${newMemberName}](tg://user?id=${newMember.id})`;

        const { message_id: messageId } = await ctx.sendMessage(
          `${newMemberMention} ${welcomeMessage}\n\n${footer}`,
          {
            parse_mode: 'MarkdownV2',
          },
        );

        const sentMessage = {
          chatId: chat.id,
          messageId,
          timestamp: Date.now(),
        };

        await deleteEarlierMessage(ctx, sentMessages);
        await updateSentMessages(bot.dbManager, sentMessage, sentMessages);
      }
    } catch (e) {
      console.error(getErrorMsg(e));
    }
  });
};
export default onNewChatMembers;
