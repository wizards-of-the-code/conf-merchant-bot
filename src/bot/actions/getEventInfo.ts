import { Markup } from 'telegraf';
import { InlineKeyboardButton } from 'telegraf/typings/core/types/typegram';
import { ObjectId } from 'mongodb';
import TelegramBot, { BotContext } from '../TelegramBot';
import {
  Event, Participant,
} from '../../data/types';
// import { isValidUrl } from '../../utils/isValidUrl';
// eslint-disable-next-line import/no-cycle
import { sendStartMessage } from '../commands/StartCommand';
import composeEventInfoBody from '../../utils/composeEventInfoBody';
import parseActionParam from '../../utils/parseActionParam';
import logger from '../../data/logger/logger';
import getErrorMsg from '../../utils/getErrorMessage';

export const sendEventInfoMessage = async (
  bot: TelegramBot,
  ctx: BotContext,
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
        [Markup.button.callback('📝 Зарегистрироваться', 'signup_participant')],
        [Markup.button.callback('🙋‍♂️ Стать волонтером', 'signup_volunteer')],
        [Markup.button.callback('😎 Хочу организовывать!', 'signup_organizer')],
      );
    }

    // TODO: Change unshift to push later
    if (event.schedule && event.schedule.length > 0) {
      buttons.unshift([Markup.button.callback('🗓 Расписание', `schedule_${eventId!}`)]);
    }

    // TODO: Change unshift to push later
    if (event.speakers && event.speakers.length > 0) {
      buttons.unshift([Markup.button.callback('👨‍👩‍👧‍👦 Спикеры', `speakers_${eventId!}`)]);
    }

    // TODO rewrite hardcoded links!!!!
    // Add link buttons if event has filled with valid fields
    // if (await isValidUrl(event.tickets_link)) {
    //   buttons.push([Markup.button.url('🎟 Билеты', event.tickets_link)]);
    // }

    // if (await isValidUrl(event.link)) {
    //   buttons.push([Markup.button.url('🌐 Сайт фестиваля', event.link)]);
    // }

    // if (await isValidUrl(event.tg_channel)) {
    //   buttons.push([Markup.button.url('📣 Телеграм канал фестиваля', event.tg_channel)]);
    // }

    // Cancel registration if user already participating but not paid yet
    if (isAlreadyParticipate && !isAlreadyPaid) {
      buttons.push([Markup.button.callback('❌ Отменить регистрацию', 'cancel_participation')]);
    }

    buttons.push(
      [Markup.button.callback('🌟 Стать спонсором', 'sponsorship')],
    );

    buttons.push([Markup.button.callback('◀️ Назад', 'events'), Markup.button.callback('🔼 В главное меню', 'menu')]);

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
    await sendStartMessage(bot, ctx);
  }
};

const getEventInfo = async (bot: TelegramBot) => {
  bot.action(/info_/, async (ctx) => {
    const actionString = ctx.match.input;
    const eventId = parseActionParam(actionString);

    await sendEventInfoMessage(bot, ctx, eventId);
  });
};

export default getEventInfo;