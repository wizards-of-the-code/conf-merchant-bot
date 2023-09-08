import TelegramBot from '../TelegramBot';
import { Event } from '../types';
import { IBotContext } from '../context/IBotContext';
import Paginator from '../utils/paginator';
import formatDateToDdMmYyyy from '../utils/dateFormat';

export const sendEventsMessage = async (bot: TelegramBot, ctx: IBotContext) => {
  await ctx.deleteMessage().catch(
    (error) => {
      console.error('Error when trying to delete message: ', error);
    },
  );

  const events = await bot.dbManager.getCollectionData<Event>('events', { is_active: true });

  const paginatorOptions = {
    items: events,
    itemsPerPage: 5,
    itemToString: (event: any) => [event.location.city, event.location.country, formatDateToDdMmYyyy(event.datetime)].join(', '),
    linkItem: (event: any) => `action_get_info_${event._id.toString()}`,
  };

  const messageText = 'Выберите интересующее вас мероприятие: ';
  const paginator = new Paginator(messageText, paginatorOptions);
  paginator.sendPage(ctx);

  bot.action('prev_page', () => { paginator.handlePreviousPage(ctx); });
  bot.action('next_page', () => { paginator.handleNextPage(ctx); });
};

const getEvents = async (bot: TelegramBot) => {
  bot.action('action_get_events', async (ctx) => {
    sendEventsMessage(bot, ctx);
  });
};

export default getEvents;
