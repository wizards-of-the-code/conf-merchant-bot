import { Markup } from 'telegraf';
import { InlineKeyboardButton } from 'telegraf/typings/core/types/typegram';
import { ObjectId } from 'mongodb';
import {
  Participant, TelegramUser, Event, Message, LogEntry, ParticipantEventDetails,
} from '../../data/types';
import TelegramBot from '../TelegramBot';
import parseActionParam from '../../utils/parseActionParam';
import sendMessage from '../../utils/sendMessage';
// import switchRoleMessage from '../utils/switchRoleMessage';
import { statuses, messages } from '../../data/constants';
import handleExpiredSession from '../../utils/handleExpiredSession';

const addParticipantToEvent = async (
  role: string,
  eventId: ObjectId | undefined,
  participantId: ObjectId | undefined,
  logData: LogEntry,
  bot: TelegramBot,
) => {
  await bot.dbManager.insertOrUpdateDocumentToCollection(
    'events',
    { _id: eventId },
    {
      $addToSet:
        { [role]: participantId },
    },
    logData,
  );
};

const createParticipantIfNeeded = async (bot: TelegramBot, ctx: any): Promise<Participant> => {
  // Check if user is already in the DB
  let participant = await bot.dbManager.getDocumentData<Participant>('participants', { 'tg.tg_id': ctx.from!.id });

  if (!participant) {
    // If not, create a new user entry
    const user: TelegramUser = {
      tg_id: ctx.from!.id,
      username: ctx.from!.username!,
      first_name: ctx.from!.first_name,
      last_name: ctx.from!.last_name,
    };

    participant = {
      tg: user,
      events: [],
    };

    const logData: LogEntry = {
      datetime: new Date(),
      initiator: user,
      event: undefined,
      status: statuses.NEW_PARTICIPANT,
      message: `New participant @${user.username} added`,
    };

    const participantId = await bot.dbManager.insertOrUpdateDocumentToCollection('participants', { 'tg.tg_id': user.tg_id }, { $set: participant }, logData);
    participant._id = participantId;
  }

  return participant;
};

const participate = async (bot: TelegramBot) => {
  bot.action(/signup_/, async (ctx) => {
    // Get role from actionString
    const actionString = ctx.match.input;
    const role: string = parseActionParam(actionString);

    if (!ctx.session.selectedEvent) {
      handleExpiredSession(bot, ctx);
      return;
    }
    const eventId = ctx.session.selectedEvent!._id;

    // Check if the event exists
    const event = await bot.dbManager.getDocumentData<Event>('events', { _id: eventId });

    // Create or get participant entry
    const participant = await createParticipantIfNeeded(bot, ctx);

    // Add the participant to the event
    const logData: LogEntry = {
      datetime: new Date(),
      initiator: participant.tg,
      event: event?._id,
      status: statuses.EVENT_UPDATE,
      message: `To event ${event?.name} added participant @${participant.tg.username}`,
    };

    // Add event details to the participant entry
    const eventDetails: ParticipantEventDetails = {
      event_id: eventId!,
      is_payed: false,
      role,
      attended: false,
    };

    await bot.dbManager.insertOrUpdateDocumentToCollection(
      'participants',
      { _id: participant._id },
      { $push: { events: eventDetails } },
    );
    // const userMessage = `Отлично, вы успешно записаны на конференцию ${event!.name}.`;
    let userMessage: any;

    // eslint-disable-next-line default-case
    switch (role) {
      case 'participant':
        addParticipantToEvent('participants', event?._id, participant._id, logData, bot);
        userMessage = await bot.dbManager.getDocumentData<Message>('messages', { name: messages.PARTICIPANT_MESSAGES });
        break;
      case 'volunteer':
        addParticipantToEvent('volunteers', event?._id, participant._id, logData, bot);
        userMessage = await bot.dbManager.getDocumentData<Message>('messages', { name: messages.VOLUNTEER_MESSAGES });
        break;
      case 'organizer':
        addParticipantToEvent('organizers', event?._id, participant._id, logData, bot);
        userMessage = await bot.dbManager.getDocumentData<Message>('messages', { name: messages.ORGANIZER_MESSAGES });
        break;
    }
    ctx.editMessageReplyMarkup(undefined);

    const buttons: InlineKeyboardButton.CallbackButton[][] = [
      // [
      //   Markup.button.callback('❌ Отменить регистрацию', 'cancel_participation'),
      // ],
      [
        Markup.button.callback('◀️ Назад', `info_${eventId}`),
        Markup.button.callback('🔼 В главное меню', 'menu'),
      ],
    ];

    sendMessage(userMessage, ctx, bot, buttons);
  });
};

export default participate;
