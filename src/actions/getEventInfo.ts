import { Markup } from 'telegraf';
import { InlineKeyboardButton } from 'telegraf/typings/core/types/typegram';
import { ObjectId } from 'mongodb';
import TelegramBot from '../TelegramBot';
import {
  Event, Participant,
} from '../types';
import { isValidUrl } from '../utils/isValidUrl';
import { IBotContext } from '../context/IBotContext';
// eslint-disable-next-line import/no-cycle
import { sendStartMessage } from '../commands/StartCommand';
import composeEventInfoBody from '../utils/composeEventInfoBody';
import parseActionParam from '../utils/parseActionParam';
import logger from '../logger/logger';
import getErrorMsg from '../utils/getErrorMessage';

export const sendEventInfoMessage = async (
  bot: TelegramBot,
  ctx: IBotContext,
  eventIdParam: string,
) => {
  try {
    const eventId: ObjectId = new ObjectId(eventIdParam);
    const event = await bot.dbManager.getDocumentData<Event>('events', { _id: eventId });

    if (!event) {
      ctx.session.selectedEvent = null;
      sendStartMessage(bot, ctx);
      return;
    }

    // Save event to current session context
    ctx.session.selectedEvent = event;
    ctx.session.userId = ctx.from?.id;

    const participant = await bot.dbManager.getDocumentData<Participant>('participants', { 'tg.tg_id': ctx.from!.id });
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

    await ctx.deleteMessage().catch(
      (error) => {
        logger.error(`Error when trying to delete message: ${getErrorMsg(error)}`);
      },
    );

    const buttons: (
      InlineKeyboardButton.CallbackButton | InlineKeyboardButton.UrlButton
    )[][] = [];

    // Register button if user is not already participate
    if (!isAlreadyParticipate) {
      buttons.unshift(
        [Markup.button.callback('📝 Зарегистрироваться', 'action_participate_participant')],
        [Markup.button.callback('Стать волонтером', 'action_participate_volunteer')],
        [Markup.button.callback('Хочу организовывать!', 'action_participate_organizer')],
      );
    }

    // TODO: Change unshift to push later
    if (event.schedule && event.schedule.length > 0) {
      buttons.unshift([Markup.button.callback('🗓 Расписание', `action_get_schedule_${eventId!}`)]);
    }

    // TODO: Change unshift to push later
    if (event.speakers && event.speakers.length > 0) {
      buttons.unshift([Markup.button.callback('👨‍👩‍👧‍👦 Участники', `action_get_speakers_${eventId!}`)]);
    }

    // Add link buttons if event has filled with valid fields
    if (await isValidUrl(event.tickets_link)) {
      buttons.push([Markup.button.url('🎟 Билеты', event.tickets_link)]);
    }

    if (await isValidUrl(event.link)) {
      buttons.push([Markup.button.url('🌐 Сайт фестиваля', event.link)]);
    }

    if (await isValidUrl(event.tg_channel)) {
      buttons.push([Markup.button.url('📣 Телеграм канал фестиваля', event.tg_channel)]);
    }

    // Cancel registration if user already participating but not paid yet
    if (isAlreadyParticipate && !isAlreadyPaid) {
      buttons.push([Markup.button.callback('❌ Отменить регистрацию', 'action_cancel_participation')]);
    }

    buttons.push(
      [Markup.button.callback('🌟 Стать спонсором', 'become_sponsor')],
    );

    buttons.push([Markup.button.callback('◀️ Назад', 'action_get_events'), Markup.button.callback('🔼 В главное меню', 'action_get_events')]);

    const message = await ctx.replyWithHTML(
      composeEventInfoBody(event),
      {
        ...Markup.inlineKeyboard(buttons),
        disable_web_page_preview: true,
      },
    );

    ctx.session.currentMessage = message.message_id;
  } catch (e) {
    logger.error(`Something went wrong, starting standard \\start sequence. Error message: ${getErrorMsg(e)}`);
    sendStartMessage(bot, ctx);
  }
};

const getEventInfo = async (bot: TelegramBot) => {
  bot.action(/action_get_info_/, async (ctx) => {
    const actionString = ctx.match.input;
    const eventId = parseActionParam(actionString);

    sendEventInfoMessage(bot, ctx, eventId);
  });
};

export default getEventInfo;
