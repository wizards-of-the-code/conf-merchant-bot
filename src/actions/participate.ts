import { ObjectId } from 'mongodb';
import { Markup } from 'telegraf';
import { Participant, TelegramUser } from '../types';
import TelegramBot from '../TelegramBot';
import parseActionParam from '../utils/parseActionParam';

const participate = async (bot: TelegramBot) => {
  bot.action(/action_participate_/, async (ctx) => {
    // Get role from actionString
    const actionString = ctx.match.input;
    const role: string = parseActionParam(actionString);
    const eventId = ctx.session.selectedEvent!._id;

    // TODO: Check if event exists
    const event = await bot.dbManager.getEventById(new ObjectId(eventId));

    // Check if user if already in DB
    let participant: Participant | null = await bot.dbManager.getParticipant(ctx.from!.id);
    let participantId: ObjectId | undefined;

    if (!participant) {
      // If no - create new user first
      const user: TelegramUser = {
        id: ctx.from!.id,
        first_name: ctx.from!.first_name,
        last_name: ctx.from!.last_name,
      };

      participant = {
        tg: user,
        events: [],
      };

      participantId = await bot.dbManager.insertParticipant(participant);
      participant._id = participantId;
    }

    // If yes - add him to participates array of Event object
    const addToEventResult = await bot
      .dbManager
      .addParticipantToEvent(new ObjectId(eventId), participant);

    let userMessage: string;

    if (addToEventResult.modifiedCount > 0) {
      // Add event details to Participant entry
      await bot.dbManager.addEventDetailsToParticipant(new ObjectId(eventId), participant!, role);
      // TODO: Handle result of addEventDetailsToParticipant

      userMessage = `Отлично, вы успешно записаны на конференцию ${event!.name}.`;
    } else {
      // TODO: Easier to hide the button or change it to "Unsibscribe" in the future
      userMessage = 'Вы уже записаны на эту конференцию! :)';
    }

    ctx.editMessageReplyMarkup(undefined);
    ctx.reply(userMessage, Markup.inlineKeyboard(
      [
        Markup.button.callback('◀️ Назад', `action_get_info_${eventId}`),
        Markup.button.callback('🔼 В главное меню', 'action_get_events'),
      ],
    ));
  });
};

export default participate;
