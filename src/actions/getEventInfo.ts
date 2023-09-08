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
        console.error('Error when trying to delete message: ', error);
      },
    );

    const buttonsArray: (
      InlineKeyboardButton.CallbackButton | InlineKeyboardButton.UrlButton
    )[][] = [
      [Markup.button.callback('🌟 Стать спонсором', 'become_sponsor')],
    ];

    // Register button if user is not already participate
    if (!isAlreadyParticipate) {
      buttonsArray.unshift([Markup.button.callback('📝 Зарегистрироваться', 'action_select_role')]);
    }

    // TODO: Change unshift to push later
    if (event.schedule && event.schedule.length > 0) {
      buttonsArray.unshift([Markup.button.callback('🗓 Расписание', `action_get_schedule_${eventId!}`)]);
    }

    // TODO: Change unshift to push later
    if (event.speakers && event.speakers.length > 0) {
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

    const message = await ctx.replyWithHTML(
      composeEventInfoBody(event),
      Markup.inlineKeyboard(buttonsArray),
    );
    ctx.session.currentMessage = message.message_id;
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
