// import { Markup } from 'telegraf';
import TelegramBot from '../TelegramBot';
import { Event } from '../types';
import { IBotContext } from '../context/IBotContext';
import Paginator from '../utils/paginator';
import { ObjectId } from 'mongodb';

export const sendEventsMessage = async (bot: TelegramBot, ctx: IBotContext) => {
  const events = await bot.dbManager.getCollectionData<Event>('events', { is_active: true });
  try {
    ctx.deleteMessage();
  } catch (e) {
    console.log('Error when trying to delete old message');
  }

  // const confs = events.map((event) =>
  // [Markup.button.callback(`${event.location.city}, ${event.location.country}, ${event.datetime}`
  // , `action_get_info_${event._id!.toString()}`)]);

  const paginatorOptions = {
    items: events,
    itemsPerPage: 2,
    itemToString: (item: any) => item.name.toString(),
    linkItem: (event: any) => event._id.toString(),
  };
  const paginator = new Paginator('Выберите мероприятие', paginatorOptions);
  paginator.sendPage(ctx);
  // console.log(paginator);
  // ctx.reply(
  //   'Какая именно конференция вас интересует?',
  //   Markup.inlineKeyboard([...confs,
  //     [Markup.button.callback('prev', 'page_0'), Markup.button.callback('next', 'page_1')]]),
  // );
};

const getEvents = async (bot: TelegramBot) => {
  bot.action('action_get_events', async (ctx) => {
    sendEventsMessage(bot, ctx);
  });
};

export default getEvents;
