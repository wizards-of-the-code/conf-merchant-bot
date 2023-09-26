import TelegramBot from '../TelegramBot';
import { Event } from '../types';
import { IBotContext } from '../context/IBotContext';
import Paginator from '../utils/paginator';
import formatDateToDdMmYyyy from '../utils/dateFormat';
import logger from '../logger/logger';
import getErrorMsg from '../utils/getErrorMessage';

async function populateEventsList(
  bot: TelegramBot,
  ctx: IBotContext,
  increment: number = 0,
): Promise<void> {
  // Clean currently selected event in session
  ctx.session.selectedEvent = null;

  if (ctx.session.currentMessage && ctx.session.currentMessage !== -1) {
    await ctx.deleteMessage(ctx.session.currentMessage).catch(
      (error) => {
        logger.error(`Error when trying to delete message: ${getErrorMsg(error)}`);
      },
    );
  }

  const events = await bot.dbManager.getCollectionData<Event>('events', { is_active: true, is_finished: false });

  const paginatorOptions = {
    items: events,
    itemsPerPage: 5,
    increment,
    currentPage: ctx.session.currentPage || 0,
    itemToString: (event: any) => {
      const label = [event.location.city, event.location.country];
      // Add date if it exists
      if (event.datetime) label.push(formatDateToDdMmYyyy(event.datetime));
      return label.join(', ');
    },
    linkItem: (event: any) => `action_get_info_${event._id.toString()}`,
  };

  const messageText = 'Выберите интересующее вас мероприятие: ';
  const paginator = new Paginator(bot, messageText, paginatorOptions);
  paginator.handlePage(ctx);
}

export const sendEventsMessage = async (bot: TelegramBot, ctx: IBotContext) => {
  await populateEventsList(bot, ctx);
  bot.action('prev_page', (userCtx: IBotContext) => { populateEventsList(bot, userCtx, -1); });
  bot.action('next_page', (userCtx: IBotContext) => { populateEventsList(bot, userCtx, 1); });
};

const getEvents = async (bot: TelegramBot) => {
  bot.action('action_get_events', async (ctx) => {
    sendEventsMessage(bot, ctx);
  });
};

export default getEvents;
