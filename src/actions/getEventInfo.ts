import { Markup } from 'telegraf';
import { InlineKeyboardButton } from 'telegraf/typings/core/types/typegram';
import { ObjectId } from 'mongodb';
import TelegramBot from '../TelegramBot';
import {
  Event, Participant, ScheduleItem, Speaker,
} from '../types';
import { isValidUrl } from '../utils/isValidUrl';
import { IBotContext } from '../context/BotContext.interface';
// eslint-disable-next-line import/no-cycle
import { sendStartMessage } from '../commands/StartCommand';

export const sendEventInfoMessage = async (
  bot: TelegramBot,
  ctx: IBotContext,
  eventIdParam: string,
) => {
  // Get event id from context
  let eventId: ObjectId;
  let event: Event | null = null;

  // Get participant from DB
  const participant: Participant | null = await bot.dbManager.getParticipant(ctx.from!.id);

  try {
    eventId = new ObjectId(eventIdParam);
    event = await bot.dbManager.getEventById(eventId);
  } catch (e) {
    console.log('Incorrect ID string, starting standard \\start sequence.');
  }

  if (!event) {
    // console.log(`[${new Date().toLocaleTimeString('ru-RU')}]: Error: No event found`);
    sendStartMessage(bot, ctx);
  } else {
    // Save event to current session context
    ctx.session.selectedConf = event;

    // Check if user is already participate in the event
    let isAlreadyParticipate = false;
    let isAlreadyPaid = false;
    if (participant) {
      const eventDetails = participant.events.find(
        (e) => e.event_id.toString() === event!._id!.toString(),
      );

      if (eventDetails) {
        isAlreadyParticipate = true;
        isAlreadyPaid = eventDetails.is_payed;
      }
    }

    try {
      ctx.deleteMessage();
    } catch (e) {
      console.log('Error when trying to delete old message');
    }

    const buttonsArray: (
      InlineKeyboardButton.CallbackButton | InlineKeyboardButton.UrlButton
    )[][] = [
      [Markup.button.callback('🌟 Стать спонсором', 'action_become_sponsor')],
    ];

    // Register button if user is not already participate
    if (!isAlreadyParticipate) {
      buttonsArray.unshift([Markup.button.callback('📝 Зарегистрироваться', 'action_select_role')]);
    }

    const schedule: ScheduleItem[] = await bot.dbManager.getEventScheduleItems(eventId!);
    // TODO: Change unshift to push later
    if (schedule.length > 0) {
      buttonsArray.unshift([Markup.button.callback('🗓 Расписание', `action_get_schedule_${eventId!}`)]);
    }

    const speakers: Speaker[] = await bot.dbManager.getEventSpeakers(eventId!);
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

    // Cancel registration if user already participating but not paid yet
    if (isAlreadyParticipate && !isAlreadyPaid) {
      buttonsArray.push([Markup.button.callback('❌ Отменить регистрацию', 'action_cancel_participation')]);
    }

    buttonsArray.push([Markup.button.callback('◀️ Назад', 'action_get_events'), Markup.button.callback('🔼 В главное меню', 'action_get_events')]);

    // Message string array
    const messageArray: String[] = [
      `<b>Локация:</b> ${event.location.city}, ${event.location.country}`,
      `${event.description}`,
      `<b>Дата и время:</b>  ${event.datetime}`,
      `<b>Цена:</b>  ${event.currency} ${event.current_price}`,
    ];

    ctx.replyWithHTML(messageArray.join('\n\n'), Markup.inlineKeyboard(buttonsArray));
  }
};

const getEventInfo = async (bot: TelegramBot) => {
  bot.action(/action_get_info_/, async (ctx) => {
    const actionString = ctx.match.input;

    sendEventInfoMessage(bot, ctx, actionString.slice(actionString.lastIndexOf('_') + 1));
  });
};

export default getEventInfo;
