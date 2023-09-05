import { Markup } from 'telegraf';
import { InlineKeyboardButton } from 'telegraf/typings/core/types/typegram';
import { Sponsor, TelegramUser } from '../types';
import TelegramBot from '../TelegramBot';

const createSponsor = async (ctx: any) => {
  if (!ctx.from) {
    throw new Error('Internal bot error.');
  }

  const user: TelegramUser = {
    id: ctx.from.id,
    username: ctx.from.username!,
    first_name: ctx.from.first_name,
    last_name: ctx.from.last_name,
  };

  const sponsor: Sponsor = {
    tg: user,
    donation: '',
  };

  return ctx.dbManager.insertOrUpdateDocumentToCollection('sponsors', { 'tg.id': user.id }, { $set: sponsor });
};

const sponsorship = async (bot: TelegramBot) => {
  bot.action('become_sponsor', async (ctx) => {
    const result = await createSponsor(ctx);

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

    ctx.replyWithHTML('', Markup.inlineKeyboard(buttonsArray));
  });
};

export default sponsorship;
