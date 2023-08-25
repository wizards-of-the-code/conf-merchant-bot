import { Markup } from 'telegraf';
import TelegramBot from '../TelegramBot';
import { Event } from '../types';
import { IBotContext } from '../context/IBotContext';

export const sendEventsMessage = async (bot: TelegramBot, ctx: IBotContext) => {
  const eventsArr: Event[] = await bot.dbManager.getEvents();

  ctx.deleteMessage();
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
