import { Sponsor, TelegramUser, Message } from '../../data/types';
import TelegramBot, { BotContext } from '../TelegramBot';
import { messages } from '../../data/constants';
import sendMessage from '../../utils/sendMessage';

const createSponsor = async (bot: TelegramBot, ctx: BotContext) => {
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
  bot.action('sponsorship', async (ctx) => {
    await createSponsor(bot, ctx);

    const sponsorMessage = await bot.dbManager.getDocumentData<Message>('messages', { name: messages.SPONSOR_MESSAGES });
    if (sponsorMessage) {
      // Remove keyboard from the last message
      ctx.editMessageReplyMarkup(undefined);

      await sendMessage(sponsorMessage, ctx, bot);
    }
  });
};

export default sponsorship;
