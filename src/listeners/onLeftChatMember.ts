import { message } from 'telegraf/filters';
import TelegramBot from '../TelegramBot';

/**
 * @param {TelegramBot} bot;
 */
const onLeftChatMember = (bot: TelegramBot) => {
  bot.on(message('left_chat_member'), (ctx) => {
    ctx.deleteMessage(ctx.message.message_id);
  });
};

export default onLeftChatMember;
