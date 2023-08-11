import { Markup } from 'telegraf';
import TelegramBot from '../TelegramBot';
import { Event } from '../types';

const getEvents = async (bot: TelegramBot) => {
  bot.action('action_get_events', async (ctx) => {
    const eventsArr: Event[] = await bot.dbManager.getEvents();

    ctx.deleteMessage();
    const confs = eventsArr.map((event) => [Markup.button.callback(`${event.location} ${event.datetime}`, `action_get_info_${event._id!.toString()}`)]);

    ctx.reply('Какая именно конференция вас интересует?', Markup.inlineKeyboard([
      ...confs,
    ]));
  });
};

export default getEvents;
