import { message } from 'telegraf/filters';
import TelegramBot from '../TelegramBot';
import { escapeTextForMarkdown2, getErrorMsg } from './helpers';

/**
 * @param bot
 */
const onNewMessage = (bot: TelegramBot) => {
  bot.on(message('text'), async (ctx) => {
    try {
      const user = ctx.message.from;
      const newMemberMention = `[@${escapeTextForMarkdown2(
        user.username ?? user.first_name,
      )}](tg://user?id=${user.id})`;

      await ctx.sendMessage(`${newMemberMention} \n\nHello there`, {
        parse_mode: 'MarkdownV2',
      });
    } catch (e) {
      console.error(getErrorMsg(e));
    }
  });
};
export default onNewMessage;
