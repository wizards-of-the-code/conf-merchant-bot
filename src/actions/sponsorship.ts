import { Markup } from 'telegraf';
import { InlineKeyboardButton } from 'telegraf/typings/core/types/typegram';
import { Sponsor, TelegramUser, Message } from '../types';
import TelegramBot from '../TelegramBot';
import { IBotContext } from '../context/IBotContext';
import { messages } from '../constants';
import sendMessage from '../utils/sendMessage';

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
    await createSponsor(bot, ctx);

    const buttonsArray: (
      InlineKeyboardButton.CallbackButton | InlineKeyboardButton.UrlButton
    )[][] = [
      // TODO: more_info action!!
      [Markup.button.callback('Узнать больше', 'more_info')],
      [Markup.button.callback('🔼 В главное меню', 'action_get_events')],
    ];

    const sponsorMessage = await bot.dbManager.getDocumentData<Message>('messages', { name: messages.SPONSOR_MESSAGES });
    if (sponsorMessage) {
      await sendMessage(sponsorMessage, ctx, bot, buttonsArray);
    }
  });
};

export default sponsorship;
