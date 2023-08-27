import { Markup } from 'telegraf';
import { InlineKeyboardButton } from 'telegraf/typings/core/types/typegram';
import { ObjectId } from 'mongodb';
import TelegramBot from '../TelegramBot';
import { ScheduleItem, Speaker, Event } from '../types';
import { isValidUrl } from '../utils/isValidUrl';
import { IBotContext } from '../context/IBotContext';
// eslint-disable-next-line import/no-cycle
import { sendStartMessage } from '../commands/StartCommand';

export const sendEventInfoMessage = async (
  bot: TelegramBot,
  ctx: IBotContext,
  eventIdParam: string,
) => {
  try {
    const eventId: ObjectId = new ObjectId(eventIdParam);
    const event = await bot.dbManager.getDocumentData<Event>('events', { _id: eventId });

    if (!event) {
      // console.log(`[${new Date().toLocaleTimeString('ru-RU')}]: Error: No event found`);
      sendStartMessage(bot, ctx);
      return;
    }
    // Save event to current session context
    ctx.session.selectedEvent = event;
    ctx.session.userId = ctx.from?.id;

    try {
      ctx.deleteMessage();
    } catch (e) {
      console.log('Error when trying to delete old message');
    }

    const buttonsArray: (
      InlineKeyboardButton.CallbackButton | InlineKeyboardButton.UrlButton
    )[][] = [
      [Markup.button.callback('📝 Зарегистрироваться', 'action_select_role')],
      [Markup.button.callback('🌟 Стать спонсором', 'action_become_sponsor')],
    ];

    const schedule = await bot.dbManager.getCollectionData<ScheduleItem>('schedule', { event_id: eventId });
    // TODO: Change unshift to push later
    if (schedule.length > 0) {
      buttonsArray.unshift([Markup.button.callback('🗓 Расписание', `action_get_schedule_${eventId!}`)]);
    }

    const speakers = await bot.dbManager.getCollectionData<Speaker>('speakers', { event_id: eventId });
    // TODO: Change unshift to push later
    if (speakers.length > 0) {
      buttonsArray.unshift([Markup.button.callback('👨‍👩‍👧‍👦 Участники', `action_get_speakers_${eventId!}`)]);
    }

    // Add link buttons if event has filled with valid fields
    if (await isValidUrl(event.tickets_link)) {
      buttonsArray.push([Markup.button.url('🎟 Билеты', event.tickets_link)]);
    }

    if (await isValidUrl(event.link)) {
      buttonsArray.push([Markup.button.url('🌐 Сайт фестиваля', event.link)]);
    }

    if (await isValidUrl(event.tg_channel)) {
      buttonsArray.push([Markup.button.url('📣 Телеграм канал фестиваля', event.tg_channel)]);
    }

    // TODO: Implement "Back to menu" button
    buttonsArray.push([Markup.button.callback('◀️ Назад', 'action_get_events'), Markup.button.callback('🔼 В главное меню', 'action_get_events')]);

    // Message string array
    const messageArray: String[] = [
      `<b>Локация:</b> ${event.location.city}, ${event.location.country}`,
      `${event.description}`,
      `<b>Дата и время:</b>  ${event.datetime}`,
      `<b>Цена:</b>  ${event.currency} ${event.current_price}`,
    ];

    ctx.replyWithHTML(messageArray.join('\n\n'), Markup.inlineKeyboard(buttonsArray));
  } catch (e) {
    console.log('Incorrect ID string, starting standard \\start sequence.');
    sendStartMessage(bot, ctx);
  }
};

const getEventInfo = async (bot: TelegramBot) => {
  bot.action(/action_get_info_/, async (ctx) => {
    const actionString = ctx.match.input;
    const eventId = actionString.slice(actionString.lastIndexOf('_') + 1);
    sendEventInfoMessage(bot, ctx, eventId);
  });
};

export default getEventInfo;
