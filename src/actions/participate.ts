import { ObjectId } from 'mongodb';
import { Markup } from 'telegraf';
import { InlineKeyboardButton } from 'telegraf/typings/core/types/typegram';
import {
  Participant, TelegramUser, Event, Message, LogEntry, ParticipantEventDetails,
} from '../types';
import TelegramBot from '../TelegramBot';
import parseActionParam from '../utils/parseActionParam';
import sendMessage from '../utils/sendMessage';
import switchRoleMessage from '../utils/switchRoleMessage';
import { statuses } from '../constants';

const participate = async (bot: TelegramBot) => {
  bot.action(/action_participate_/, async (ctx) => {
    // Get role from actionString
    const actionString = ctx.match.input;
    const role: string = parseActionParam(actionString);
    const eventId = ctx.session.selectedEvent!._id;

    // TODO: Check if event exists
    const event = await bot.dbManager.getDocumentData<Event>('events', { _id: eventId });

    // Check if user if already in DB
    let participant = await bot.dbManager.getDocumentData<Participant>('participants', { 'tg.id': ctx.from!.id });
    let participantId: ObjectId | undefined;
    let logData: LogEntry;

    if (!participant) {
      // If no - create new user first
      const user: TelegramUser = {
        id: ctx.from!.id,
        username: ctx.from!.username!,
        first_name: ctx.from!.first_name,
        last_name: ctx.from!.last_name,
      };

      participant = {
        tg: user,
        events: [],
      };

      logData = {
        datetime: new Date(),
        initiator: user,
        event: event?._id,
        status: statuses.NEW_PARTICIPANT,
        message: `New participant @${user.username} added`,
      };

      participantId = await bot.dbManager.insertOrUpdateDocumentToCollection('participants', { 'tg.id': user.id }, { $set: participant }, logData);
      participant._id = participantId;
    }

    // Add him to participates array of Event object
    logData = {
      datetime: new Date(),
      initiator: participant.tg,
      event: event?._id,
      status: statuses.EVENT_UPDATE,
      message: `To event ${event?.name} added participant @${participant.tg.username}`,
    };
    await bot
      .dbManager
      .insertOrUpdateDocumentToCollection('events', { _id: event?._id }, { $addToSet: { participants: participant._id } }, logData);

    // Add event details to Participant entry
    const eventDetails: ParticipantEventDetails = {
      event_id: eventId!,
      is_payed: false,
      role,
      attended: false,
    };

    await bot.dbManager.insertOrUpdateDocumentToCollection('participants', { _id: participant._id }, { $push: { events: eventDetails } });

    const userMessage = `Отлично, вы успешно записаны на конференцию ${event!.name}.`;

    ctx.editMessageReplyMarkup(undefined);

    const buttons: (
      InlineKeyboardButton.CallbackButton | InlineKeyboardButton.UrlButton
    )[][] = [
      [
        Markup.button.callback('❌ Отменить регистрацию', 'action_cancel_participation'),
      ],
      [
        Markup.button.callback('◀️ Назад', `action_get_info_${eventId}`),
        Markup.button.callback('🔼 В главное меню', 'action_get_events'),
      ]];

    // Get message from DB
    const roleMessage = await bot.dbManager.getDocumentData<Message>('messages', { name: switchRoleMessage(role) });

    if (roleMessage) {
      /* If role need special message - send confirmation first and then
         send roleMessages with buttons attache to the last one */
      await ctx.reply(userMessage);
      await sendMessage(roleMessage, ctx, buttons);
    } else {
      // Else just send confirmation message with buttons
      ctx.reply(userMessage, Markup.inlineKeyboard([
        [
          Markup.button.callback('❌ Отменить регистрацию', 'action_cancel_participation'),
        ],
        [
          Markup.button.callback('◀️ Назад', `action_get_info_${eventId}`),
          Markup.button.callback('🔼 В главное меню', 'action_get_events'),
        ],
      ]));
    }
  });
};

export default participate;
