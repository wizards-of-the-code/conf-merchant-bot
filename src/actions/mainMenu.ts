import { Markup } from 'telegraf';
import { InlineKeyboardButton } from 'telegraf/typings/core/types/typegram';
import TelegramBot from '../TelegramBot';

const mainMenu = async (bot: TelegramBot) => {
  bot.action('main_menu', async (ctx) => {
    const buttonsArray: InlineKeyboardButton.UrlButton[][] = [
      [Markup.button.url('Telegram', 'action_participate')],
      [Markup.button.url('Instagram', 'action_participate')],
      [Markup.button.url('Discord', 'action_participate')],
      [Markup.button.url('Github', 'action_participate')],
      [Markup.button.url('Twitter', 'action_participate')],
      [Markup.button.url('Facebook', 'action_participate')],
      [Markup.button.url('Официальный сайт', 'action_participate')],
    ];

    ctx.reply(
      'Наши социальные сети:',
      Markup.inlineKeyboard([
        ...buttonsArray,
      ]),
    );
  });
};

export default mainMenu;
