import { Markup } from 'telegraf';
import { InlineKeyboardButton } from 'telegraf/typings/core/types/typegram';
import { Sponsor, TelegramUser } from '../types';
import TelegramBot from '../TelegramBot';
import { IBotContext } from '../context/IBotContext';

const createSponsor = async (bot: TelegramBot, ctx: IBotContext) => {
  if (!ctx.from) {
    throw new Error('Internal bot error.');
  }

  const user: TelegramUser = {
    tg_id: ctx.from.id,
    username: ctx.from.username!,
    first_name: ctx.from.first_name,
    last_name: ctx.from.last_name,
  };

  const sponsor: Sponsor = {
    tg: user,
    donation: '',
  };

  return bot.dbManager.insertOrUpdateDocumentToCollection('sponsors', { 'tg.tg_id': user.tg_id }, { $set: sponsor });
};

const sponsorship = async (bot: TelegramBot) => {
  bot.action('become_sponsor', async (ctx) => {
    const result = await createSponsor(bot, ctx);

    const buttonsArray: (
      InlineKeyboardButton.CallbackButton | InlineKeyboardButton.UrlButton
    )[][] = [];

    if (result) {
      ctx.editMessageReplyMarkup(undefined);
      buttonsArray.push([Markup.button.url('Заполнить анкету спонсора', 'https://peredelanoconf.com/')]);
      ctx.reply('Спасибо за Вашу поддержку!');
    } else {
      ctx.reply('Вы снова наш спонсор, спасибо Вам!');
    }

    buttonsArray.push(
      [Markup.button.callback('Узнать больше', 'more_info')],
      [Markup.button.callback('Спонсорский пакет', 'sponsorship_pack')],
      [Markup.button.callback('Обсудить вопросы', 'discussion')],
      [Markup.button.callback('🔼 В главное меню', 'action_get_events')],
    );

    ctx.replyWithHTML('Больше подробностей:', Markup.inlineKeyboard(buttonsArray));
  });
};

export default sponsorship;
