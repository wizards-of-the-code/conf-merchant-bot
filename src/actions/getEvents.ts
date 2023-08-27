import { Markup } from 'telegraf';
import TelegramBot from '../TelegramBot';
import { Event } from '../types';
import { IBotContext } from '../context/IBotContext';

export const sendEventsMessage = async (bot: TelegramBot, ctx: IBotContext) => {
  const eventsArr = await bot.dbManager.getCollectionData<Event>('events', { is_active: true });
  try {
    ctx.deleteMessage();
  } catch (e) {
    console.log('Error when trying to delete old message');
  }

  const confs = eventsArr.map((event) => [Markup.button.callback(`${event.location.city}, ${event.location.country}, ${event.datetime}`, `action_get_info_${event._id!.toString()}`)]);

  ctx.reply('Какая именно конференция вас интересует?', Markup.inlineKeyboard([
    ...confs,
  ]));
};

const getEvents = async (bot: TelegramBot) => {
  bot.action('action_get_events', async (ctx) => {
    sendEventsMessage(bot, ctx);
  });
};

export default getEvents;
